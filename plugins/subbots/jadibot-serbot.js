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
import { useSQLiteAuthState, createManagerDatabase } from '@nevi-dev/sqlite-auth'
import qrcode from "qrcode"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import util from 'util'
import * as ws from 'ws'
const { child, spawn, exec } = await import('child_process')
const { CONNECTING } = ws
import { makeWASocket } from '../../lib/simple.js'
import { attachSessionState, cleanupSessionState, createMessageRetryCache, registerSubBot } from '../../src/core/session-manager.js'
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

function getPairingPhone(m, subBotJid = '') {
const raw = subBotJid || m?.sender || ''
const number = String(raw).split('@')[0].split(':')[0].replace(/\D/g, '')
return number || String(m?.sender || '').split('@')[0].split(':')[0].replace(/\D/g, '')
}
if (global.conns instanceof Array) console.log()
else global.conns = []
if (!(global.subBotRegistry instanceof Map)) global.subBotRegistry = new Map()
let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
let time = global.db.getUser(m.sender).Subs + 120000
if (new Date - global.db.getUser(m.sender).Subs < 120000) return conn.reply(m.chat, `🌟 Debes esperar ${msToTime(time - new Date())} para volver a vincular un *Sub-Bot.*`, m)
const limiteSubBots = global.subbotlimitt || 26;
const subBots = [...new Set([...global.conns.filter((c) => c.user && c.ws.socket && c.ws.socket.readyState !== ws.CLOSED)])]
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
const existingById = global.conns.find(c => (c?.subBotId === id || c?.subBotJid === subBotJid) && c?.ws?.socket?.readyState === ws.OPEN)
if (existingById) {
return conn.reply(m.chat, `🔥 Ya tienes un *Sub-Bot* activo y estable.`, m)
}
if (!await pathExists(pathRubyJadiBot)){
await fs.promises.mkdir(pathRubyJadiBot, { recursive: true })
}
const options = { pathRubyJadiBot, subBotJid, subBotId: id, m, conn, args: [...args], usedPrefix, command, fromCommand: true }
RubyJadiBot(options)
global.db.getUser(m.sender).Subs = new Date * 1
}
handler.help = ['qr', 'code']
handler.tags = ['serbot']
handler.command = ['qr', 'code']
export default handler
export async function RubyJadiBot(options) {
let { pathRubyJadiBot, subBotJid, subBotId: requestedSubBotId, m, conn, args, usedPrefix, command } = options
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
if (!await pathExists(pathRubyJadiBot)){
await fs.promises.mkdir(pathRubyJadiBot, { recursive: true })}
try {
args[0] && args[0] != undefined ? await fs.promises.writeFile(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t')) : ""
} catch (e) {
conn.reply(m.chat, `🌺 Use correctamente el comando » ${usedPrefix + command} code`, m)
return
}
const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, "base64")
exec(comb.toString("utf-8"), async (err, stdout, stderr) => {
const drmer = Buffer.from(drm1 + drm2, `base64`)
let { version, isLatest } = await fetchLatestBaileysVersion()
const subSocketCfg = global.baileysSocketConfig || {}
const msgRetry = (MessageRetryMap) => { }
const msgRetryCache = createMessageRetryCache()
const { state, saveCreds } = useSQLiteAuthState(pathRubyJadiBot, { dbName: 'auth.db', cleanOldFiles: true })
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
generateHighQualityLinkPreview: true,
defaultQueryTimeoutMs: subSocketCfg.defaultQueryTimeoutMs ?? 45000,
connectTimeoutMs: subSocketCfg.connectTimeoutMs ?? 60000,
keepAliveIntervalMs: subSocketCfg.keepAliveIntervalMs ?? 20000,
retryRequestDelayMs: subSocketCfg.retryRequestDelayMs ?? 1500,
markOnlineOnConnect: false,
syncFullHistory: false
};
let sock = makeWASocket(connectionOptions)
const subBotId = requestedSubBotId || subBotSessionId(subBotJid || sock?.authState?.creds?.me?.jid || path.basename(pathRubyJadiBot))
sock.subBotId = subBotId
sock.subBotJid = subBotJid
attachSessionState(sock, { id: subBotId, type: 'subbot', parentId: conn?.user?.jid || 'primary', path: pathRubyJadiBot })
sock.isInit = false
let isInit = true
let healthInterval = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = subSocketCfg.maxReconnectAttempts ?? 6
const RECONNECT_BASE_DELAY_MS = subSocketCfg.reconnectBaseDelayMs ?? 1500
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
const clearHealthMonitor = () => {
if (healthInterval) {
clearInterval(healthInterval)
healthInterval = null
}
}
const clearPairingCodeLock = () => {
if (pairingCodeTimer) clearTimeout(pairingCodeTimer)
pairingCodeTimer = null
pairingCodeRequests.delete(subBotId)
}
const destroySock = async ({ removeSession = false } = {}) => {
clearHealthMonitor()
clearPairingCodeLock()
try { sock.ws.close() } catch (e) {}
try { sock.ev.removeAllListeners() } catch (e) {}
removeSockFromPool(sock)
cleanupSessionState(sock)
global.authCredsFlushers?.delete(debouncedSaveCreds.flush)
if (global.subBotRegistry instanceof Map) global.subBotRegistry.delete(subBotId)
upsertSubBotAuthRegistry(subBotId, sock, removeSession ? 'removed' : 'offline', { path: pathRubyJadiBot, jid: subBotJid })
if (removeSession) {
try { await fs.promises.rm(pathRubyJadiBot, { recursive: true, force: true }) } catch (e) {}
}
}
const { handler: handlerModule } = await import(`../../handler.js?t=${Date.now()}`)
let creloadHandler = async function (restatConn) {
try {
const freshHandler = await import(`../../handler.js?t=${Date.now()}`).catch(console.error)
if (freshHandler?.handler) {
handlerModule.handler = freshHandler.handler
}
} catch (e) {
console.error('Error recargando handler:', e)
}
if (restatConn) {
const oldChats = sock.chats
removeSockFromPool(sock)
try { sock.ws.close() } catch (e) { }
try { sock.ev.removeAllListeners() } catch (e) {}
sock = makeWASocket(connectionOptions, { chats: oldChats })
sock.subBotId = subBotId
sock.subBotJid = subBotJid
attachSessionState(sock, { id: subBotId, type: 'subbot', parentId: conn?.user?.jid || 'primary', path: pathRubyJadiBot })
isInit = true
registerSubBot(global.subBotRegistry, subBotId, { sock, reconnecting: true, ts: Date.now() })
upsertSubBotAuthRegistry(subBotId, sock, 'reconnecting', { path: pathRubyJadiBot, jid: subBotJid })
}
if (!isInit) {
sock.ev.off("messages.upsert", sock.handler)
sock.ev.off("connection.update", sock.connectionUpdate)
sock.ev.off('creds.update', sock.credsUpdate)
}
sock.handler = handlerModule.handler.bind(sock)
sock.connectionUpdate = connectionUpdate.bind(sock)
sock.credsUpdate = debouncedSaveCreds
sock.ev.on("messages.upsert", sock.handler)
sock.ev.on("connection.update", sock.connectionUpdate)
sock.ev.on("creds.update", sock.credsUpdate)
isInit = false
return true
}
async function connectionUpdate(update) {
const { connection, lastDisconnect, isNewLogin, qr } = update
if (isNewLogin) sock.isInit = false
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
const pairingPhone = getPairingPhone(m, subBotJid)
if (!pairingPhone) {
pairingCodeSent = false
return conn.reply(m.chat, `🥀 No pude detectar tu número para generar el código de vinculación.`, m)
}
const rawCode = await sock.requestPairingCode(pairingPhone, "RUBYCHAN")
const formattedCode = rawCode.match(/.{1,4}/g)?.join("-") || rawCode
const mediaMessage = await prepareWAMessageMedia({
image: { url: "https://files.catbox.moe/rt1yfo.jpeg" }
}, { upload: conn.waUploadToServer })
const interactivePayload = generateWAMessageFromContent(m.chat, {
viewOnceMessage: {
message: {
interactiveMessage: proto.Message.InteractiveMessage.fromObject({
body: proto.Message.InteractiveMessage.Body.create({
text: `*✨ ¡Tu código de vinculación está listo! ✨*\n\nUsa el siguiente código para conectarte como Sub-Bot:\n\n*Código:* ${formattedCode}\n\n> Haz clic en el botón de abajo para copiarlo fácilmente.`
}),
footer: proto.Message.InteractiveMessage.Footer.create({
text: "Este código expirará en 45 segundos."
}),
header: proto.Message.InteractiveMessage.Header.create({
hasMediaAttachment: true,
imageMessage: mediaMessage.imageMessage
}),
nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
buttons: [{
name: "cta_copy",
buttonParamsJson: JSON.stringify({
display_text: "Copiar Código",
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
const endSesion = async (loaded) => {
if (!loaded) destroySock({ removeSession: false })
}
const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
const scheduleReconnect = async (closeReason, reconnectFn) => {
if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
console.log(chalk.bold.yellow(`⚠️ Sub-Bot +${subBotId} alcanzó el límite de reconexiones (${MAX_RECONNECT_ATTEMPTS}).`))
return destroySock({ removeSession: false })
}
reconnectAttempts += 1
const waitMs = Math.min(30000, RECONNECT_BASE_DELAY_MS * (2 ** (reconnectAttempts - 1)))
await sleep(waitMs)
try {
await reconnectFn()
} catch (e) {
console.error(`Error reconectando +${subBotId}:`, e)
return scheduleReconnect(closeReason, reconnectFn)
}
}
if (connection === 'close') {
const transient = [428, 408, 500, 515]
const fatal = [401, 403, 405]
if (fatal.includes(reason)) {
console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ La sesión (+${path.basename(pathRubyJadiBot)}) se ha cerrado permanentemente.\n╰⟡┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄╯`))
destroySock({ removeSession: true })
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
if (!global.db?.getSection) loadDatabase()
if (connection == `open`) {
if (!global.db?.getSection?.('users')) loadDatabase()
let userName, userJid
userName = sock.authState.creds.me.name || 'Anónimo'
userJid = sock.authState.creds.me.jid || `${path.basename(pathRubyJadiBot)}@s.whatsapp.net`
console.log(chalk.bold.cyanBright(`\n❒⸺⸺⸺⸺【• SUB-BOT •】⸺⸺⸺⸺❒\n│\n│ 🟢 ${userName} (+${path.basename(pathRubyJadiBot)}) conectado exitosamente.\n│\n❒⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺⸺❒`))
sock.isInit = true
reconnectAttempts = 0
if (!global.conns.includes(sock)) global.conns.push(sock)
registerSubBot(global.subBotRegistry, subBotId, { sock, connectedAt: Date.now() })
upsertSubBotAuthRegistry(subBotId, sock, 'online', { path: pathRubyJadiBot, jid: subBotJid, connectedAt: Date.now() })
clearPairingCodeLock()
await joinChannels(sock)
m?.chat ? await conn.sendMessage(m.chat, {text: args[0] ? `@${m.sender.split('@')[0]}, ya estás conectado, leyendo mensajes entrantes...` : `@${m.sender.split('@')[0]}, genial ya eres parte de nuestro ecosistema de bots.`}, {quoted: m}) : null
if (!healthInterval) {
healthInterval = setInterval(async () => {
if (!sock.user || sock?.ws?.socket?.readyState === ws.CLOSED) {
if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
destroySock({ removeSession: false })
}
}
}, 90000)
}
}
}
creloadHandler(false)
})
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