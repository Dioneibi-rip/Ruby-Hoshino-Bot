async function pathExists(file){
try{
await fs.promises.access(file)
return true
}catch{
return false
}
}
const {
DisconnectReason,
makeCacheableSignalKeyStore,
fetchLatestBaileysVersion,
prepareWAMessageMedia,
generateWAMessageFromContent,
proto,
} = (await import("@whiskeysockets/baileys"));
import { useOptimizedAuthState, createManagerDatabase } from '../../infra/sqliteAuthState.js'
import qrcode from "qrcode"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import util from 'util'
import * as ws from 'ws'
const { CONNECTING } = ws
import { makeWASocket } from '../../infra/simple.js'
import { attachSessionState, cleanupSessionState, createMessageRetryCache, registerSubBot } from '../../core/session-manager.js'
import { startSubBotSupervisor } from '../../core/subbot-supervisor.js'
import * as sharedHandlerModule from '../../router/handler.js'
import { getCachedParticipatingGroups } from '../../infra/baileys-group-cache.js'
import { getGroupMetadataOnDemand } from '../../infra/global-cache.js'
import { fileURLToPath } from 'url'
let crm1 = "Y2QgcGx1Z2lucy"
let crm2 = "A7IG1kNXN1b"
let crm3 = "SBpbmZvLWRvbmFyLmpz"
let crm4 = "IF9hdXRvcmVzcG9uZGVyLmpzIGluZm8tYm90Lmpz"
let drm1 = ""
let drm2 = ""
let rtx = "*\n\n✐ Cσɳҽxισɳ SυႦ-Bσƚ Mσԃҽ QR\n\n✰ Con otro celular o en la PC escanea este QR para convertirte en un *Sub-Bot* Temporal.\n\n`1` » Haga clic en los tres puntos en la esquina superior derecha.\n`2` » Enlazar dispositivo\n`3` » Escanee este Código QR"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pairingCodeRequests = global.pairingCodeRequests || (global.pairingCodeRequests = new Map())
const PAIRING_CODE_TTL_MS = 45000
const PAIRING_CODE_COOLDOWN_MS = 60000
const SUBBOT_GROUP_PREFETCH_ON_CONNECT = process.env.SUBBOT_GROUP_PREFETCH_ON_CONNECT === 'true'

async function refreshSubBotGroups(sock, { retry = true } = {}) {
try {
const groups = await getCachedParticipatingGroups(sock)
for (const [jid, metadata] of Object.entries(groups || {})) setSubBotGroupMetadata(sock, jid, metadata)
return groups || {}
} catch (error) {
if (retry) {
setTimeout(() => refreshSubBotGroups(sock, { retry: false }).catch(() => {}), 10000).unref?.()
}
return {}
}
}
function setSubBotGroupMetadata(sock, jid, metadata = {}) {
if (!jid || !metadata) return null
sock.chats ||= {}
const current = sock.chats[jid] || { id: jid }
const safeMetadata = {
id: metadata.id || jid,
subject: metadata.subject || current.subject || '',
owner: metadata.owner || '',
size: Number(metadata.size || metadata.participants?.length || current.metadata?.size || 0),
updatedAt: Date.now()
}
sock.chats[jid] = { ...current, id: jid, subject: safeMetadata.subject, isChats: true, metadata: safeMetadata }
return sock.chats[jid]
}
async function patchSubBotGroupMetadata(sock) {
const originalGroupMetadata = sock.groupMetadata?.bind(sock)
sock.__rawGroupMetadata = originalGroupMetadata
sock.groupMetadata = async jid => {
const cached = sock.chats?.[jid]?.metadata
if (cached?.participants?.length) return cached
const metadata = await getGroupMetadataOnDemand(sock, jid, { requireParticipants: true })
if (metadata?.id) setSubBotGroupMetadata(sock, jid, metadata)
return metadata
}
sock.ev.on('groups.update', updates => {
for (const update of updates || []) {
const jid = update.id
if (!jid) continue
const current = sock.chats?.[jid]?.metadata || { id: jid, participants: [] }
setSubBotGroupMetadata(sock, jid, { ...current, ...update })
}
})
sock.__participantRefreshTimers ||= new Map()
sock.ev.on('group-participants.update', update => {
const jid = update.id
if (!jid || sock.__participantRefreshTimers.has(jid)) return
const timer = setTimeout(async () => {
try {
sock.__groupMetadataCache?.store?.delete?.(jid)
const metadata = await getGroupMetadataOnDemand(sock, jid, { requireParticipants: true, force: true })
if (metadata?.id) setSubBotGroupMetadata(sock, jid, metadata)
} catch (error) {
console.error(`Error refrescando participantes del grupo ${jid}:`, error)
} finally {
sock.__participantRefreshTimers.delete(jid)
}
}, 60000)
timer.unref?.()
sock.__participantRefreshTimers.set(jid, timer)
})
}

