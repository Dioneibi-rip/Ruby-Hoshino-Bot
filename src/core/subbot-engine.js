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
import { normalizeSessionJid } from './session-utils.js'
import { countActiveSubbots, deleteSubbotRecord, listSubbots, updateSubbot, upsertSubbot } from './subbot-store.js'
import { readSubbotLimit } from '../config/subbot-limit.js'

const managed = new Map()
const reconnecting = new Set()
export const subbotBaseDir = path.join(process.cwd(), 'Rubyjadibot')
const baseDir = subbotBaseDir
const INVALID_SESSION_STATUS = new Set([401, 403, 405, 440])

function delayFor(attempt = 0, override = 0) {
const base = Math.min(300000, 2500 * (2 ** Math.min(attempt, 7)))
return Math.max(Number(override) || 0, base + Math.floor(Math.random() * Math.min(base, 30000)))
}

function statusCodeFrom(error) {
return Number(error?.output?.statusCode || error?.data?.statusCode || error?.statusCode || error?.reason || 0)
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

export function requestPairingCodeWithTimeout(sock, phone, code = 'RUBYCHAN', timeoutMs = 45000) {
return Promise.race([
sock.requestPairingCode(phone, code),
new Promise((_, reject) => setTimeout(() => reject(new Error('timeout solicitando código de vinculación')), timeoutMs))
])
}

export function getPairingErrorMessage(error) {
return String(error?.message || error?.output?.payload?.message || error || 'error desconocido')
}

export function activeSubbotRuntimeList() {
return [...managed.values()].map(item => ({ botJid: item.botJid, ownerJid: item.ownerJid, status: item.status, sessionPath: item.sessionPath }))
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
const safeId = String(sessionId || ownerJid || Date.now()).replace(/[^a-zA-Z0-9_.@-]/g, '_')
const sessionPath = path.join(baseDir, safeId)
upsertSubbot({ botJid: `pending:${safeId}`, ownerJid, sessionId: safeId, sessionPath, status: 'connecting' })
return startSubbot({ ownerJid, sessionId: safeId, sessionPath, pairingPhone, mode, parentConn, onPairingCode, onQr })
}

export async function startSubbot({ ownerJid, sessionId, sessionPath, pairingPhone, mode = 'restore', parentConn, onPairingCode, onQr } = {}) {
const current = managed.get(sessionId)
if (current?.sock) return current.sock
const { state, saveCreds } = await useOptimizedAuthState(sessionPath, { dbName: 'auth.db', cleanOldFiles: true, sessionId })
const baileys = global.baileys || await import('@whiskeysockets/baileys')
const DisconnectReason = getBaileysExport(baileys, 'DisconnectReason')
const version = await resolveBaileysVersion()
let attempt = 0
let sock
const botStartTime = Date.now()
const connect = async () => {
const options = alignSocketTelemetry({
logger: pino({ level: 'silent' }),
printQRInTerminal: false,
browser: ['Ubuntu', 'Chrome', '20.0.04'],
auth: { creds: state.creds, keys: getSignalKeyStore(baileys, state.keys, pino({ level: 'fatal' })) },
markOnlineOnConnect: true,
syncFullHistory: false,
generateHighQualityLinkPreview: false,
msgRetryCounterCache: createMessageRetryCache(),
defaultQueryTimeoutMs: 60000,
version
}, { version })
sock = await makeWASocket(options, { skipStoreBind: mode === 'code' && !state.creds?.registered })
attachSessionState(sock, { id: sessionId, type: 'subbot', path: sessionPath, ownerJid })
const runtime = { sock, botJid: normalizeSessionJid(sock.user?.jid) || `pending:${sessionId}`, ownerJid, status: 'connecting', sessionId, sessionPath }
managed.set(sessionId, runtime)
sock.ev.on('creds.update', async () => {
await saveCreds()
})
const handler = await import('../router/handler.js')
sock.handler = handler.handler.bind(sock)
sock.subbotMessageGuard = update => {
const list = Array.isArray(update?.messages) ? update.messages.filter(message => shouldProcessSubbotMessage(message, botStartTime)) : []
if (!list.length) return
return sock.handler({ ...update, messages: list })
}
sock.messagesUpdate = handler.messagesUpdate.bind(sock)
sock.participantsUpdate = handler.participantsUpdate.bind(sock)
sock.groupsUpdate = handler.groupsUpdate.bind(sock)
sock.ev.on('messages.upsert', sock.subbotMessageGuard)
sock.ev.on('messages.update', sock.messagesUpdate)
sock.ev.on('group-participants.update', sock.participantsUpdate)
sock.ev.on('groups.update', sock.groupsUpdate)
sock.ev.on('connection.update', async update => {
if (update.qr && mode === 'qr') await onQr?.(update.qr, sock, parentConn)
if (update.connection === 'open') {
attempt = 0
const botJid = normalizeSessionJid(sock.user?.jid || sock.authState?.creds?.me?.jid)
runtime.botJid = botJid
runtime.status = 'open'
upsertSubbot({ botJid, ownerJid, sessionId, sessionPath, status: 'open', lastSeenAt: Date.now() })
console.log(rubyConsole('online', `${botJid} conectado como Sub-Bot`))
sock.ev.off('messages.upsert', sock.subbotMessageGuard)
sock.ev.on('messages.upsert', sock.subbotMessageGuard)
await joinChannels(sock)
}
if (update.connection === 'close') {
const error = update.lastDisconnect?.error
const statusCode = statusCodeFrom(error)
runtime.status = 'close'
updateSubbot(runtime.botJid, { status: 'close' })
try { sock.ws?.close?.() } catch {}
managed.delete(sessionId)
if (INVALID_SESSION_STATUS.has(statusCode) || statusCode === DisconnectReason?.loggedOut || isInvalidSessionError(error)) return scheduleInvalidSessionCleanup({ botJid: runtime.botJid, sessionId, sessionPath, sock, error })
const wait = delayFor(attempt++, update.reconnectDelayMs)
console.log(`[subbot] reconectando ${runtime.botJid || sessionId} en ${Math.ceil(wait / 1000)}s`)
setTimeout(() => startSubbot({ ownerJid, sessionId, sessionPath, mode: 'restore' }).catch(error => {
if (isInvalidSessionError(error)) scheduleInvalidSessionCleanup({ botJid: runtime.botJid, sessionId, sessionPath, error })
else console.error(`[subbot] error al reconectar ${runtime.botJid || sessionId}:`, error)
}), wait).unref?.()
}
})
if (mode === 'code' && pairingPhone && !state.creds?.registered) await onPairingCode?.(sock, pairingPhone, parentConn)
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
console.log(`[subbot-startup] reconectando ${bot.bot_jid} (${bot.session_id})`)
setImmediate(() => startSubbot({ ownerJid: bot.owner_jid, sessionId: bot.session_id, sessionPath: bot.session_path, mode: 'restore' }).catch(error => {
if (isInvalidSessionError(error)) scheduleInvalidSessionCleanup({ botJid: bot.bot_jid, sessionId: bot.session_id, sessionPath: bot.session_path, error })
else console.error(`[subbot-startup] error al reconectar ${bot.bot_jid}:`, error)
}).finally(() => reconnecting.delete(bot.session_id)))
}
}

export async function destroySubbotSession(ownerJid, sessionId = ownerJid) {
const jid = normalizeSessionJid(ownerJid)
const safeId = String(sessionId || ownerJid || '').replace(/[^a-zA-Z0-9_.@-]/g, '_')
const bot = listSubbots().find(item => item.owner_jid === jid || item.session_id === safeId)
const id = bot?.session_id || safeId
const sessionPath = bot?.session_path || path.join(baseDir, id)
const runtime = managed.get(id)
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
try { runtime?.sock?.ws?.close?.() } catch {}
managed.delete(bot.session_id)
await rm(bot.session_path, { recursive: true, force: true })
deleteSubbotRecord(bot.bot_jid, bot.session_id)
return true
}

export async function joinChannels(conn) {
for (const channelId of Object.values(global.ch || {})) await conn.newsletterFollow(channelId).catch(() => {})
}
