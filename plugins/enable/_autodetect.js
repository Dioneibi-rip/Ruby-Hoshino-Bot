import { shouldSilenceChatForBot, normalizeSessionJid } from '../../src/core/session-utils.js'
import fetch from 'node-fetch'

const imagenes = [
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%A4%8D%20(1).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%8C%9FRuby%20Hoshino%F0%9F%8C%9F.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%97%8B%F0%9D%97%8E%F0%9D%6BB%F0%9D%97%92%20%F0%9D%97%81%F0%9D%97%88%F0%9D%97%8C%F0%9D%97%81%F0%9D%97%82%F0%9D%97%87%F0%9D%97%88.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%93%A1%F0%9D%93%BE%F0%9D%93%AB%F0%9D%14%82%20%F0%9D%93%98%F0%9D%93%AC%F0%9D%93%B8%F0%9D%93%B7%F0%9D%93%BC%20%E2%AD%90%F0%9F%92%AB.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%91%B9%F0%9D%92%96%F0%9D%92%83%F0%9D%92%9A%20%F0%9D%91%AF%F0%9D%92%90%F0%9D%92%94%F0%9D%92%89%F0%9D%92%8A%F0%9D%92%8F%F0%9D%92%90.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%9D%A4.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%86Hoshino%20Ruby%E2%98%86.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%8★%20!!%20(2).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%8★%20!!%20(1).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%CB%9A%20%E0%BC%98%E2%99%A1%20%E2%8B%86%EF%BD%A1%CB%9A%20Hoshino%20Ruby.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/ruby%20hoshino%20(9).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/ruby%20hoshino%20(11).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(15).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(14).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(13).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20hoshino%20%F0%9F%A7%A1.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20_%20oshi%20no%20ko%20_.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20-%20%F0%9F%8C%9F%5BOshi%20no%20Ko%5D%F0%9F%8C%9F%20icons.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(10).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20%23oshinokk.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Hoshino%20Ruby%20(3).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%23oshinoko%20%23%EC%B5%9C%EC%95%A0%EC%9D%98%EC%95%84%EC%9D%B4.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%99%8D%F0%9D%99%AA%F0%9D%99%97%F0%9D%99%AE%20%F0%9D%99%83%F0%9D%99%A4%F0%9D%99%A8%F0%9D%99%9D%F0%9D%99%A4%F0%9D%99%9E%F0%9D%99%A3%F0%9D%99%A4.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%8E%80%20%E2%8B%AE%20%F0%9D%91%B9%F0%9D%92%96%F0%9D%92%83%F0%9D%92%9A%20%F0%9D%92%8A%F0%9D%92%84%F0%9D%92%90%F0%9D%92%8F.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%8★%20!!%20(3).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%9D%A4%EF%B8%8F%F0%9D%91%block%F0%9D%92%90%F0%9D%92%94%F0%9D%92%89%F0%9D%92%8A%F0%9D%92%8F%F0%9D%92%90%20%F0%9D%91%B9%F0%9D%92%96%F0%9D%92%83%F0%9D%92%9A%E2%9D%A4%EF%B8%8F.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E0%AD%A8%E0%A7%8E.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(19).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(18).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(17).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(16).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(16).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(15).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(14).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(13).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(12).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Hoshino%20Ruby%20%E2%99%A1.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Hoshino%20Ruby%20(4).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/(%F0%9F%8E%80)%20%20%E2%80%A6%20%20%E2%97%9E%20ruby%20%E2%97%9F%20%E2%98%86.jpeg"
]

const fallbackImage = 'https://raw.githubusercontent.com/Dioneibi-rip/imagenes/main/%E2%98%86Hoshino%20Ruby%E2%98%86.jpeg'

const STYLE_MAP = {
'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻',
'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈', 'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
'0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
}

const styleText = (text) => text.split('').map((char) => STYLE_MAP[char] || char).join('')

function normalizeMentionJid(value) {
if (!value) return null
if (typeof value === 'object') value = value.id || value.jid || value.phoneNumber || value.lid || ''
let text = String(value).trim()
if (!text) return null
if (text.startsWith('{')) {
try {
const parsed = JSON.parse(text)
text = parsed.id || parsed.jid || parsed.phoneNumber || parsed.lid || text
} catch {}
}
text = String(text).replace(/^@/, '').trim()
if (/^\d+$/.test(text)) return `${text}@s.whatsapp.net`
if (/^\d+@(?:s\.whatsapp\.net|lid)$/.test(text)) return text
return text.includes('@') ? text : null
}