function createDebouncedSaveCreds(saveCreds, delayMs = 4000) {
let timer
let pending = false
let running = Promise.resolve()
const flush = () => {
if (timer) {
clearTimeout(timer)
timer = undefined
}
if (!pending) return running
pending = false
running = running.then(() => saveCreds()).catch(console.error)
return running
}
const debounced = () => {
pending = true
if (timer) clearTimeout(timer)
timer = setTimeout(flush, delayMs)
timer.unref?.()
return running
}
debounced.flush = flush
return debounced
}
function normalizeSubBotJid(jid = '') {
return String(jid).split(':')[0].trim().toLowerCase()
}
function subBotSessionId(jid = '') {
const normalized = normalizeSubBotJid(jid)
return encodeURIComponent(normalized || `subbot-${Date.now()}`)
}

function cleanPhoneNumber(value = '') {
return String(value || '').split('@')[0].split(':')[0].replace(/\D/g, '')
}
function isValidPairingPhone(phoneNumber = '') {
return /^\d{8,15}$/.test(phoneNumber)
}
function getPairingPhone(m, subBotJid = '', args = []) {
const candidates = [args.find((arg) => cleanPhoneNumber(arg)), subBotJid, m?.sender]
for (const candidate of candidates) {
const number = cleanPhoneNumber(candidate)
if (number) return number
}
return ''
}
function getPairingErrorMessage(error) {
return error?.output?.payload?.message || error?.output?.message || error?.message || String(error || 'Error desconocido')
}
if (global.conns instanceof Array) console.log()
else global.conns = []
startSubBotSupervisor()
if (!(global.subBotRegistry instanceof Map)) global.subBotRegistry = new Map()
const subBotConnectionStates = global.subBotConnectionStates || (global.subBotConnectionStates = new Map())
const SUBBOT_CONNECTING_TTL_MS = 120000
const FATAL_RECONNECT_REASONS = new Set([DisconnectReason.loggedOut, 401, 403, 405])
const SUBBOT_MSG_STORE_LIMIT = Number(process.env.SUBBOT_MSG_STORE_LIMIT || 120)
const SUBBOT_RECONNECT_MAX_DELAY_MS = Number(process.env.SUBBOT_RECONNECT_MAX_DELAY_MS || 120000)
const SUBBOT_RECONNECT_JITTER_MS = Number(process.env.SUBBOT_RECONNECT_JITTER_MS || 5000)
const SUBBOT_RECONNECT_MIN_DELAY_MS = Number(process.env.SUBBOT_RECONNECT_MIN_DELAY_MS || 3000)
const SUBBOT_VERSION_TTL_MS = Number(process.env.SUBBOT_VERSION_TTL_MS || 3600000)
let subBotVersionCache = null
let subBotVersionPromise = null
async function getCachedBaileysVersion() {
const now = Date.now()
if (subBotVersionCache && now - subBotVersionCache.ts < SUBBOT_VERSION_TTL_MS) return subBotVersionCache.value
if (!subBotVersionPromise) {
subBotVersionPromise = fetchLatestBaileysVersion().then(value => {
subBotVersionCache = { value, ts: Date.now() }
return value
}).finally(() => { subBotVersionPromise = null })
}
return subBotVersionPromise
}

function createBoundedSubBotMessageStore(limit = SUBBOT_MSG_STORE_LIMIT) {
const store = new Map()
const keyFor = key => `${key?.remoteJid || key?.chat || ''}:${key?.id || ''}`
return {
store,
remember(message) {
const id = keyFor(message?.key || message)
if (!id || id === ':') return
store.set(id, message)
while (store.size > limit) store.delete(store.keys().next().value)
},
rememberMany(messages = []) {
for (const message of messages || []) this.remember(message)
},
get(key) {
const hit = store.get(keyFor(key))
return hit?.message || hit || null
},
clear() {
store.clear()
},
}
}

function getSubBotConnectionState(id) {
const state = subBotConnectionStates.get(id)
if (!state) return null
if (state.status === 'connecting' && Date.now() - state.ts > SUBBOT_CONNECTING_TTL_MS) {
subBotConnectionStates.delete(id)
return null
}
return state
}

function setSubBotConnectionState(id, status, metadata = {}) {
const state = { ...(subBotConnectionStates.get(id) || {}), ...metadata, status, ts: Date.now() }
subBotConnectionStates.set(id, state)
return state
}

function clearSubBotConnectionState(id) {
subBotConnectionStates.delete(id)
}

