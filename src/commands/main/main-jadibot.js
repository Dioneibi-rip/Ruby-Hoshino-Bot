import { existsSync, promises as fsPromises, readdirSync, readFileSync, statSync } from "fs"
import path, { join } from 'path'
import ws from 'ws'
const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = (await import("@whiskeysockets/baileys")).default

let menuThumbPromise = null;

async function getMenuThumb() {
if (!menuThumbPromise) {
menuThumbPromise = fetch('https://i.postimg.cc/XqsLDBQ4/Ruby-Hoshino-Trailer-season-3.jpg')
.then(res => res.ok ? res.arrayBuffer() : null)
.then(buffer => buffer ? Buffer.from(buffer) : null)
.catch(() => null);
}
return menuThumbPromise;
}

async function getMenuQuoted(fallback) {
const thumb2 = await getMenuThumb();
if (!thumb2) return fallback;
return {
key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
message: {
productMessage: {
product: {
productImage: { jpegThumbnail: thumb2 },
title: 'INFO • SUBBOTS',
description: ' =͟͟͞͞(꒪ᗜ꒪ ‧̣̥̇) THE BEST IDOL',
retailerId: 'INFO • ESTADO',
productImageCount: 1
},
businessOwnerJid: '0@s.whatsapp.net'
}
},
participant: '0@s.whatsapp.net'
};
}

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
const quotedMsg = await getMenuQuoted(m)

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
await m.reply(`> ⚠️ \`𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 𝗂𝗇𝖾𝗌𝗉𝖾𝗋𝖺𝖽𝗈, 𝗅𝗈 𝗌𝗂𝖾𝗇𝗍𝗈 𝗆𝗎𝖼𝗁𝗈...\``)
console.error(e)
}