function mentionLabel(value) {
const jid = normalizeMentionJid(value)
return jid ? `@${jid.split('@')[0].split(':')[0]}` : '@usuario'
}

// 🎀 Formateador Estético de Eventos del Grupo
function buildDetectMessage(m, usuario) {
const stubType = m.messageStubType
const baseHeader = `𐔌 . ⋮ ᗩ ᐯ I Տ O .ᐟ ֹ ₊ ꒱\n︶ ⏝ ︶ ୨୧ ︶ ⏝ ︶\n\n» 👤 *ᴀᴄᴛᴏʀ:* @${usuario}\n`

if (stubType === 21) {
return {
text: `${baseHeader}「 📝 」 *ᴇsᴛᴀᴅᴏ:* \`ᴄᴀᴍʙɪᴏ́ ᴇʟ ɴᴏᴍʙʀᴇ\` ~ 🪐\n\n> 📋 *ɴᴜᴇᴠᴏ ᴛɪ́ᴛᴜʟᴏ:* ${styleText(m.messageStubParameters?.[0] || '')} 💫`
}
}

if (stubType === 22) {
return {
text: `${baseHeader}「 🖼️ 」 *ᴇsᴛᴀᴅᴏ:* \`ᴄᴀᴍʙɪᴏ́ ʟᴀ ɪᴍᴀɢᴇɴ\` ~ 💕\n\n> 🫧 *ɴᴏᴛᴀ:* ᴇʟ ɪᴄᴏɴᴏ ᴅᴇʟ ɢʀᴜᴘᴏ sᴇ ʜᴀ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴏ ᴄᴏɴ ᴇ́xɪᴛᴏ. ฅ(•ㅅ•❀)ฅ`
}
}

if (stubType === 24) {
return {
text: `${baseHeader}「 📑 」 *ᴇsᴛᴀᴅᴏ:* \`ᴄᴀᴍʙɪᴏ́ ᴅᴇsᴄʀɪᴘᴄɪᴏ́ɴ\` ~ 🧸\n\n> 📝 *ɴᴏᴛɪғɪᴄᴀᴄɪᴏ́ɴ:* ʟᴀ ɪɴғᴏʀᴍᴀᴄɪᴏ́ɴ ᴅᴇʟ ᴄʜᴀᴛ ᴇs ɴᴜᴇᴠᴀ-ᴅᴇsᴜ.`
}
}

if (stubType === 23) {
return {
text: `${baseHeader}「 🔗 」 *ᴇsᴛᴀᴅᴏ:* \`ʀᴇsᴛᴀʙʟᴇᴄɪᴏ́ ᴇɴʟᴀᴄᴇ\` ~ 💌\n\n> 🚫 *ᴀʟᴇʀᴛᴀ:* ᴇʟ ʟɪɴᴋ ᴀɴᴛᴇʀɪᴏʀ ʜᴀ sɪᴅᴏ ᴀɴᴜʟᴀᴅᴏ ᴘᴏʀ sᴇɢᴜʀɪᴅᴀᴅ.`
}
}

if (stubType === 25) {
const type = m.messageStubParameters?.[0] === 'on' ? 'sᴏʟᴏ ᴀᴅᴍɪɴs' : 'ᴛᴏᴅᴏs'
return {
text: `${baseHeader}「 ⚙️ 」 *ᴇsᴛᴀᴅᴏ:* \`ᴀʟᴛᴇʀᴏ́ ᴀ𝛥ᴜsᴛᴇs\` ~ 🔧\n\n> 🔒 *ᴘᴇʀᴍɪsᴏs:* ᴀʜᴏʀᴀ ᴇᴅɪᴛᴀɴ: \`${type}\` 💫`
}
}

if (stubType === 26) {
const closed = m.messageStubParameters?.[0] === 'on'
const action = closed ? 'ᴄᴇʀʀᴏ́ ᴇʟ ɢʀᴜᴘᴏ 🔒' : 'ᴀʙʀɪᴏ́ ᴇʟ ɢʀᴜᴘᴏ 🔓'
const msg = closed ? 'sᴏʟᴏ ᴀᴅᴍɪɴs ᴘᴜᴇᴅᴇɴ ᴇsᴄʀɪʙɪʀ.' : 'ᴛᴏᴅᴏs ᴘᴜᴇᴅᴇɴ ᴇsᴄʀɪʙɪʀ.'
return {
text: `${baseHeader}「 💬 」 *ᴇsᴛᴀᴅᴏ:* \`${action}\` ~ ✨\n\n> 📣 *ᴄʜᴀᴛ:* ${msg} 🍡`
}
}

if (stubType === 29) {
const nuevoAdmin = normalizeMentionJid(m.messageStubParameters?.[0])
if (!nuevoAdmin) return null
return {
text: `${baseHeader}「 👑 」 *ᴇsᴛᴀᴅᴏ:* \`ɴᴜᴇᴠᴏ ᴀᴅᴍɪɴ-sᴇɴᴘᴀɪ\` ~ 💕\n\n> 🫡 *ᴀsᴄᴇɴᴅɪᴅᴏ:* ${mentionLabel(nuevoAdmin)} ¡ғᴇʟɪᴄɪᴅᴀᴅᴇs! 🎉`
}
}

if (stubType === 30) {
const exAdmin = normalizeMentionJid(m.messageStubParameters?.[0])
if (!exAdmin) return null
return {
text: `${baseHeader}「 📉 」 *ᴇsᴛᴀᴅᴏ:* \`ᴅᴇɢʀᴀᴅᴀᴅᴏ\` ~ (｡•́︿•̀｡)\n\n> 😔 *ʀᴇᴛɪʀᴀᴅᴏ:* ${mentionLabel(exAdmin)} ʏᴀ ɴᴏ ᴘᴏsᴇᴇ ᴘᴏᴅᴇʀᴇs ᴀᴅᴍɪɴ.`
}
}

return null
}