function clearSubBotMemoryRefs(sock) {
if (!sock) return
try {
const timers = sock.__participantRefreshTimers
if (timers instanceof Map) {
for (const timer of timers.values()) clearTimeout(timer)
timers.clear()
} else if (Array.isArray(timers)) {
for (const timer of timers) clearTimeout(timer)
timers.length = 0
}
} catch (error) {
console.error('Error limpiando timers de participantes del Sub-Bot:', error)
}
try { sock.__groupFetchAllCache = null } catch {}
try { sock.__msgRetryCache?.flushAll?.() } catch (error) { console.error('Error limpiando msgRetryCache del Sub-Bot:', error) }
try { sock.chats = {} } catch {}
}

async function cleanupSubBotSession({ id, jid, sessionPath, sock, reason = 'manual' } = {}) {
const normalizedJid = normalizeSubBotJid(jid || sock?.subBotJid || sock?.user?.jid || sock?.authState?.creds?.me?.jid || '')
const sessionId = id || sock?.subBotId || subBotSessionId(normalizedJid)
const pathsToRemove = new Set([sessionPath, sock?.session?.path].filter(Boolean))
try {
if (sock?.ws?.socket?.readyState === ws.OPEN || sock?.ws?.socket?.readyState === ws.CONNECTING) {
try { sock.end?.() } catch (error) { console.error(`Error cerrando Sub-Bot ${sessionId} con end():`, error) }
try { sock.ws?.close?.() } catch (error) { console.error(`Error cerrando websocket del Sub-Bot ${sessionId}:`, error) }
}
try { sock?.ev?.removeAllListeners?.() } catch (error) { console.error(`Error quitando listeners del Sub-Bot ${sessionId}:`, error) }
clearSubBotMemoryRefs(sock)
if (Array.isArray(global.conns)) {
global.conns = global.conns.filter(conn => conn && conn !== sock && conn.subBotId !== sessionId && normalizeSubBotJid(conn.subBotJid || conn.user?.jid || conn.authState?.creds?.me?.jid || '') !== normalizedJid)
}
if (global.subBotRegistry instanceof Map) global.subBotRegistry.delete(sessionId)
clearSubBotConnectionState(sessionId)
if (sock) cleanupSessionState(sock)
for (const targetPath of pathsToRemove) {
try { await fs.promises.rm(targetPath, { recursive: true, force: true }) } catch (error) { console.error(`Error borrando credenciales del Sub-Bot ${sessionId}:`, error) }
}
try {
global.authManagerDb?.prepare?.('DELETE FROM bot_registry WHERE id = ? OR jid = ?')?.run(sessionId, normalizedJid)
} catch (error) {
console.error(`Error borrando registro SQLite del Sub-Bot ${sessionId}:`, error)
}
console.log(chalk.yellow(`🧹 Sesión Sub-Bot ${sessionId} limpiada (${reason}).`))
return true
} catch (error) {
console.error(`Error en limpieza estricta del Sub-Bot ${sessionId}:`, error)
return false
}
}

