import path from 'path'
import fs from 'fs'
import { rm } from 'fs/promises'
import chalk from '../library/ansi.js'
import pino from '../library/logger.js'
import { fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { makeWASocket } from '../library/simple.js'
import { useOptimizedAuthState } from '../library/sqliteAuthState.js'
import { attachSessionState, createMessageRetryCache } from './session-manager.js'
import { alignSocketTelemetry } from './socket-telemetry.js'
import { getBaileysExport, getSignalKeyStore } from './baileys-compat.js'
import { isChatBannedForBot, normalizeSessionJid } from './session-utils.js'
import { sanitizePairingNumber } from './identity-utils.js'
import { rememberMapping } from './lid-registry.js'
import { countActiveSubbots, deleteSubbotRecord, listSubbots, updateSubbot, upsertSubbot } from './subbot-store.js'
import { readSubbotLimit } from '../config/subbot-limit.js'
import { subbotBootQueue } from './subbot-boot-queue.js'
import { attachSubbotMemoryManager, sweepSubbotSocket } from './subbot-memory-manager.js'

const managed = new Map()
const reconnecting = new Set()
export const subbotBaseDir = path.join(process.cwd(), 'Rubyjadibot')
const baseDir = subbotBaseDir
const INVALID_SESSION_STATUS = new Set([401, 403, 405, 440])
const TRANSIENT_SESSION_STATUS = new Set([0, 408, 428, 429, 500, 502, 503, 504, 515])
attachSubbotMemoryManager(() => [...managed.values()].map(item => item.sock).filter(Boolean), { key: 'subbot-engine' })

function delayFor(attempt = 0, override = 0) {
const base = Math.min(300000, 2500 * (2 ** Math.min(attempt, 7)))
const retryAfter = Number(override) || 0
const jitter = Math.floor(Math.random() * Math.min(base, 30000))
return Math.max(retryAfter, base + jitter)
}

/**
 * Aprende los pares lid<->pn que expone la metadata de un grupo.
 *
 * Es la misma fuente que usa el pipeline del bot principal, y alimenta el registro de
 * alias GLOBAL: por eso un Sub-Bot que ve un grupo mejora la resolucion de identidades
 * para todo el ecosistema, incluida la base de datos de economia.
 */
function learnIdentitiesFromParticipants(participants = []) {
for (const participant of Array.isArray(participants) ? participants : []) {
const lid = participant?.lid
if (!lid) continue
const phone = [participant?.jid, participant?.id, participant?.phoneNumber].find(candidate => typeof candidate === 'string' && candidate.endsWith('@s.whatsapp.net'))
if (phone) rememberMapping(lid, phone)
}
}

function statusCodeFrom(error) {
return Number(error?.output?.statusCode || error?.data?.statusCode || error?.statusCode || error?.reason || 0)
}

function isTransientSessionError(error) {
const code = statusCodeFrom(error)
const text = String(error?.message || error?.output?.payload?.message || error || '').toLowerCase()
return TRANSIENT_SESSION_STATUS.has(code) || /timed?\s*out|econnreset|enotfound|etimedout|socket|stream|restart|required|unavailable|connection|network/i.test(text)
}

function isInvalidSessionError(error) {
const code = statusCodeFrom(error)
const text = String(error?.message || error?.output?.payload?.message || error || '').toLowerCase()
return INVALID_SESSION_STATUS.has(code) || /logged\s*out|invalid|expired|corrupt|bad\s*mac|decrypt|auth|creds|session/i.test(text)
}

async function resolveBaileysVersion() {
const { version } = await fetchLatestBaileysVersion()
return version
}

function rubyConsole(kind, text) {
const palette = kind === 'online' ? '#7CFFCB' : kind === 'purge' ? '#FF5C8A' : '#B987FF'
return chalk.hex(palette)([
'┏━━ ruby-hoshino.signal ━━━━━━━━━━━━━━━┓',
`┃ ${text}`,
'┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'
].join('\n'))
}

function scheduleInvalidSessionCleanup({ botJid, sessionId, sessionPath, sock, error }) {
const label = botJid || sessionId || sessionPath
sweepSubbotSocket(sock)
try { sock?.end?.() || sock?.ws?.close?.() } catch {}
managed.delete(sessionId)
deleteSubbotRecord(botJid, sessionId)
deleteSubbotRecord(`pending:${sessionId}`, sessionId)
try {
fs.rmSync(sessionPath, { recursive: true, force: true })
console.log(rubyConsole('purge', `${label} eliminado por sesión inválida ${statusCodeFrom(error) || ''}`.trim()))
} catch (cleanupError) {
console.error(rubyConsole('purge', `no se pudo limpiar ${label}: ${cleanupError.message}`))
}
}

/**
 * Espera a que el socket abra su "ventana de pairing".
 *
 * `requestPairingCode()` solo provoca la notificacion push en el telefono si se llama
 * DESPUES de que Baileys completo el handshake inicial y emitio su primer
 * `connection.update` (el que trae `qr` o `connection: 'connecting'`). Si se llama antes
 * —como hacia el `setTimeout` ciego de 3s— el servidor devuelve un codigo valido pero
 * no lo asocia a una sesion anunciada, y el push nunca se emite.
 */
export function waitForPairingWindow(sock, timeoutMs = 20000) {
if (!sock?.ev?.on) return Promise.resolve()
if (sock.authState?.creds?.registered) return Promise.resolve()
return new Promise(resolve => {
let settled = false
const finish = () => {
if (settled) return
settled = true
clearTimeout(timer)
try { sock.ev.off('connection.update', onUpdate) } catch {}
resolve()
}
const onUpdate = update => {
// Cualquiera de estas señales indica que el socket ya se anuncio al servidor.
if (update?.qr || update?.connection === 'connecting' || update?.connection === 'open') finish()
}
const timer = setTimeout(finish, timeoutMs)
timer.unref?.()
sock.ev.on('connection.update', onUpdate)
})
}

export async function requestPairingCodeWithTimeout(sock, phone, code = 'RUBYCHAN', timeoutMs = 45000) {
// Ultimo filtro antes de Baileys: si el numero trae basura el servidor devuelve
// un codigo invalido o un 400 opaco, asi que fallamos temprano y con un mensaje claro.
const digits = sanitizePairingNumber(phone)
if (!digits) throw new Error(`número de vinculación inválido: "${phone}"`)
if (!/^\d+$/.test(digits)) throw new Error(`número de vinculación no numérico: "${phone}"`)
// Sin esta espera el codigo se genera pero el telefono no recibe la notificacion.
await waitForPairingWindow(sock)
return Promise.race([
sock.requestPairingCode(digits, code),
new Promise((_, reject) => setTimeout(() => reject(new Error('timeout solicitando código de vinculación')), timeoutMs))
])
}

export function getPairingErrorMessage(error) {
return String(error?.message || error?.output?.payload?.message || error || 'error desconocido')
}

export function activeSubbotRuntimeList() {
return [...managed.values()].map(item => ({ botJid: item.botJid, ownerJid: item.ownerJid, status: item.status, sessionPath: item.sessionPath }))
}


function readMessageText(message = {}) {
const content = message.message || {}
const viewOnce = content.viewOnceMessage?.message || content.viewOnceMessageV2?.message || content.viewOnceMessageV2Extension?.message || {}
const body = { ...content, ...viewOnce }
return String(body.conversation || body.extendedTextMessage?.text || body.imageMessage?.caption || body.videoMessage?.caption || body.documentMessage?.caption || body.buttonsResponseMessage?.selectedButtonId || body.listResponseMessage?.singleSelectReply?.selectedRowId || body.templateButtonReplyMessage?.selectedId || '').trim()
}

function currentSubbotJid(sock, fallback = '') {
return normalizeSessionJid(sock?.user?.jid || sock?.user?.id || sock?.authState?.creds?.me?.jid || sock?.authState?.creds?.me?.id || fallback) || 'primary'
}

function ownerNumber(value = '') {
return String(Array.isArray(value) ? value[0] : value || '').split('@')[0].replace(/[^0-9]/g, '')
}

function isOwnerSender(sender = '') {
const senderNumber = ownerNumber(sender)
return Boolean(senderNumber && (global.owner || []).some(owner => ownerNumber(owner) === senderNumber))
}

async function canUnbanBlockedChat(sock, message = {}, chatId = '') {
const text = readMessageText(message).toLowerCase()
if (!/^#unbanchat(?:\s|$)/.test(text)) return false
const sender = normalizeSessionJid(message.key?.participant || message.participant || message.key?.remoteJid || '')
if (!sender) return false
if (isOwnerSender(sender) || sender === currentSubbotJid(sock)) return true
if (!chatId.endsWith('@g.us')) return false
try {
const metadata = await sock.groupMetadata(chatId)
const participant = metadata?.participants?.find(item => normalizeSessionJid(item.id || item.jid || item.lid) === sender)
return Boolean(participant?.admin || participant?.isAdmin || participant?.isSuperAdmin)
} catch {
return false
}
}

async function shouldIgnoreBannedSubbotChat(sock, message = {}, botJid = '') {
const chatId = message.key?.remoteJid || message.chat || message.remoteJid || ''
if (!chatId) return false
const chat = global.db?.getChat?.(chatId) || global.db?.data?.chats?.[chatId] || { id: chatId }
chat.id ||= chatId
if (!isChatBannedForBot(chat, botJid)) return false
return !await canUnbanBlockedChat(sock, message, chatId)
}

function getSubbotMessageTime(message = {}) {
const raw = Number(message.messageTimestamp || message?.message?.messageTimestamp || message.timestamp || 0)
if (!raw) return 0
return raw < 10_000_000_000 ? raw * 1000 : raw
}

function shouldProcessSubbotMessage(message = {}, botStartTime = Date.now()) {
const timestamp = getSubbotMessageTime(message)
if (!timestamp) return true
if (timestamp < botStartTime) return false
return Date.now() - timestamp <= 60_000
}

export async function createSubbotSocket({ ownerJid, sessionId, pairingPhone, mode = 'code', parentConn, onPairingCode, onQr } = {}) {
if (countActiveSubbots() >= readSubbotLimit()) throw new Error(`Límite de Sub-Bots alcanzado (${readSubbotLimit()})`)
// Se pre-procesa aqui para no crear la sesion en disco si el numero no sirve.
const safePhone = sanitizePairingNumber(pairingPhone)
if (mode === 'code' && !safePhone) throw new Error(`número de vinculación inválido: "${pairingPhone}"`)
const safeId = String(sessionId || ownerJid || Date.now()).replace(/[^a-zA-Z0-9_.@-]/g, '_')
const sessionPath = path.join(baseDir, safeId)
upsertSubbot({ botJid: `pending:${safeId}`, ownerJid, sessionId: safeId, sessionPath, status: 'connecting' })
return startSubbot({ ownerJid, sessionId: safeId, sessionPath, pairingPhone: safePhone, mode, parentConn, onPairingCode, onQr })
}

export async function startSubbot({ ownerJid, sessionId, sessionPath, pairingPhone, mode = 'restore', parentConn, onPairingCode, onQr } = {}) {
const current = managed.get(sessionId)
if (current?.sock) return current.sock
const { state, saveCreds, closeDb } = await useOptimizedAuthState(sessionPath, { dbName: 'auth.db', cleanOldFiles: true, sessionId, keyFlushDelayMs: 500, keyMaxFlushDelayMs: 2500, retentionMs: 3 * 24 * 60 * 60 * 1000 })
const baileys = global.baileys || await import('@whiskeysockets/baileys')
const DisconnectReason = getBaileysExport(baileys, 'DisconnectReason')
const version = await resolveBaileysVersion()
let attempt = 0
let sock
const botStartTime = Date.now()
// Una sesion sin registrar que arranca en modo `code` va a pedir pairing code: necesita
// el perfil de navegador de escritorio para que Meta emita la notificacion push.
const pairingRequested = mode === 'code' && !state.creds?.registered
const connect = async () => {
const options = alignSocketTelemetry({
logger: pino({ level: 'silent' }),
printQRInTerminal: false,
auth: { creds: state.creds, keys: getSignalKeyStore(baileys, state.keys, pino({ level: 'fatal' })) },
markOnlineOnConnect: false,
syncFullHistory: false,
shouldSyncHistoryMessage: () => false,
fireInitQueries: false,
emitOwnEvents: false,
generateHighQualityLinkPreview: false,
msgRetryCounterCache: createMessageRetryCache({ max: 200 }),
retryRequestDelayMs: 2500,
maxMsgRetryCount: 3,
connectTimeoutMs: 45000,
defaultQueryTimeoutMs: 60000,
keepAliveIntervalMs: 25000,
version
}, { version, pairing: pairingRequested })
sock = await makeWASocket(options, { skipStoreBind: true })
attachSessionState(sock, { id: sessionId, type: 'subbot', path: sessionPath, ownerJid })
const runtime = { sock, botJid: normalizeSessionJid(sock.user?.jid) || `pending:${sessionId}`, ownerJid, status: 'connecting', sessionId, sessionPath, closeDb }
managed.set(sessionId, runtime)
sock.ev.on('creds.update', async () => {
await saveCreds()
})
// El Sub-Bot importa EXACTAMENTE el mismo `router/handler.js` que el bot principal, y
// ese modulo instancia el `MiddlewarePipeline` a nivel de modulo. Por lo tanto el
// Sub-Bot comparte la misma capa de normalizacion de identidades (`@lid` -> telefono)
// y el mismo registro de alias: no existe un enrutador "obsoleto" paralelo.
const handler = await import('../router/handler.js')
sock.handler = handler.handler.bind(sock)
sock.subbotMessageGuard = async update => {
const incoming = Array.isArray(update?.messages) ? update.messages : []
if (!incoming.length) return
const botJid = currentSubbotJid(sock, runtime?.botJid || sessionId)
const list = []
for (const message of incoming) {
if (!shouldProcessSubbotMessage(message, botStartTime)) continue
if (await shouldIgnoreBannedSubbotChat(sock, message, botJid)) continue
list.push(message)
}
if (!list.length) return
// Se preserva el `type` del upsert: `handler` descarta cualquier update cuyo
// `type` no sea `notify`, y perderlo silenciaba TODOS los mensajes del Sub-Bot.
return sock.handler({ ...update, messages: list })
}
sock.messagesUpdate = handler.messagesUpdate.bind(sock)
sock.participantsUpdate = handler.participantsUpdate.bind(sock)
sock.groupsUpdate = handler.groupsUpdate.bind(sock)
// Los pares lid<->pn que llegan por metadata de grupo se aprenden en el mismo registro
// global que usa el bot principal, asi que basta con alimentarlo desde los eventos.
sock.subbotIdentityLearner = updates => {
for (const update of Array.isArray(updates) ? updates : [updates]) {
learnIdentitiesFromParticipants(update?.participants)
}
}
sock.ev.on('messages.upsert', sock.subbotMessageGuard)
sock.ev.on('messages.update', sock.messagesUpdate)
sock.ev.on('group-participants.update', sock.participantsUpdate)
sock.ev.on('groups.update', sock.groupsUpdate)
sock.ev.on('groups.upsert', sock.subbotIdentityLearner)
sock.ev.on('connection.update', async update => {
if (update.qr && mode === 'qr') await onQr?.(update.qr, sock, parentConn)
if (update.connection === 'open') {
attempt = 0
const botJid = normalizeSessionJid(sock.user?.jid || sock.authState?.creds?.me?.jid)
runtime.botJid = botJid
runtime.status = 'open'
upsertSubbot({ botJid, ownerJid, sessionId, sessionPath, status: 'open', lastSeenAt: Date.now() })
console.log(rubyConsole('online', `${botJid} conectado como Sub-Bot`))
// El listener ya quedo registrado al construir el socket. Volver a hacer `off`+`on`
// aqui solo abria una ventana en la que los mensajes recibidos justo en ese
// instante se perdian; el enrutador es el mismo, no hay nada que re-vincular.
await joinChannels(sock)
}
if (update.connection === 'close') {
const error = update.lastDisconnect?.error
const statusCode = statusCodeFrom(error)
runtime.status = 'close'
updateSubbot(runtime.botJid, { status: 'close' })
sweepSubbotSocket(sock)
try { await closeDb?.() } catch (closeError) { console.error(`[subbot] error cerrando auth db ${runtime.botJid || sessionId}:`, closeError) }
try { sock.ws?.close?.() } catch {}
managed.delete(sessionId)
if (INVALID_SESSION_STATUS.has(statusCode) || statusCode === DisconnectReason?.loggedOut || isInvalidSessionError(error)) return scheduleInvalidSessionCleanup({ botJid: runtime.botJid, sessionId, sessionPath, sock, error })
const wait = delayFor(attempt++, update.reconnectDelayMs)
const kind = isTransientSessionError(error) ? 'transitorio' : `código ${statusCode || 'desconocido'}`
console.log(`[subbot] cierre ${kind}; reconectando ${runtime.botJid || sessionId} en ${Math.ceil(wait / 1000)}s`)
setTimeout(() => subbotBootQueue.enqueue(() => startSubbot({ ownerJid, sessionId, sessionPath, mode: 'restore' }), { delayMs: 1 }).catch(error => {
if (isInvalidSessionError(error)) scheduleInvalidSessionCleanup({ botJid: runtime.botJid, sessionId, sessionPath, error })
else console.error(`[subbot] error al reconectar ${runtime.botJid || sessionId}:`, error)
}), wait).unref?.()
}
})
// El numero se vuelve a sanear aqui: `startSubbot` es publica y tambien la llama
// `restoreSubbots`, asi que no se puede asumir que ya venga limpio.
if (pairingRequested && typeof onPairingCode === 'function') {
const phoneForPairing = sanitizePairingNumber(pairingPhone)
if (!phoneForPairing) throw new Error(`número de vinculación inválido: "${pairingPhone}"`)
// Se pasan SIEMPRE los tres parametros en el mismo orden que espera el callback
// (`sock`, numero saneado, conexion padre) para que el plugin no dependa de closures.
await onPairingCode(sock, phoneForPairing, parentConn)
}
return sock
}
return connect().catch(error => {
if (isInvalidSessionError(error)) scheduleInvalidSessionCleanup({ botJid: `pending:${sessionId}`, sessionId, sessionPath, sock, error })
throw error
})
}

export async function restoreSubbots() {
const bots = listSubbots({ activeOnly: true })
console.log(`[subbot-startup] ${bots.length} Sub-Bot(s) activos encontrados en SQLite`)
for (const bot of bots) {
if (reconnecting.has(bot.session_id)) continue
reconnecting.add(bot.session_id)
console.log(`[subbot-startup] encolando ${bot.bot_jid} (${bot.session_id})`)
subbotBootQueue.enqueue(() => startSubbot({ ownerJid: bot.owner_jid, sessionId: bot.session_id, sessionPath: bot.session_path, mode: 'restore' })).catch(error => {
if (isInvalidSessionError(error)) scheduleInvalidSessionCleanup({ botJid: bot.bot_jid, sessionId: bot.session_id, sessionPath: bot.session_path, error })
else console.error(`[subbot-startup] error al reconectar ${bot.bot_jid}:`, error)
}).finally(() => reconnecting.delete(bot.session_id))
}
}

export async function destroySubbotSession(ownerJid, sessionId = ownerJid) {
const jid = normalizeSessionJid(ownerJid)
const safeId = String(sessionId || ownerJid || '').replace(/[^a-zA-Z0-9_.@-]/g, '_')
const bot = listSubbots().find(item => item.owner_jid === jid || item.session_id === safeId)
const id = bot?.session_id || safeId
const sessionPath = bot?.session_path || path.join(baseDir, id)
const runtime = managed.get(id)
sweepSubbotSocket(runtime?.sock)
try { await runtime?.closeDb?.() } catch (error) { console.error(`[subbot] error cerrando auth db ${id}:`, error) }
try { runtime?.sock?.end?.() || runtime?.sock?.ws?.close?.() } catch {}
managed.delete(id)
if (bot) deleteSubbotRecord(bot.bot_jid, bot.session_id)
else deleteSubbotRecord(`pending:${id}`, id)
await rm(sessionPath, { recursive: true, force: true })
return Boolean(bot || id)
}

export async function stopSubbotByOwner(ownerJid) {
const jid = normalizeSessionJid(ownerJid)
const bot = listSubbots().find(item => item.owner_jid === jid)
if (!bot) return false
const runtime = managed.get(bot.session_id)
sweepSubbotSocket(runtime?.sock)
try { await runtime?.closeDb?.() } catch (error) { console.error(`[subbot] error cerrando auth db ${bot.session_id}:`, error) }
try { runtime?.sock?.ws?.close?.() } catch {}
managed.delete(bot.session_id)
updateSubbot(bot.bot_jid, { status: 'paused', paused: true })
return true
}

export async function destroySubbotByOwner(ownerJid) {
const jid = normalizeSessionJid(ownerJid)
const bot = listSubbots().find(item => item.owner_jid === jid)
if (!bot) return false
const runtime = managed.get(bot.session_id)
sweepSubbotSocket(runtime?.sock)
try { await runtime?.closeDb?.() } catch (error) { console.error(`[subbot] error cerrando auth db ${bot.session_id}:`, error) }
try { runtime?.sock?.ws?.close?.() } catch {}
managed.delete(bot.session_id)
await rm(bot.session_path, { recursive: true, force: true })
deleteSubbotRecord(bot.bot_jid, bot.session_id)
return true
}

export async function joinChannels(conn) {
for (const channelId of Object.values(global.ch || {})) await conn.newsletterFollow(channelId).catch(() => {})
}