if (isDeleteSession) {
const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
const uniqid = `${who.split('@')[0]}`
const dirPath = `./${jadi}/${uniqid}`

if (!await pathExists(dirPath)) {
return conn.sendMessage(m.chat, {
text: `> 🚫 𝖲𝖾𝗌𝗂𝗈́𝗇 𝗇𝗈 𝖾𝗇𝖼𝗈𝗇𝗍𝗋𝖺𝖽𝖺 💧\n> 🌨️ (っ- ‸ - ς) \`𝖭𝗈 𝗍𝗂𝖾𝗇𝖾𝗌 𝗎𝗇𝖺 𝗌𝖾𝗌𝗂𝗈́𝗇 𝖺𝖼𝗍𝗂𝗏𝖺...\`\n\n> 🔰 \`𝖯𝗎𝖾𝖽𝖾𝗌 𝖼𝗋𝖾𝖺𝗋 𝗎𝗇𝖺 𝖼𝗈𝗇:\` *${usedPrefix}qr*\n> 📦 \`𝖮𝖻𝗍𝖾𝗇𝖾𝗋 𝖼𝗈́𝖽𝗂𝗀𝗈:\` *${usedPrefix}code*`
}, { quoted: quotedMsg })
}

if (global.conn.user.jid !== conn.user.jid) {
return conn.sendMessage(m.chat, {
text: `> 💬 𝜗ৎ \`𝖤𝗌𝗍𝖾 𝖼𝗈𝗆𝖺𝗇𝖽𝗈 𝗌𝗈𝗅𝗈 𝗉𝗎𝖾𝖽𝖾 𝗎𝗌𝖺𝗋𝗌𝖾 𝖽𝖾𝗌𝖽𝖾 𝖾𝗅 𝖡𝗈𝗍 𝖯𝗋𝗂𝗇𝖼𝗂𝗉𝖺𝗅.\``,
}, { quoted: quotedMsg })
}

try {
await m.react('🗑️')
await fsPromises.rm(dirPath, { recursive: true, force: true })
await conn.sendMessage(m.chat, {
text: `> 🌈 𝜗ৎ \`¡𝖳𝗈𝖽𝗈 𝗅𝗂𝗆𝗉𝗂𝗈! 𝖳𝗎 𝗌𝖾𝗌𝗂𝗈́𝗇 𝗁𝖺 𝗌𝗂𝖽𝗈 𝖾𝗅𝗂𝗆𝗂𝗇𝖺𝖽𝖺 𝖼𝗈𝗇 𝖾́𝗑𝗂𝗍𝗈.\` 🫧`
}, { quoted: quotedMsg })
} catch (e) {
reportError(e)
return false;
}
}
else if (isPauseBot) {
if (global.conn.user.jid == conn.user.jid) {
await conn.reply(m.chat, `> 🧊 ¡𝖤𝗒! 𝖭𝗈 𝗉𝗎𝖾𝖽𝖾𝗌 𝗉𝖺𝗎𝗌𝖺𝗋 𝖺𝗅 𝖻𝗈𝗍 𝗉𝗋𝗂𝗇𝖼𝗂𝗉𝖺𝗅 🪺`, quotedMsg);
return false;
}
await conn.reply(m.chat, `> 🔕 𝜗ৎ \`${botname || 'Sub-Bot'} 𝗁𝖺 𝗌𝗂𝖽𝗈 𝗉𝖺𝗎𝗌𝖺𝖽𝗈.\` 💤`, quotedMsg)
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
const groupParticipants = rawParticipants.map(getParticipantId).filter(Boolean)

const getAdminStatus = (jid) => {
if (!m.isGroup) return ''
const p = rawParticipants.find(v => getParticipantId(v) === jid)
return p?.admin ? '👑 𝖠𝖽𝗆𝗂𝗇' : '👤 𝖬𝗂𝖾𝗆𝖻𝗋𝗈'
}

const wantsAll = /^all$/i.test((args?.[0] || text || '').trim())
const showAll = Boolean(isOwner && wantsAll)
const mainJid = normalizeBotJid(global.conn?.user?.id || global.conn?.user?.jid || conn?.user?.id || conn?.user?.jid)
const mainSocket = socketOpen(global.conn) && mainJid ? [{ jid: mainJid, sock: global.conn, type: 'main' }] : []
const subFolderPath = global.rutaJadiBot || path.join(process.cwd(), global.jadi || jadi)
const subBots = [...new Set(getBotsFromFolder(subFolderPath))].map((number) => {
const jid = `${number}@s.whatsapp.net`
const sock = (global.conns || []).find((socket) => normalizeBotJid(socket?.subBotJid || socket?.user?.id || socket?.user?.jid) === jid)
return { jid, sock, type: '𝖲𝗎𝖻' }
})
const activeSockets = [...mainSocket, ...subBots]
const isInCurrentGroup = ({ jid }) => !m.isGroup || groupParticipants.includes(jid)
const scopedSockets = showAll ? activeSockets : activeSockets.filter(isInCurrentGroup)

const mainCount = mainSocket.length
const subCount = subBots.length
const scopedLabel = showAll ? '𝖡𝗈𝗍𝗌 𝖺𝖼𝗍𝗂𝗏𝗈𝗌' : '𝖡𝗈𝗍𝗌 𝖾𝗇 𝖾𝗅 𝗀𝗋𝗎𝗉𝗈'

const botLines = scopedSockets.length
? scopedSockets.map(({ jid, sock, type }) => {
const num = getRawNumber(jid)
const settings = global.db?.get?.('settings', jid) || global.db?.data?.settings?.[jid] || {}
const name = sock?.user?.name || sock?.user?.pushname || settings?.namebot2 || settings?.namebot || 'Ruby AI'
const role = getAdminStatus(jid)
const roleText = role ? `𓋲  *${role}*` : ''
return `> [${type}] ִ \`${name}\`\n> 📱 +${num} ${roleText}`
}).join('\n\n')
: `> 💧 (っ- ‸ - ς) \`No hay bots activos aquí...\``

const headerText = [
`ᅟᅟᅟ＼ׂׄᅟᅟᅟ｜ּᅟᅟᅟּׅ／ּ`,
`ᅟᅟ \`𝖲𝗈𝖼𝗄𝖾𝗍𝗌 𝖠𝖼𝗍𝗂𝗏𝗈𝗌: ${activeSockets.length}\``,
``,
`> *┌᷒👑⃞᷒ᩥ͜𑂳̸◢꯭⣦❀ 𝄦𝕝 𝖯𝗋𝗂𝗇𝖼𝗂𝗉𝖺𝗅𝖾𝗌:* \`${mainCount}\``,
`> *┌᷒💝⃞᷒ᩥ͜𑂳̸◢꯭⣦❀ 𝄦𝕝 𝖲𝗎𝖻𝖡𝗈𝗍𝗌:* \`${subCount}\``,
`> *┌᷒☁️⃞᷒ᩥ͜𑂳̸◢꯭⣦❀ 𝄦𝕝 ${scopedLabel}:* \`${scopedSockets.length}\``,
``,
botLines,
`ᅟᅟ◢⃝ᩡ⣦ 𝖲꯭𝖮꯭𝖢꯭𝖪꯭𝖤꯭𝖳꯭𝖲 ࡄ▆ᩘ̫✹`
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
text: showAll ? toFancy('Vista global de sockets') : toFancy('Vista del grupo actual')
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
}, { quoted: quotedMsg })

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