import { shouldSilenceChatForBot, normalizeSessionJid } from '../../src/core/session-utils.js'
import fetch from 'node-fetch'

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

const fallbackImage = 'https://i.postimg.cc/6562JdR7/Hoshino-Ruby-(2).jpg'
const imagenes = [
'https://files.catbox.moe/xr2m6u.jpg',
fallbackImage
]
const matchedUrl = 'https://whatsapp.com/channel/0029VajmXke1iUxe23A3Ew35'

const rcanal = async (textoDelMensaje, m) => {
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

return {
extendedTextMessage: {
text: `⋆. 𐙚˚࿔ 𝐑𝐮𝐛𝐲 𝐇𝐨𝐬𝐡𝐢𝐧𝐨 𝜗𝜚˚⋆\n\n${textoDelMensaje}`,
matchedText: matchedUrl,
canonicalUrl: matchedUrl,
title: '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡in͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥',
description: '꒰ 🧺 ᑲіᥱᥒ᥎ᥱᥒіძ᥆ ᥲᥣ sᥙ́ρᥱr ᑲ᥆𝗍 ძᥱ ᥕһᥲ𝗍sᥲρρ ꒱',
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

function buildDetectMessage(m, usuario) {
const stubType = m.messageStubType

if (stubType === 21) {
return {
text: `𐔌 . ⋮ 𝐀 𝐕 𝐈 𝐒 𝐎 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 .ᐟ ֹ ₊ ꒱
⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

> ❀ ᯓ★ *@${usuario}* 𝐡𝐚 𝐜𝐚𝐦𝐛𝐢𝐚𝐝𝐨 𝐞𝐥 𝐧𝐨𝐦𝐛𝐫𝐞 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐨.
> ✦ 𝐀𝐡𝐨𝐫𝐚 𝐬𝐞 𝐥𝐥𝐚𝐦𝐚:
> ╰┈➤ *${styleText(m.messageStubParameters?.[0] || '')}*

⋆˚✿˖° ┈┈┈┈┈┈┈┈┈ ⋆˚✿˖°`
}
}

if (stubType === 22) {
return {
text: `𐔌 . ⋮ 𝐀 𝐕 𝐈 𝐒 𝐎 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 .ᐟ ֹ ₊ ꒱
⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

> ❀ 🖼️ 𝐒𝐞 𝐡𝐚 𝐚𝐜𝐭𝐮𝐚𝐥𝐢𝐳𝐚𝐝𝐨 𝐥𝐚 𝐢𝐦𝐚𝐠𝐞𝐧 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐨.
> ✦ 𝐀𝐜𝐜𝐢𝐨́𝐧 𝐫𝐞𝐚𝐥𝐢𝐳𝐚𝐝𝐚 𝐩𝐨𝐫:
> ╰┈➤ *@${usuario}* 𖹭.ᐟ

⋆˚✿˖° ┈┈┈┈┈┈┈┈┈ ⋆˚✿˖°`
}
}

if (stubType === 24) {
return {
text: `𐔌 . ⋮ 𝐀 𝐕 𝐈 𝐒 𝐎 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 .ᐟ ֹ ₊ ꒱
⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

> ❀ 📑 *@${usuario}* 𝐡𝐚 𝐜𝐚𝐦𝐛𝐢𝐚𝐝𝐨 𝐥𝐚 𝐝𝐞𝐬𝐜𝐫𝐢𝐩𝐜𝐢𝐨́𝐧.
> ✦ 𝐑𝐞𝐯𝐢𝐬𝐚 𝐥𝐚 𝐧𝐮𝐞𝐯𝐚 𝐢𝐧𝐟𝐨𝐫𝐦𝐚𝐜𝐢𝐨́𝐧 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐨 🫧.

⋆˚✿˖° ┈┈┈┈┈┈┈┈┈ ⋆˚✿˖°`
}
}

if (stubType === 23) {
return {
text: `𐔌 . ⋮ 𝐀 𝐕 𝐈 𝐒 𝐎 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 .ᐟ ֹ ₊ ꒱
⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

> ❀ 🔗 𝐄𝐥 𝐞𝐧𝐥𝐚𝐜𝐞 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐨 𝐡𝐚 𝐬𝐢𝐝𝐨 𝐫𝐞𝐬𝐭𝐚𝐛𝐥𝐞𝐜𝐢𝐝𝐨.
> ✦ 𝐀𝐜𝐜𝐢𝐨́𝐧 𝐫𝐞𝐚𝐥𝐢𝐳𝐚𝐝𝐚 𝐩𝐨𝐫: *@${usuario}*
> ╰┈➤ 🚫 𝐄𝐥 𝐞𝐧𝐥𝐚𝐜𝐞 𝐚𝐧𝐭𝐞𝐫𝐢𝐨𝐫 𝐲𝐚 𝐧𝐨 𝐬𝐢𝐫𝐯𝐞.

⋆˚✿˖° ┈┈┈┈┈┈┈┈┈ ⋆˚✿˖°`
}
}

if (stubType === 25) {
const type = m.messageStubParameters?.[0] === 'on' ? '𝐒𝐨𝐥𝐨 𝐀𝐝𝐦𝐢𝐧𝐬' : '𝐓𝐨𝐝𝐨𝐬'
return {
text: `𐔌 . ⋮ 𝐀 𝐕 𝐈 𝐒 𝐎 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 .ᐟ ֹ ₊ ꒱
⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

> ❀ ⚙️ *@${usuario}* 𝐡𝐚 𝐦𝐨𝐝𝐢𝐟𝐢𝐜𝐚𝐝𝐨 𝐥𝐨𝐬 𝐚𝐣𝐮𝐬𝐭𝐞𝐬.
> ✦ 𝐀𝐡𝐨𝐫𝐚 𝐥𝐚 𝐜𝐨𝐧𝐟𝐢𝐠𝐮𝐫𝐚𝐜𝐢𝐨́𝐧 𝐥𝐚 𝐩𝐮𝐞𝐝𝐞𝐧 𝐞𝐝𝐢𝐭𝐚𝐫:
> ╰┈➤ 🔓 *${styleText(type)}* 🪼

⋆˚✿˖° ┈┈┈┈┈┈┈┈┈ ⋆˚✿˖°`
}
}

if (stubType === 26) {
const closed = m.messageStubParameters?.[0] === 'on'
const action = closed ? '𝐂𝐞𝐫𝐫𝐨́ 𝐞𝐥 𝐆𝐫𝐮𝐩𝐨' : '𝐀𝐛𝐫𝐢𝐨́ 𝐞𝐥 𝐆𝐫𝐮𝐩𝐨'
const msg = closed ? 'Solo Admins pueden escribir' : 'Todos pueden escribir'
return {
text: `𐔌 . ⋮ 𝐀 𝐕 𝐈 𝐒 𝐎 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 .ᐟ ֹ ₊ ꒱
⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

> ❀ 💬 𝐄𝐥 𝐠𝐫𝐮𝐩𝐨 𝐡𝐚 𝐬𝐢𝐝𝐨 *${action}* 𝐩𝐨𝐫 *@${usuario}*
> ✦ 𝐄𝐬𝐭𝐚𝐝𝐨 𝐚𝐜𝐭𝐮𝐚𝐥 𝐝𝐞𝐥 𝐜𝐡𝐚𝐭:
> ╰┈➤ 📣 *${styleText(msg)}* 𐙚⋆°.

⋆˚✿˖° ┈┈┈┈┈┈┈┈┈ ⋆˚✿˖°`
}
}

if (stubType === 29) {
const nuevoAdmin = normalizeMentionJid(m.messageStubParameters?.[0])
if (!nuevoAdmin) return null
return {
text: `𐔌 . ⋮ 𝐀 𝐕 𝐈 𝐒 𝐎 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 .ᐟ ֹ ₊ ꒱
⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

> ❀ 👑 𝐓𝐞𝐧𝐞𝐦𝐨𝐬 𝐮𝐧 𝐧𝐮𝐞𝐯𝐨 𝐚𝐝𝐦𝐢𝐧𝐢𝐬𝐭𝐫𝐚𝐝𝐨𝐫.
> ✦ 𝐀𝐜𝐜𝐢𝐨́𝐧 𝐫𝐞𝐚𝐥𝐢𝐳𝐚𝐝𝐚 𝐩𝐨𝐫 *@${usuario}*
> ╰┈➤ 🫡 ${mentionLabel(nuevoAdmin)} 𝐲𝐚 𝐞𝐬 𝐚𝐝𝐦𝐢𝐧.

⋆˚✿˖° ┈┈┈┈┈┈┈┈┈ ⋆˚✿˖°`
}
}

if (stubType === 30) {
const exAdmin = normalizeMentionJid(m.messageStubParameters?.[0])
if (!exAdmin) return null
return {
text: `𐔌 . ⋮ 𝐀 𝐕 𝐈 𝐒 𝐎 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 .ᐟ ֹ ₊ ꒱
⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

> ❀ 📉 𝐒𝐞 𝐡𝐚𝐧 𝐫𝐞𝐯𝐨𝐜𝐚𝐝𝐨 𝐩𝐞𝐫𝐦𝐢𝐬𝐨𝐬 𝐝𝐞 𝐚𝐝𝐦𝐢𝐧𝐢𝐬𝐭𝐫𝐚𝐝𝐨𝐫.
> ✦ 𝐀𝐜𝐜𝐢𝐨́𝐧 𝐫𝐞𝐚𝐥𝐢𝐳𝐚𝐝𝐚 𝐩𝐨𝐫 *@${usuario}*
> ╰┈➤ 😔 ${mentionLabel(exAdmin)} 𝐝𝐞𝐣𝐚 𝐝𝐞 𝐬𝐞𝐫 𝐚𝐝𝐦𝐢𝐧.

⋆˚✿˖° ┈┈┈┈┈┈┈┈┈ ⋆˚✿˖°`
}
}

return null
}

let handler = m => m
handler.before = async function (m, { conn }) {
if (!m.messageStubType || !m.isGroup) return

const chat = global.db.getChat(m.chat)
if (shouldSilenceChatForBot(chat, normalizeSessionJid(conn))) return
if (!chat.detect) return

const senderJid = normalizeMentionJid(m.sender) || m.sender
const usuario = senderJid.split('@')[0].split(':')[0]
const payloadData = buildDetectMessage(m, usuario)
if (!payloadData?.text) return

try {
const payload = await rcanal(payloadData.text, m)
await conn.relayMessage(m.chat, payload, {})
} catch (e) {
console.error(e)
}
}

export default handler