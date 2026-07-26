import { promises as fsPromises } from "fs"
import path, { join } from 'path'
import ws from 'ws'
const { proto, generateWAMessageFromContent, prepareWAMessageMedia, jidNormalizedUser } = (await import("@whiskeysockets/baileys")).default
async function pathExists(file){
try{
await fsPromises.access(file)
return true
}catch{
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
const normalizeJid = (jid = '') => jidNormalizedUser(jid) || String(jid).replace(/:\d+(?=@)/, '')
const cleanPhone = (jid = '') => normalizeJid(jid).split('@')[0]
const displayName = (sock) => {
const jid = sock?.user?.jid || sock?.user?.id || ''
return sock?.user?.name || sock?.user?.pushname || cleanPhone(jid) || toFancy('Sin Nombre')
}
const participantJids = new Set((participants || []).flatMap((participant) => [participant?.jid, participant?.id, participant?.lid].filter(Boolean).map(normalizeJid)))
const isInCurrentGroup = (sock) => !m.isGroup || participantJids.has(normalizeJid(sock?.user?.jid || sock?.user?.id || ''))
const wantsAll = /^all$/i.test((args?.[0] || text || '').trim())
const showAll = Boolean(isOwner && wantsAll)
const mainSocket = socketOpen(global.conn) ? [{ sock: global.conn, type: 'main' }] : []
const subSockets = [...new Set([...(global.conns || []).filter(socketOpen)])].map((sock) => ({ sock, type: 'Sub' }))
const activeSockets = [...mainSocket, ...subSockets]
const scopedSockets = showAll ? activeSockets : activeSockets.filter(isInCurrentGroup)
const mainCount = activeSockets.filter(({ type }) => type === 'main').length
const subCount = activeSockets.filter(({ type }) => type === 'Sub').length
const scopedLabel = showAll ? 'Bots activos' : 'Bots en el grupo'
const botLines = scopedSockets.length
? scopedSockets.map(({ sock, type }) => `- [${type} *Ruby*] › ${displayName(sock)}`).join('\n')
: `- ${showAll ? 'No hay bot activos.' : 'No hay bots activos en este grupo.'}`
const headerText = [
`Sockets activos: *${activeSockets.length}*`,
'',
`- Principales: *${mainCount}*`,
`- Subs: *${subCount}*`,
'',
`${scopedLabel}: *${scopedSockets.length}*`,
botLines,
].join('\n')

let mediaMessage = await prepareWAMessageMedia({
image: { url: 'https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/855ccb61ddb6e8a6265750cb601ca07b.jpg' }
}, { upload: conn.waUploadToServer })

let msg = generateWAMessageFromContent(m.chat, {
viewOnceMessage: {
message: {
interactiveMessage: proto.Message.InteractiveMessage.fromObject({
body: proto.Message.InteractiveMessage.Body.create({
text: headerText
}),
footer: proto.Message.InteractiveMessage.Footer.create({
text: showAll ? 'Vista global de sockets' : 'Vista del grupo actual'
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
