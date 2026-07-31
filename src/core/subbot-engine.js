import path from 'path'
import { rm } from 'fs/promises'
import pino from '../library/logger.js'
import { makeWASocket } from '../library/simple.js'
import { useOptimizedAuthState } from '../library/sqliteAuthState.js'
import { attachSessionState, createMessageRetryCache } from './session-manager.js'
import { alignSocketTelemetry, getStandardBrowserProfile } from './socket-telemetry.js'
import { normalizeSessionJid } from './session-utils.js'
import { countActiveSubbots, deleteSubbotRecord, listSubbots, updateSubbot, upsertSubbot } from './subbot-store.js'
import { readSubbotLimit } from '../config/subbot-limit.js'

const managed = new Map()
const reconnecting = new Set()
const baseDir = path.join(process.cwd(), 'sessions', 'subbots')
const DEFAULT_BAILEYS_VERSION = [2, 3000, 1015901307]
const INVALID_SESSION_STATUS = new Set([401, 403, 440, 515])

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

async function resolveBaileysVersion(baileys) {
const fetchVersion = baileys?.fetchLatestBaileysVersion || baileys?.default?.fetchLatestBaileysVersion
if (typeof fetchVersion !== 'function') return DEFAULT_BAILEYS_VERSION
try {
const result = await fetchVersion()
return Array.isArray(result?.version) ? result.version : DEFAULT_BAILEYS_VERSION
} catch {
return DEFAULT_BAILEYS_VERSION
}
}

function scheduleInvalidSessionCleanup({ botJid, sessionId, sessionPath, error }) {
const label = botJid || sessionId || sessionPath
console.log(`[subbot-cleanup] sesión inválida detectada para ${label}: ${getPairingErrorMessage(error)}`)
setImmediate(async () => {
try {
managed.delete(sessionId)
deleteSubbotRecord(botJid, sessionId)
await rm(sessionPath, { recursive: true, force: true })
console.log(`[subbot-cleanup] sesión eliminada: ${label}`)
} catch (cleanupError) {
console.error(`[subbot-cleanup] no se pudo limpiar ${label}:`, cleanupError)
}
})
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

export async function createSubbotSocket({ ownerJid, sessionId, pairingPhone, mode = 'code', parentConn, onPairingCode } = {}) {
if (countActiveSubbots() >= readSubbotLimit()) throw new Error(`Límite de Sub-Bots alcanzado (${readSubbotLimit()})`)
const safeId = String(sessionId || ownerJid || Date.now()).replace(/[^a-zA-Z0-9_.@-]/g, '_')
const sessionPath = path.join(baseDir, safeId)
upsertSubbot({ botJid: `pending:${safeId}`, ownerJid, sessionId: safeId, sessionPath, status: 'connecting' })
return startSubbot({ ownerJid, sessionId: safeId, sessionPath, pairingPhone, mode, parentConn, onPairingCode })
}

export async function startSubbot({ ownerJid, sessionId, sessionPath, pairingPhone, mode = 'restore', parentConn, onPairingCode } = {}) {
const current = managed.get(sessionId)
if (current?.sock) return current.sock
const { state, saveCreds } = await useOptimizedAuthState(sessionPath, { dbName: 'auth.db', cleanOldFiles: true, sessionId })
const baileys = global.baileys || await import('@whiskeysockets/baileys')
const { makeCacheableSignalKeyStore, DisconnectReason } = baileys
const version = await resolveBaileysVersion(baileys)
let attempt = 0
let sock
const connect = async () => {
const options = alignSocketTelemetry({
logger: pino({ level: 'silent' }),
printQRInTerminal: mode === 'qr',
browser: getStandardBrowserProfile(),
auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })) },
markOnlineOnConnect: true,
generateHighQualityLinkPreview: false,
msgRetryCounterCache: createMessageRetryCache(),
defaultQueryTimeoutMs: 60000,
version
}, { version })
sock = await makeWASocket(options, { skipStoreBind: mode === 'code' && !state.creds?.registered })
attachSessionState(sock, { id: sessionId, type: 'subbot', path: sessionPath, ownerJid })
const runtime = { sock, botJid: normalizeSessionJid(sock.user?.jid) || `pending:${sessionId}`, ownerJid, status: 'connecting', sessionId, sessionPath }
managed.set(sessionId, runtime)
sock.ev.on('creds.update', saveCreds)
const handler = await import('../router/handler.js')
sock.handler = handler.handler.bind(sock)
sock.messagesUpdate = handler.messagesUpdate.bind(sock)
sock.participantsUpdate = handler.participantsUpdate.bind(sock)
sock.groupsUpdate = handler.groupsUpdate.bind(sock)
sock.ev.on('messages.upsert', sock.handler)
sock.ev.on('messages.update', sock.messagesUpdate)
sock.ev.on('group-participants.update', sock.participantsUpdate)
sock.ev.on('groups.update', sock.groupsUpdate)
sock.ev.on('connection.update', async update => {
if (update.connection === 'open') {
attempt = 0
const botJid = normalizeSessionJid(sock.user?.jid || sock.authState?.creds?.me?.jid)
runtime.botJid = botJid
runtime.status = 'open'
upsertSubbot({ botJid, ownerJid, sessionId, sessionPath, status: 'open', lastSeenAt: Date.now() })
console.log(`[subbot] conectado ${botJid}`)
}
if (update.connection === 'close') {
const error = update.lastDisconnect?.error
const statusCode = statusCodeFrom(error)
runtime.status = 'close'
updateSubbot(runtime.botJid, { status: 'close' })
try { sock.ws?.close?.() } catch {}
managed.delete(sessionId)
if (isInvalidSessionError(error) || statusCode === DisconnectReason?.loggedOut) return scheduleInvalidSessionCleanup({ botJid: runtime.botJid, sessionId, sessionPath, error })
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
if (isInvalidSessionError(error)) scheduleInvalidSessionCleanup({ botJid: `pending:${sessionId}`, sessionId, sessionPath, error })
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
