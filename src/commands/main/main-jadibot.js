import { existsSync, promises as fsPromises, readdirSync, readFileSync, statSync } from "fs"
import path, { join } from 'path'
import ws from 'ws'
const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = (await import("@whiskeysockets/baileys")).default

async function pathExists(file) {
try {
await fsPromises.access(file)
return true
} catch {
return false
}
}

let handler = async (m, { conn, command, usedPrefix, args, text, isOwner, participants = [] }) => {

const isDeleteSession = /^(deletesesion|deletebot|deletesession|deletesesaion)$/i.test(command)
const isPauseBot = /^(stop|pausarai|pausarbot)$/i.test(command)
const isShowBots = /^(bots|sockets|socket)$/i.test(command)

const toFancy = (str) => {
const map = {
'a': 'ᥲ', 'b': 'ᑲ', 'c': 'ᥴ', 'd': 'ᑯ', 'e': 'ᥱ', 'f': '𝖿', 'g': 'g', 'h': 'һ',
'i': 'і', 'j': 'j', 'k': 'k', 'l': 'ᥣ', 'm': 'm', 'n': 'ᥒ', 'o': '᥆', 'p': '⍴',
'q': 'q', 'r': 'r', 's': 's', 't': '𝗍', 'u': 'ᥙ', 'v': '᥎', 'w': 'ɯ', 'x': 'x',
'y': 'ᥡ', 'z': 'z', 'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F',
'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V',
'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
}
return str.split('').map(c => map[c] || c).join('')
}

const reportError = async (e) => {
await m.reply(`⚠️ ${toFancy("Ocurrió un error inesperado, lo siento mucho...")}`)
console.error(e)
}

if (isDeleteSession) {
const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
const uniqid = `${who.split('@')[0]}`
const dirPath = `./${jadi}/${uniqid}`

if (!await pathExists(dirPath)) {
return conn.sendMessage(m.chat, {
text: `🚫 *${toFancy("Sesión no encontrada")}*\n\n✨ ${toFancy("No tienes una sesión activa.")}\n\n🔰 ${toFancy("Puedes crear una con:")}\n*${usedPrefix}qr*\n\n📦 ${toFancy("Obtener código:")}\n*${usedPrefix}code*`
}, { quoted: m })
}

if (global.conn.user.jid !== conn.user.jid) {
return conn.sendMessage(m.chat, {
text: `💬 ${toFancy("Este comando solo puede usarse desde el Bot Principal.")}`,
}, { quoted: m })
}

try {
await m.react('🗑️')
await fsPromises.rm(dirPath, { recursive: true, force: true })
await conn.sendMessage(m.chat, {
text: `🌈 ${toFancy("¡Todo limpio! Tu sesión ha sido eliminada con éxito.")}`
}, { quoted: m })
} catch (e) {
reportError(e)
return false;
}
}
else if (isPauseBot) {
if (global.conn.user.jid == conn.user.jid) {
await conn.reply(m.chat, `🚫 ${toFancy("No puedes pausar el bot principal.")}`, m);
return false;
}
await conn.reply(m.chat, `🔕 *${botname || 'Sub-Bot'} ${toFancy("ha sido pausado.")}*`, m)
conn.ws.close()
}
else if (isShowBots) {
const socketOpen = (sock) => sock?.user && sock?.ws?.socket && sock.ws.socket.readyState !== ws.CLOSED

const normalizeBotJid = (jid) => {
if (!jid) return '';
const user = String(jid).split('@')[0].split(':')[0].replace(/\D/g, '');
return user ? `${user}@s.whatsapp.net` : '';
}

const getRawNumber = (jid) => normalizeBotJid(jid).split('@')[0]

const decodeSessionId = (id) => {
try { return decodeURIComponent(String(id || '')) }
catch { return String(id || '') }
}

const getSessionNumber = (id) => {
const decoded = decodeSessionId(id)
return decoded.split('@')[0].split(':')[0].replace(/\D/g, '')
}

const hasValidCredentials = (sessionPath) => {
try {
const credsPath = path.join(sessionPath, 'creds.json')
const authDbPath = path.join(sessionPath, 'auth.db')
if (existsSync(credsPath)) {
const parsed = JSON.parse(readFileSync(credsPath, 'utf8'))
return Boolean(parsed?.me || parsed?.registered || parsed?.noiseKey || parsed?.signedIdentityKey)
}
return existsSync(authDbPath) && statSync(authDbPath).size > 0
} catch {
return false
}
}

const getBotsFromFolder = (folderPath) => {
if (!existsSync(folderPath)) return []
return readdirSync(folderPath)
.filter((dir) => {
const sessionPath = path.join(folderPath, dir)
return statSync(sessionPath).isDirectory() && hasValidCredentials(sessionPath)
})
.map((id) => getSessionNumber(id))
.filter(Boolean)
}

const getParticipantId = (participant) => {
if (typeof participant === 'string') return participant
return participant?.phoneNumber || participant?.jid || participant?.lid || participant?.id || ''
}

const groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(() => null) : null
const rawParticipants = groupMetadata?.participants?.length ? groupMetadata.participants : participants || []
const groupParticipantsIds = rawParticipants.map(getParticipantId).filter(Boolean)

const getAdminStatus = (jid) => {
if (!m.isGroup || !groupMetadata) return 'N/A'
const participant = rawParticipants.find(p => getParticipantId(p) === jid)
if (!participant) return 'Fuera del grupo'
return participant.admin ? '👑 Admin' : '👤 Miembro'
}

const wantsAll = /^all$/i.test((args?.[0] || text || '').trim())
const showAll = Boolean(isOwner && wantsAll)
const mainJid = normalizeBotJid(global.conn?.user?.id || global.conn?.user?.jid || conn?.user?.id || conn?.user?.jid)
const mainSocket = socketOpen(global.conn) && mainJid ? [{ jid: mainJid, sock: global.conn, type: 'Principal' }] : []
const subFolderPath = global.rutaJadiBot || path.join(process.cwd(), global.jadi || jadi)
const subBots = [...new Set(getBotsFromFolder(subFolderPath))].map((number) => {
const jid = `${number}@s.whatsapp.net`
const sock = (global.conns || []).find((socket) => normalizeBotJid(socket?.subBotJid || socket?.user?.id || socket?.user?.jid) === jid)
return { jid, sock, type: 'SubBot' }
})
const activeSockets = [...mainSocket, ...subBots]
const isInCurrentGroup = ({ jid }) => !m.isGroup || groupParticipantsIds.includes(jid)
const scopedSockets = showAll ? activeSockets : activeSockets.filter(isInCurrentGroup)

const mainCount = mainSocket.length
const subCount = subBots.length
const scopedLabel = showAll ? '🌐 Vista Global' : '👥 Vista de Grupo'

const botLines = scopedSockets.length
? scopedSockets.map(({ jid, sock, type }) => {
const num = getRawNumber(jid)
const settings = global.db?.get?.('settings', jid) || global.db?.data?.settings?.[jid] || {}
const name = sock?.user?.name || sock?.user?.pushname || settings?.namebot2 || settings?.namebot || 'Ruby AI'
const role = getAdminStatus(jid)
const status = socketOpen(sock) ? '🟢 Conectado' : '🔴 Desconectado'
return `┌ ⚙️ *[${type}]* ${name}\n│ 📱 wa.me/${num}\n│ 📡 Estado: ${status}\n└ 🏷️ Rol: ${role}`
}).join('\n\n')
: `- ${showAll ? 'No hay bots registrados.' : 'No hay bots activos en este grupo.'}`

const headerText = [
`*${scopedLabel}*`,
`Sockets Totales: *${activeSockets.length}*`,
`├ Principales: *${mainCount}*`,
`└ SubBots: *${subCount}*`,
'',
botLines
].join('\n')

let mediaMessage = await prepareWAMessageMedia({
image: { url: '[https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/855ccb61ddb6e8a6265750cb601ca07b.jpg](https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/855ccb61ddb6e8a6265750cb601ca07b.jpg)' }
}, { upload: conn.waUploadToServer })

let msg = generateWAMessageFromContent(m.chat, {
viewOnceMessage: {
message: {
interactiveMessage: proto.Message.InteractiveMessage.fromObject({
body: proto.Message.InteractiveMessage.Body.create({
text: headerText
}),
footer: proto.Message.InteractiveMessage.Footer.create({
text: showAll ? 'Mapeo global de red' : 'Mapeo de red actual'
}),
header: proto.Message.InteractiveMessage.Header.create({
hasMediaAttachment: true,
imageMessage: mediaMessage.imageMessage
}),
nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
buttons: [
{
name: "quick_reply",
buttonParamsJson: JSON.stringify({
display_text: toFancy("sᥱr sᥙᑲ-ᑲ᥆𝗍 (QR)"),
id: `${usedPrefix}qr`
})
},
{
name: "quick_reply",
buttonParamsJson: JSON.stringify({
display_text: toFancy("Oᑲ𝗍ᥱᥒᥱr Cóძіg᥆"),
id: `${usedPrefix}code`
})
}
]
})
})
}
}
}, { quoted: m })

await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}
}

handler.tags = ['serbot']
handler.help = ['sockets', 'deletesesion', 'pausarai']
handler.command = [
'deletesesion', 'deletebot', 'deletesession', 'deletesesaion',
'stop', 'pausarai', 'pausarbot',
'bots', 'sockets', 'socket'
]

export default handler