// 🪐 Inicializador del Sistema rcanal Decorado Global
global.rcanal = async (textoDelMensaje, m) => {
const randomUrl = imagenes[Math.floor(Math.random() * imagenes.length)] || fallbackImage
let rimg

try {
const response = await fetch(randomUrl)
if (response.ok) {
rimg = Buffer.from(await response.arrayBuffer())
} else {
throw new Error()
}
} catch (error) {
try {
const fallbackRes = await fetch(fallbackImage)
rimg = Buffer.from(await fallbackRes.arrayBuffer())
} catch {
rimg = null
}
}

const matchedUrl = randomUrl

return {
extendedTextMessage: {
text: `${textoDelMensaje}`,
matchedText: matchedUrl,
canonicalUrl: matchedUrl,
title: '⚡︎ 𝐑𝐮𝐛𝐲 𝐇𝐨𝐬𝐡𝐢𝐧𝐨 𝐁𝐨𝐭 ˚₊·—̳͟͞͞♡',
description: '꒰ 🍒 sᴜ́ᴘᴇʀ ʙᴏᴛ ᴍᴜʟᴛɪғᴜɴᴄɪᴏɴᴀʟ ᴅᴇ ᴡʜᴀᴛsᴀᴘᴘ ꒱',
previewType: 'shadow',
jpegThumbnail: rimg,
contextInfo: {
quotedMessage: m ? m.message : undefined,
participant: m ? m.sender : undefined,
stanzaId: m ? m.id : undefined,
remoteJid: m ? m.chat : undefined,
isForwarded: true,
forwardingScore: 999,
forwardedNewsletterMessageInfo: {
newsletterJid: global.channelRD?.id || '120363335626706839@newsletter',
newsletterName: global.channelRD?.name || '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏsʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭',
serverMessageId: -1
}
}
}
}
}

let handler = m => m
handler.before = async function (m, { conn }) {
if (!m.messageStubType || !m.isGroup) return

const chat = global.db?.data?.chats?.[m.chat] || global.db?.getChat?.(m.chat)
if (!chat) return

if (shouldSilenceChatForBot && shouldSilenceChatForBot(chat, normalizeSessionJid(conn))) return
if (!chat.detect) return

const senderJid = normalizeMentionJid(m.sender) || m.sender
const usuario = senderJid.split('@')[0].split(':')[0]
const payloadData = buildDetectMessage(m, usuario)
if (!payloadData?.text) return

try {
const payload = await global.rcanal(payloadData.text, m)
await conn.relayMessage(m.chat, payload, {})
} catch (e) {
console.error(e)
}
}

export default handler