async function cleanupExistingSubBotForPairing({ id, jid, sessionPath } = {}) {
const normalizedJid = normalizeSubBotJid(jid)
const matches = Array.isArray(global.conns) ? global.conns.filter(conn => conn?.subBotId === id || normalizeSubBotJid(conn?.subBotJid || conn?.user?.jid || conn?.authState?.creds?.me?.jid || '') === normalizedJid) : []
for (const sock of matches) {
await cleanupSubBotSession({ id, jid: normalizedJid, sessionPath: sock?.session?.path || sessionPath, sock, reason: 'overwrite' })
}
if (getSubBotConnectionState(id) || await pathExists(sessionPath)) {
await cleanupSubBotSession({ id, jid: normalizedJid, sessionPath, reason: 'overwrite' })
}
}
let handler = async (m, { conn, args = [], usedPrefix, command, isOwner }) => {
const limiteSubBots = global.subbotlimitt || 26;
const activeConns = Array.isArray(global.conns) ? global.conns : []
const subBots = [...new Set(activeConns.filter((c) => c?.user && c?.ws?.socket && c.ws.socket.readyState !== ws.CLOSED))]
const subBotsCount = subBots.length
if (subBotsCount >= limiteSubBots) {
return m.reply(`🥀 Se ha alcanzado o superado el límite de *Sub-Bots* activos (${subBotsCount}/${limiteSubBots}).\n\nNo se pueden crear más conexiones hasta que un Sub-Bot se desconecte.`)
}
let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
const subBotJid = normalizeSubBotJid(who)
const id = subBotSessionId(subBotJid)
const legacyId = `${subBotJid.split`@`[0]}`
const newPathRubyJadiBot = path.join(`./${jadi}/`, id)
const legacyPathRubyJadiBot = path.join(`./${jadi}/`, legacyId)
let pathRubyJadiBot = (await pathExists(newPathRubyJadiBot)) || !(await pathExists(legacyPathRubyJadiBot)) ? newPathRubyJadiBot : legacyPathRubyJadiBot
const existingById = activeConns.find(c => (c?.subBotId === id || c?.subBotJid === subBotJid) && [ws.OPEN, ws.CONNECTING].includes(c?.ws?.socket?.readyState))
const activeState = getSubBotConnectionState(id)
if (existingById || ['connecting', 'online', 'reconnecting'].includes(activeState?.status) || await pathExists(pathRubyJadiBot)) {
await conn.reply(m.chat, '♻️ Detecté una sesión previa de Sub-Bot. La cerraré y borraré para generar un código nuevo.', m).catch(() => {})
await cleanupExistingSubBotForPairing({ id, jid: subBotJid, sessionPath: pathRubyJadiBot })
}
let time = global.db.getUser(m.sender).Subs + 120000
if (new Date - global.db.getUser(m.sender).Subs < 120000) return conn.reply(m.chat, `🌟 Debes esperar ${msToTime(time - new Date())} para volver a vincular un *Sub-Bot.*`, m)
setSubBotConnectionState(id, 'connecting', { jid: subBotJid, path: pathRubyJadiBot })
if (!await pathExists(pathRubyJadiBot)){
await fs.promises.mkdir(pathRubyJadiBot, { recursive: true })
}
const options = { pathRubyJadiBot, subBotJid, subBotId: id, m, conn, args: Array.isArray(args) ? [...args] : String(args || '').split(/\s+/).filter(Boolean), usedPrefix, command, fromCommand: true }
try {
await RubyJadiBot(options)
global.db.getUser(m.sender).Subs = new Date * 1
} catch (error) {
clearSubBotConnectionState(id)
await conn.reply(m.chat, `🥀 no pude iniciar la vinculación del Sub-Bot. Detalle: ${getPairingErrorMessage(error)}`, m)
}
}
handler.help = ['qr', 'code']
handler.tags = ['serbot']
handler.command = ['qr', 'code']
export default handler
export async function RubyJadiBot(options) {
let { pathRubyJadiBot, subBotJid, subBotId: requestedSubBotId, m, conn, args, usedPrefix, command } = options
args = Array.isArray(args) ? args : String(args || '').split(/\s+/).filter(Boolean)
if (command === 'code') {
command = 'qr';
args.unshift('code')}
const mcode = args[0] && /(--code|code)/.test(args[0].trim()) ? true : args[1] && /(--code|code)/.test(args[1].trim()) ? true : false
let txtCode, codeBot, txtQR
requestedSubBotId = requestedSubBotId || path.basename(pathRubyJadiBot)
subBotJid = normalizeSubBotJid(subBotJid || m?.sender || (requestedSubBotId.includes('%40') ? decodeURIComponent(requestedSubBotId) : requestedSubBotId))
if (mcode) {
args[0] = args[0].replace(/^--code$|^code$/, "").trim()
if (args[1]) args[1] = args[1].replace(/^--code$|^code$/, "").trim()
if (args[0] == "") args[0] = undefined
}
const pathCreds = path.join(pathRubyJadiBot, "creds.json")
const currentState = getSubBotConnectionState(requestedSubBotId)
if (['connecting', 'online', 'reconnecting'].includes(currentState?.status) && !options.fromCommand) return false
setSubBotConnectionState(requestedSubBotId, currentState?.status || 'connecting', { jid: subBotJid, path: pathRubyJadiBot })
if (!await pathExists(pathRubyJadiBot)){
await fs.promises.mkdir(pathRubyJadiBot, { recursive: true })}
try {
args[0] && args[0] != undefined ? await fs.promises.writeFile(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t')) : ""
} catch (e) {
conn.reply(m.chat, `🌺 Use correctamente el comando » ${usedPrefix + command} code`, m)
return
return false;
}
let { version, isLatest } = await getCachedBaileysVersion()
const subSocketCfg = global.baileysSocketConfig || {}
const msgRetry = (MessageRetryMap) => { }
const msgRetryCache = createMessageRetryCache()
const liteMsgStore = createBoundedSubBotMessageStore(SUBBOT_MSG_STORE_LIMIT)
const { state, saveCreds } = await useOptimizedAuthState(pathRubyJadiBot, { dbName: 'auth.db', cleanOldFiles: true, sessionId: requestedSubBotId || path.basename(pathRubyJadiBot) })
const debouncedSaveCreds = createDebouncedSaveCreds(() => saveCreds.call(sock, true))
global.authCredsFlushers ||= new Set()
global.authCredsFlushers.add(debouncedSaveCreds.flush)
global.authManagerDb ||= createManagerDatabase({ dbPath: `./${global.Rubysessions || 'sessions'}/system.db`, tableName: 'bot_registry' })
const connectionOptions = {
logger: pino({ level: "fatal" }),
printQRInTerminal: false,
auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) },
msgRetry,
msgRetryCache,
browser: mcode ? ['Ubuntu', 'Chrome', '110.0.5585.95'] : ['Ruby Hoshino (Sub Bot)', 'Chrome','2.0.0'],
version: version,
generateHighQualityLinkPreview: subSocketCfg.generateHighQualityLinkPreview ?? false,
defaultQueryTimeoutMs: subSocketCfg.defaultQueryTimeoutMs ?? 45000,
connectTimeoutMs: subSocketCfg.connectTimeoutMs ?? 60000,
keepAliveIntervalMs: subSocketCfg.keepAliveIntervalMs ?? 20000,
retryRequestDelayMs: subSocketCfg.retryRequestDelayMs ?? 5000,
markOnlineOnConnect: false,
syncFullHistory: false,
shouldSyncHistoryMessage: () => false,
getMessage: async key => liteMsgStore.get(key) || ''
};
let sock = makeWASocket(connectionOptions)
sock.__msgRetryCache = msgRetryCache
sock.__liteMsgStore = liteMsgStore
await patchSubBotGroupMetadata(sock)
const subBotId = requestedSubBotId || subBotSessionId(subBotJid || sock?.authState?.creds?.me?.jid || path.basename(pathRubyJadiBot))
sock.subBotId = subBotId
sock.subBotJid = subBotJid
attachSessionState(sock, { id: subBotId, type: 'subbot', parentId: conn?.user?.jid || 'primary', path: pathRubyJadiBot })
sock.isInit = false
let isInit = true
const MAX_RECONNECT_ATTEMPTS = options.startupLoad ? 3 : subSocketCfg.maxReconnectAttempts ?? 6
const RECONNECT_BASE_DELAY_MS = subSocketCfg.reconnectBaseDelayMs ?? 1500
let reconnectAttempts = 0
let reconnectTimer = null

