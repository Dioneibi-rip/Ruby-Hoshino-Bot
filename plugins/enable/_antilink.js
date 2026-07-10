const WHATSAPP_LINK_REGEX = /(?:https?:\/\/)?(?:chat\.whatsapp\.com\/(?:invite\/)?[0-9A-Za-z]{16,}|(?:www\.)?whatsapp\.com\/channel\/[0-9A-Za-z]{16,})/i
const WHATSAPP_TEXT_REGEX = /whatsapp/i

function extractStringsDeep(value, seen = new WeakSet()) {
if (typeof value === 'string') return [value]
if (!value || typeof value !== 'object') return []
if (seen.has(value)) return []
seen.add(value)
if (Buffer.isBuffer(value)) return []
if (Array.isArray(value)) return value.flatMap(item => extractStringsDeep(item, seen))
return Object.values(value).flatMap(item => extractStringsDeep(item, seen))
}

function getAllCandidateStrings(m) {
return [
m.text,
m.body,
m.caption,
m.message?.conversation,
m.message?.extendedTextMessage?.text,
m.message?.extendedTextMessage?.matchedText,
m.message?.extendedTextMessage?.canonicalUrl,
...extractStringsDeep(m.message)
].filter(text => typeof text === 'string' && text.length)
}

function findWhatsAppLink(m) {
return getAllCandidateStrings(m).find(text => WHATSAPP_LINK_REGEX.test(text)) || ''
}

function hasWhatsAppText(m) {
return getAllCandidateStrings(m).some(text => WHATSAPP_TEXT_REGEX.test(text))
}

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
if (!m.isGroup) return !0

const chat = global.db.data.chats[m.chat] || {}
if (!chat.antiLink && !chat.antilink) return !0

if (isAdmin || isOwner || isROwner || m.fromMe) return !0

if (hasWhatsAppText(m)) {
try {
console.log(JSON.stringify(m.message, null, 2))
} catch (e) {
console.log('No se pudo serializar m.message en antilink:', e)
}
}

const detectedLink = findWhatsAppLink(m)
if (!detectedLink) return !0

if (!isBotAdmin) {
await m.reply('✦ El antilink está activo pero no puedo eliminarte porque no soy admin.')
return !0
}

const inviteCode = await conn.groupInviteCode(m.chat).catch(() => null)
if (inviteCode && detectedLink.includes(`chat.whatsapp.com/${inviteCode}`)) return !0

await conn.sendMessage(m.chat, { delete: m.key })
await conn.sendMessage(m.chat, { text: `*「 ENLACE DETECTADO 」*\n\n《✧》@${m.sender.split('@')[0]} Rompiste las reglas del Grupo. Serás eliminado...`, mentions: [m.sender] }, { quoted: m })

try {
await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
} catch (e) {
console.error('Error al expulsar infractor en antilink:', e)
}

m.__pluginHalt = true
return !0
}
