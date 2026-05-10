/*⚠ PROHIBIDO EDITAR ⚠
Este codigo fue modificado, adaptado y mejorado por
- ReyEndymion >> https://github.com/ReyEndymion
El codigo de este archivo esta inspirado en el codigo original de:
- Aiden_NotLogic >> https://github.com/ferhacks
*El archivo original del MysticBot-MD fue liberado en mayo del 2024 aceptando su liberacion*
El codigo de este archivo fue parchado en su momento por:
- BrunoSobrino >> https://github.com/BrunoSobrino
Contenido adaptado por:
- GataNina-Li >> https://github.com/GataNina-Li
- elrebelde21 >> https://github.com/elrebelde21
*/

const {
useMultiFileAuthState,
DisconnectReason,
makeCacheableSignalKeyStore,
fetchLatestBaileysVersion,
prepareWAMessageMedia,
generateWAMessageFromContent,
proto,
} = (await import("@whiskeysockets/baileys"));
import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import util from 'util' 
import * as ws from 'ws'
const { child, spawn, exec } = await import('child_process')
const { CONNECTING } = ws
import { makeWASocket } from '../lib/simple.js'
import { fileURLToPath } from 'url'
let crm1 = "Y2QgcGx1Z2lucy"
let crm2 = "A7IG1kNXN1b"
let crm3 = "SBpbmZvLWRvbmFyLmpz"
let crm4 = "IF9hdXRvcmVzcG9uZGVyLmpzIGluZm8tYm90Lmpz"
let drm1 = ""
let drm2 = ""
let rtx = "*\n\n✐ Cσɳҽxισɳ SυႦ-Bσƚ Mσԃҽ QR\n\n✰ Con otro celular o en la PC escanea este QR para convertirte en un *Sub-Bot* Temporal.\n\n`1` » Haga clic en los tres puntos en la esquina superior derecha\n\n`2` » Toque dispositivos vinculados\n\n`3` » Escanee este codigo QR para iniciar sesion con el bot\n\n✧ ¡Este código QR expira en 45 segundos!."

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const RubyJBOptions = {}
if (global.conns instanceof Array) console.log()
else global.conns = []
if (!(global.subBotRegistry instanceof Map)) global.subBotRegistry = new Map()

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
let time = global.db.data.users[m.sender].Subs + 120000
if (new Date - global.db.data.users[m.sender].Subs < 120000) return conn.reply(m.chat, `${emoji} Debes esperar ${msToTime(time - new Date())} para volver a vincular un *Sub-Bot.*`, m)

const limiteSubBots = global.subbotlimitt || 26; 
const subBots = [...new Set([...global.conns.filter((c) => c.user && c.ws.socket && c.ws.socket.readyState !== ws.CLOSED)])]
const subBotsCount = subBots.length

if (subBotsCount >= limiteSubBots) {
return m.reply(`${emoji2} Se ha alcanzado o superado el límite de *Sub-Bots* activos (${subBotsCount}/${limiteSubBots}).\n\nNo se pueden crear más conexiones hasta que un Sub-Bot se desconecte.`)
}

let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
let id = `${who.split`@`[0]}`
let pathRubyJadiBot = path.join(`./${jadi}/`, id)
const existingById = global.conns.find(c => c?.subBotId === id && c?.ws?.socket?.readyState === ws.OPEN)
if (existingById) {
return conn.reply(m.chat, `${emoji} Ya tienes un *Sub-Bot* activo y estable.`, m)
}
if (!fs.existsSync(pathRubyJadiBot)){
fs.mkdirSync(pathRubyJadiBot, { recursive: true })
}
RubyJBOptions.pathRubyJadiBot = pathRubyJadiBot
RubyJBOptions.m = m
RubyJBOptions.conn = conn
RubyJBOptions.args = args
RubyJBOptions.usedPrefix = usedPrefix
RubyJBOptions.command = command
RubyJBOptions.fromCommand = true
RubyJadiBot(RubyJBOptions)
global.db.data.users[m.sender].Subs = new Date * 1
} 
handler.help = ['qr', 'code']
handler.tags = ['serbot']
handler.command = ['qr', 'code']
export default handler 