let pairingCodeSent = false
let pairingCodeMessageKey = null
let pairingCodeTimer = null
let qrMessageSent = false
const removeSockFromPool = (targetSock = sock) => {
const i = global.conns.indexOf(targetSock)
if (i >= 0) {
global.conns.splice(i, 1)
}
}
const clearReconnectTimer = () => {
if (reconnectTimer) clearTimeout(reconnectTimer)
reconnectTimer = null
}
const clearPairingCodeLock = () => {
if (pairingCodeTimer) clearTimeout(pairingCodeTimer)
pairingCodeTimer = null
pairingCodeRequests.delete(subBotId)
}
const destroySock = async ({ removeSession = false } = {}) => {
clearReconnectTimer()
clearPairingCodeLock()
try { sock.ws.close() } catch (e) {}
try { sock.ev.removeAllListeners() } catch (e) {}
try { msgRetryCache.flushAll?.() } catch (e) {}
try { liteMsgStore.clear() } catch (e) {}
clearSubBotMemoryRefs(sock)
removeSockFromPool(sock)
cleanupSessionState(sock)
global.authCredsFlushers?.delete(debouncedSaveCreds.flush)
if (global.subBotRegistry instanceof Map) global.subBotRegistry.delete(subBotId)
clearSubBotConnectionState(subBotId)
upsertSubBotAuthRegistry(subBotId, sock, removeSession ? 'removed' : 'offline', { path: pathRubyJadiBot, jid: subBotJid })
if (removeSession) {
await cleanupSubBotSession({ id: subBotId, jid: subBotJid, sessionPath: pathRubyJadiBot, sock, reason: 'fatal-disconnect' })
}
}
const scheduleSafeReconnect = async (closeReason = 'unknown', reconnectFn = null) => {
if (reconnectTimer) return false
if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && options.startupLoad) {
setSubBotConnectionState(subBotId, 'fatal', { jid: subBotJid, path: pathRubyJadiBot, lastReason: closeReason })
await destroySock({ removeSession: true })
return false
}
if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) reconnectAttempts = Math.max(1, MAX_RECONNECT_ATTEMPTS - 1)
reconnectAttempts += 1
setSubBotConnectionState(subBotId, 'reconnecting', { jid: subBotJid, path: pathRubyJadiBot, lastReason: closeReason, attempts: reconnectAttempts })
const rateLimitDelay = String(closeReason || '').includes('429') || String(closeReason || '').includes('rate') ? 30000 : 0
const waitMs = Math.max(rateLimitDelay, Math.min(SUBBOT_RECONNECT_MAX_DELAY_MS, Math.max(SUBBOT_RECONNECT_MIN_DELAY_MS, RECONNECT_BASE_DELAY_MS * (2 ** (reconnectAttempts - 1))))) + Math.floor(Math.random() * SUBBOT_RECONNECT_JITTER_MS)
reconnectTimer = setTimeout(async () => {
reconnectTimer = null
try { await (reconnectFn || (() => creloadHandler(true)))() }
catch (error) {
console.error(`Error reconectando +${subBotId}:`, error)
scheduleSafeReconnect(closeReason, reconnectFn).catch(() => {})
}
}, waitMs)
reconnectTimer.unref?.()
return true
}
let handlerModule = sharedHandlerModule
let creloadHandler = async function (restatConn) {
if (restatConn) {
const oldChats = sock.chats
removeSockFromPool(sock)
try { sock.ws.close() } catch (e) { }
try { sock.ev.removeAllListeners() } catch (e) {}
sock = makeWASocket(connectionOptions, { chats: oldChats })
sock.__msgRetryCache = msgRetryCache
sock.__liteMsgStore = liteMsgStore
await patchSubBotGroupMetadata(sock)
sock.subBotId = subBotId
sock.subBotJid = subBotJid
attachSessionState(sock, { id: subBotId, type: 'subbot', parentId: conn?.user?.jid || 'primary', path: pathRubyJadiBot })
isInit = true
registerSubBot(global.subBotRegistry, subBotId, { sock, reconnecting: true, ts: Date.now() })
setSubBotConnectionState(subBotId, 'reconnecting', { jid: subBotJid, path: pathRubyJadiBot })
upsertSubBotAuthRegistry(subBotId, sock, 'reconnecting', { path: pathRubyJadiBot, jid: subBotJid })
}
if (!isInit) {
sock.ev.off("messages.upsert", sock.handler)
sock.ev.off("messages.update", sock.messagesUpdate)
sock.ev.off("group-participants.update", sock.participantsUpdate)
sock.ev.off("groups.update", sock.groupsUpdate)
sock.ev.off("connection.update", sock.connectionUpdate)
sock.ev.off('creds.update', sock.credsUpdate)
}
sock.__groupEventStartedAt = Date.now()
sock.__groupEventReadyAt = sock.__groupEventStartedAt + 15_000
sock.handler = update => {
liteMsgStore.rememberMany(update?.messages)
return handlerModule.handler.call(sock, update)
}
sock.participantsUpdate = handlerModule.participantsUpdate.bind(sock)
sock.groupsUpdate = handlerModule.groupsUpdate.bind(sock)
sock.messagesUpdate = handlerModule.messagesUpdate.bind(sock)
sock.connectionUpdate = update => connectionUpdate(update).catch(async error => {
console.error(`Error crítico en connection.update del Sub-Bot ${subBotId}:`, error)
if (sock?.ws?.socket?.readyState !== ws.OPEN) await scheduleSafeReconnect(error?.output?.statusCode || error?.data?.statusCode || error?.statusCode || 'connection-update-error')
})
sock.credsUpdate = debouncedSaveCreds
sock.ev.on("messages.upsert", sock.handler)
sock.ev.on("messages.update", sock.messagesUpdate)
sock.ev.on("group-participants.update", sock.participantsUpdate)
sock.ev.on("groups.update", sock.groupsUpdate)
sock.ev.on("connection.update", sock.connectionUpdate)
sock.ev.on("creds.update", sock.credsUpdate)
isInit = false
return true
}
async function connectionUpdate(update) {
const { connection, lastDisconnect, isNewLogin, qr, receivedPendingNotifications } = update
if (isNewLogin) sock.isInit = false
if (!global.db?.getSection) await global.loadDatabase?.()
if (receivedPendingNotifications && SUBBOT_GROUP_PREFETCH_ON_CONNECT) refreshSubBotGroups(sock).catch(() => {})
if (qr && !mcode) {
if (qrMessageSent) return
qrMessageSent = true
if (m?.chat) {
txtQR = await conn.sendMessage(m.chat, { image: await qrcode.toBuffer(qr, { scale: 8 }), caption: rtx.trim()}, { quoted: m})
} else {
return
}
if (txtQR && txtQR.key) {
setTimeout(() => { conn.sendMessage(m.chat, { delete: txtQR.key }).catch(() => {})}, PAIRING_CODE_TTL_MS)
}
return
}
if (qr && mcode) {
if (!m?.chat || pairingCodeSent) return
const now = Date.now()
const activeRequest = pairingCodeRequests.get(subBotId)
if (activeRequest && now - activeRequest.ts < PAIRING_CODE_COOLDOWN_MS) {
pairingCodeSent = true
pairingCodeMessageKey = activeRequest.key || null
return
}
pairingCodeSent = true
const pairingPhone = getPairingPhone(m, subBotJid, args)
if (!isValidPairingPhone(pairingPhone)) {
pairingCodeSent = false
return conn.reply(m.chat, `🥀 Envía un número válido para generar el código de vinculación. Ejemplo: ${usedPrefix || '#'}code 18095551234`, m)
}
let rawCode
try {
rawCode = await sock.requestPairingCode(pairingPhone, "RUBYCHAN")
} catch (error) {
pairingCodeSent = false
clearPairingCodeLock()
return conn.reply(m.chat, `🥀 Baileys rechazó la solicitud del código para +${pairingPhone}. Detalle: ${getPairingErrorMessage(error)}`, m)
}
const formattedCode = rawCode.match(/.{1,4}/g)?.join("-") || rawCode
const mediaMessage = await prepareWAMessageMedia({
image: { url: "https://files.catbox.moe/rt1yfo.jpeg" }
}, { upload: conn.waUploadToServer })
const interactivePayload = generateWAMessageFromContent(m.chat, {
viewOnceMessage: {
message: {
interactiveMessage: proto.Message.InteractiveMessage.fromObject({
body: proto.Message.InteractiveMessage.Body.create({
text: [
"ㅤㅤㅤ",
"     𝖲𝗎𝖻-𝖡𝗈𝗍 ー(德) 𝖢𝗈𝖽𝖾.",
"",
"> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖨𝗇𝗌𝗍𝗋𝗎𝖼𝖼𝗂𝗈𝗇𝖾𝗌 𝗉⍺𝗋⍺ 𝗏𝗂𝗇𝖼𝗎𝗅⍺𝗋:",
"",
"𖹭 `𝟣.` 𝖵𝖾 ⍺ 𝗅𝗈𝗌 𝟥 𝗉𝗎𝗇𝗍𝗂𝗍𝗈𝗌 `⋮` 𝗈 `𝖢𝗈𝗇𝖿𝗂𝗀𝗎𝗋⍺𝖼𝗂𝗈́𝗇`.",
"𖹭 `𝟤.` 𝖲𝖾𝗅𝖾𝖼𝖼𝗂𝗈𝗇⍺ `𝖣𝗂𝗌𝗉𝗈𝗌𝗂𝗍𝗂𝗏𝗈𝗌 𝗏𝗂𝗇𝖼𝗎𝗅⍺𝖽𝗈𝗌`.",
"𖹭 `𝟥.` 𝖳𝗈𝖼⍺ 𝖾𝗇 `𝖵𝗂𝗇𝖼𝗎𝗅⍺𝗋 𝗎𝗇 𝖽𝗂𝗌𝗉𝗈𝗌𝗂𝗍𝗂𝗏𝗈`.",
"𖹭 `𝟦.` 𝖤𝗅𝗂𝗀𝖾 `𝖵𝗂𝗇𝖼𝗎𝗅⍺𝗋 𝖼𝗈𝗇 𝖾𝗅 𝗇𝗎́𝗆𝖾𝗋𝗈 𝖽𝖾 𝗍𝖾𝗅𝖾́𝖿𝗈𝗇𝗈`.",
"𖹭 `𝟧.` 𝖯𝖾𝗀⍺ 𝖾𝗅 𝖼𝗈́𝖽𝗂𝗀𝗈 𝗊𝗎𝖾 𝖾𝗌𝗍⍺́ ⍺𝖻⍺𝗃𝗈.",
"",
"⎯⎯⵿⎯̸⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯̸⵿⎯⎯",
`> (っ- ‸ - ς) 𝖢𝗈́𝖽𝗂𝗀𝗈: *${formattedCode}*`
].join('\n')
}),
footer: proto.Message.InteractiveMessage.Footer.create({
text: "🌸 𝖤𝗌𝗍𝖾 𝖼𝗈́𝖽𝗂𝗀𝗈 𝖾𝗑𝗉𝗂𝗋⍺𝗋⍺́ 𝖾𝗇 𝟦𝟧 𝗌𝖾𝗀𝗎𝗇𝖽𝗈𝗌... ✨"
}),
header: proto.Message.InteractiveMessage.Header.create({
hasMediaAttachment: true,
imageMessage: mediaMessage.imageMessage
}),
nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
buttons: [{
name: "cta_copy",
buttonParamsJson: JSON.stringify({
display_text: "🌸 𝖢𝗈𝗉𝗂⍺𝗋 𝖢𝗈́𝖽𝗂𝗀𝗈",
copy_code: rawCode
})
}]
})
})
}
}
}, { quoted: m })
await conn.relayMessage(m.chat, interactivePayload.message, { messageId: interactivePayload.key.id })
pairingCodeMessageKey = interactivePayload.key
pairingCodeRequests.set(subBotId, { ts: now, key: pairingCodeMessageKey })
console.log(`Código de vinculación enviado: ${rawCode}`)
if (pairingCodeMessageKey) {
pairingCodeTimer = setTimeout(() => {
conn.sendMessage(m.chat, { delete: pairingCodeMessageKey }).catch(() => {})
clearPairingCodeLock()
}, PAIRING_CODE_TTL_MS)
}
return
}
if (txtCode && txtCode.key) {
setTimeout(() => { conn.sendMessage(m.sender, { delete: txtCode.key })}, 45000)
}
if (codeBot && codeBot.key) {
setTimeout(() => { conn.sendMessage(m.sender, { delete: codeBot.key })}, 45000)
}
const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
const scheduleReconnect = async (closeReason, reconnectFn) => {
return scheduleSafeReconnect(closeReason, reconnectFn)
}
if (connection === 'close') {
if (FATAL_RECONNECT_REASONS.has(reason)) {
console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ La sesión (+${path.basename(pathRubyJadiBot)}) se ha cerrado permanentemente.\n╰⟡┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄╯`))
const ownerChat = m?.chat || subBotJid
if (ownerChat) await conn.sendMessage(ownerChat, { text: '✦ Tu sesión de Sub-Bot ha sido cerrada o revocada. Vuelve a solicitar un código.' }).catch(() => {})
await destroySock({ removeSession: true })
return
}
if (reason === 440) {
console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ La conexión (+${path.basename(pathRubyJadiBot)}) fue desconectada correctamente.\n╰⟡┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄╯`))
destroySock({ removeSession: false })
return
}
console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ La conexión (+${path.basename(pathRubyJadiBot)}) se ha desconectado. Intentando reconectar...\n╰⟡┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄╯`))
return scheduleReconnect(reason, async () => {
await creloadHandler(true)
})
}
if (connection == `open`) {
sock.__groupEventStartedAt = Date.now()
sock.__groupEventReadyAt = sock.__groupEventStartedAt + 15_000
if (!global.db?.getSection?.('users')) await global.loadDatabase?.()
let userName, userJid
userName = sock.authState.creds.me.name || 'Anónimo'
userJid = sock.authState.creds.me.jid || `${path.basename(pathRubyJadiBot)}@s.whatsapp.net`
console.log(chalk.bold.cyanBright(`\n❒⸺⸺⸺⸺【• SUB-BOT •】⸺⸺⸺⸺❒\n│\n│ 🟢 ${userName} (+${path.basename(pathRubyJadiBot)}) conectado exitosamente.\n│\n❒⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺❒`))
sock.isInit = true
reconnectAttempts = 0
clearReconnectTimer()
setSubBotConnectionState(subBotId, 'online', { jid: subBotJid, path: pathRubyJadiBot, connectedAt: Date.now() })
if (!global.conns.includes(sock)) global.conns.push(sock)
registerSubBot(global.subBotRegistry, subBotId, { sock, connectedAt: Date.now() })
upsertSubBotAuthRegistry(subBotId, sock, 'online', { path: pathRubyJadiBot, jid: subBotJid, connectedAt: Date.now() })
clearPairingCodeLock()
if (SUBBOT_GROUP_PREFETCH_ON_CONNECT) refreshSubBotGroups(sock).catch(() => {})
m?.chat ? await conn.sendMessage(m.chat, {text: args[0] ? `@${m.sender.split('@')[0]}, ya estás conectado, leyendo mensajes entrantes...` : `@${m.sender.split('@')[0]}, genial ya eres parte de nuestro ecosistema de bots.`}, {quoted: m}).catch(() => {}) : null
joinChannels(sock).catch(() => {})
}
}
creloadHandler(false)
if (mcode && m?.chat) {
setTimeout(() => {
if (pairingCodeSent || sock.authState?.creds?.registered) return
connectionUpdate({ qr: 'pairing-code-fallback' }).catch(async (error) => {
await conn.reply(m.chat, `🥀 No pude generar el código de vinculación. Detalle: ${getPairingErrorMessage(error)}`, m).catch(() => {})
})
}, 3000)
}
}
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function upsertSubBotAuthRegistry(id, sock, status, metadata = {}) {
const db = global.authManagerDb
if (!db) return
const jid = normalizeSubBotJid(metadata.jid || sock?.user?.jid || sock?.authState?.creds?.me?.jid || `${id}@s.whatsapp.net`)
const payload = JSON.stringify({ ...metadata, jid })
for (let attempt = 0; attempt < 3; attempt++) {
try {
db.prepare('INSERT OR REPLACE INTO bot_registry (id, jid, status, metadata) VALUES (?, ?, ?, ?)').run(id, jid, status, payload)
return
} catch (error) {
if (!['SQLITE_BUSY', 'SQLITE_LOCKED'].includes(error?.code) || attempt === 2) {
console.error(`Error actualizando registro SQLite del Sub-Bot ${id}:`, error)
return
}
}
}
}

function sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}
function msToTime(duration) {
var milliseconds = parseInt((duration % 1000) / 100),
seconds = Math.floor((duration / 1000) % 60),
minutes = Math.floor((duration / (1000 * 60)) % 60),
hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
hours = (hours < 10) ? '0' + hours : hours
minutes = (minutes < 10) ? '0' + minutes : minutes
seconds = (seconds < 10) ? '0' + seconds : seconds
return minutes + ' m y ' + seconds + ' s '
}
async function joinChannels(conn) {
for (const channelId of Object.values(global.ch)) {
await conn.newsletterFollow(channelId).catch(() => {})
}
}
