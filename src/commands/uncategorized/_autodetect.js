import { shouldSilenceChatForBot, normalizeSessionJid } from '../../core/session-utils.js'

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

// 🎀 Maquetación de Notificaciones de Grupo Estéticas
function buildDetectMessage(m, usuario) {
const stubType = m.messageStubType
const baseHeader = `𐔌 . ⋮ ᑎO𝖳𝖨𝖥𝖨𝖢𝖢𝖨Oᑎ .ᐟ ֹ ₊ ꒱\n︶ ⏝ ︶ ୨୧ ︶ ⏝ ︶\n\n» 👤 *ᴀᴄᴛᴏʀ:* @${usuario}\n`

if (stubType === 21) {
return {
text: `${baseHeader}「 📝 」 *ᴇsᴛᴀᴅᴏ:* \`ᴄᴀᴍʙɪᴏ́ ᴇʟ ɴᴏᴍʙʀᴇ\` ~ 🪐\n\n> 🎀 *ɴᴜᴇᴠᴏ ᴛɪ́ᴛᴜʟᴏ:* ${styleText(m.messageStubParameters?.[0] || '')} 💫`
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