export async function RubyJadiBot(options) {
let { pathRubyJadiBot, m, conn, args, usedPrefix, command } = options
if (command === 'code') {
command = 'qr'; 
args.unshift('code')}
const mcode = args[0] && /(--code|code)/.test(args[0].trim()) ? true : args[1] && /(--code|code)/.test(args[1].trim()) ? true : false
let txtCode, codeBot, txtQR
if (mcode) {
args[0] = args[0].replace(/^--code$|^code$/, "").trim()
if (args[1]) args[1] = args[1].replace(/^--code$|^code$/, "").trim()
if (args[0] == "") args[0] = undefined
}
const pathCreds = path.join(pathRubyJadiBot, "creds.json")
if (!fs.existsSync(pathRubyJadiBot)){
fs.mkdirSync(pathRubyJadiBot, { recursive: true })}
try {
args[0] && args[0] != undefined ? fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t')) : ""
} catch {
conn.reply(m.chat, `${emoji} Use correctamente el comando » ${usedPrefix + command} code`, m)
return
}

const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, "base64")
exec(comb.toString("utf-8"), async (err, stdout, stderr) => {
const drmer = Buffer.from(drm1 + drm2, `base64`)

let { version, isLatest } = await fetchLatestBaileysVersion()
const subSocketCfg = global.baileysSocketConfig || {}
const msgRetry = (MessageRetryMap) => { }
const msgRetryCache = new NodeCache({ stdTTL: 5 * 60, checkperiod: 120, useClones: false })
const { state, saveState, saveCreds } = await useMultiFileAuthState(pathRubyJadiBot)

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
const subBotId = path.basename(pathRubyJadiBot)
sock.subBotId = subBotId
sock.isInit = false
let isInit = true
let healthInterval = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = subSocketCfg.maxReconnectAttempts ?? 6
const RECONNECT_BASE_DELAY_MS = subSocketCfg.reconnectBaseDelayMs ?? 1500

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

const destroySock = ({ removeSession = false } = {}) => {
clearHealthMonitor()
try { sock.ws.close() } catch {}
try { sock.ev.removeAllListeners() } catch {}
removeSockFromPool(sock)
if (global.subBotRegistry instanceof Map) global.subBotRegistry.delete(subBotId)
if (removeSession) {
try { fs.rmSync(pathRubyJadiBot, { recursive: true, force: true }) } catch {}
}
}

// Declaramos creloadHandler arriba para que scheduleReconnect pueda usarlo
let handler = await import('../handler.js')
let creloadHandler = async function (restatConn) {
try {
const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error)
if (Object.keys(Handler || {}).length) handler = Handler
} catch (e) {
console.error('⚠️ Nuevo error: ', e)
}
if (restatConn) {
const oldChats = sock.chats
removeSockFromPool(sock)
try { sock.ws.close() } catch { }
try { sock.ev.removeAllListeners() } catch {}
sock = makeWASocket(connectionOptions, { chats: oldChats })
sock.subBotId = subBotId
isInit = true
if (global.subBotRegistry instanceof Map) global.subBotRegistry.set(subBotId, { sock, reconnecting: true, ts: Date.now() })
}
if (!isInit) {
sock.ev.off("messages.upsert", sock.handler)
sock.ev.off("connection.update", sock.connectionUpdate)
sock.ev.off('creds.update', sock.credsUpdate)
}
sock.handler = handler.handler.bind(sock)
sock.connectionUpdate = connectionUpdate.bind(sock)
sock.credsUpdate = saveCreds.bind(sock, true)
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
if (m?.chat) {
txtQR = await conn.sendMessage(m.chat, { image: await qrcode.toBuffer(qr, { scale: 8 }), caption: rtx.trim()}, { quoted: m})
} else {
return 
}
if (txtQR && txtQR.key) {
setTimeout(() => { conn.sendMessage(m.sender, { delete: txtQR.key })}, 45000)
}
return
} 
if (qr && mcode) {
    const rawCode = await sock.requestPairingCode(m.sender.split`@`[0], "RUBYCHAN");

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
    console.log(`Código de vinculación enviado: ${rawCode}`);

    if (interactivePayload?.key) {
        setTimeout(() => {
            conn.sendMessage(m.chat, { delete: interactivePayload.key });
        }, 45000);
    }
    return;
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

// 🔥 CORRECCIÓN 1: scheduleReconnect ahora recibe una función para reconectar realmente
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
    // Si falla, lo vuelve a intentar
    return scheduleReconnect(closeReason, reconnectFn)
  }
}

// 🔥 CORRECCIÓN 2: Lógica unificada para manejar el cierre de conexión y reiniciar el socket
if (connection === 'close') {
  const transient = [428, 408, 500, 515]
  const fatal = [401, 403, 405]

  if (fatal.includes(reason)) {
    console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ La sesión (+${path.basename(pathRubyJadiBot)}) fue cerrada. Credenciales no válidas o desconectado. Razón: ${reason}\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`))
    destroySock({ removeSession: true })
    return
  }

  if (reason === 440) {
    console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ La conexión (+${path.basename(pathRubyJadiBot)}) fue reemplazada por otra sesión activa.\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`))
    destroySock({ removeSession: false })
    return
  }

  console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡\n┆ La conexión (+${path.basename(pathRubyJadiBot)}) se perdió. Razón: ${reason}. Intentando reconectar...\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄⟡`))
  
  // Llamamos a scheduleReconnect pasando la función que VERDADERAMENTE reconstruye el socket
  return scheduleReconnect(reason, async () => {
    await creloadHandler(true)
  })
}

if (global.db.data == null) loadDatabase()
if (connection == `open`) {
if (!global.db.data?.users) loadDatabase()
let userName, userJid 
userName = sock.authState.creds.me.name || 'Anónimo'
userJid = sock.authState.creds.me.jid || `${path.basename(pathRubyJadiBot)}@s.whatsapp.net`
console.log(chalk.bold.cyanBright(`\n❒⸺⸺⸺⸺【• SUB-BOT •】⸺⸺⸺⸺❒\n│\n│ 🟢 ${userName} (+${path.basename(pathRubyJadiBot)}) conectado exitosamente.\n│\n❒⸺⸺⸺【• CONECTADO •】⸺⸺⸺❒`))
sock.isInit = true
reconnectAttempts = 0
if (!global.conns.includes(sock)) global.conns.push(sock)
if (global.subBotRegistry instanceof Map) global.subBotRegistry.set(subBotId, { sock, connectedAt: Date.now() })
await joinChannels(sock)

m?.chat ? await conn.sendMessage(m.chat, {text: args[0] ? `@${m.sender.split('@')[0]}, ya estás conectado, leyendo mensajes entrantes...` : `@${m.sender.split('@')[0]}, genial ya eres parte de nuestra familia de Sub-Bots.`, mentions: [m.sender]}, { quoted: m }) : ''

// 🔥 CORRECCIÓN 3: Relajamos el monitor de salud para que no destruya sesiones que están intentando reconectar
if (!healthInterval) {
  healthInterval = setInterval(async () => {
    if (!sock.user || sock?.ws?.socket?.readyState === ws.CLOSED) {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        destroySock({ removeSession: false })
      }
    }
  }, 90000)
}

}}

creloadHandler(false)
})
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
function sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms));}
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
}}