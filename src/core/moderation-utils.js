import { normalizeSessionJid } from './session-utils.js'

const GROUP_LINK_REGEX = /(?:https?:\/\/)?chat\.whatsapp\.com\/(?:invite\/)?[0-9A-Za-z]{16,}/i
const CHANNEL_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/[0-9A-Za-z]{16,}/i
const GENERIC_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?[\w-]+(?:\.[\w-]+)+(?:\/\S*)?/i
const WHATSAPP_TEXT_REGEX = /whatsapp/i

function directMessageTexts(message = {}) {
return [
message.conversation,
message.extendedTextMessage?.text,
message.extendedTextMessage?.matchedText,
message.extendedTextMessage?.canonicalUrl,
message.imageMessage?.caption,
message.videoMessage?.caption,
message.documentMessage?.caption,
message.buttonsResponseMessage?.selectedDisplayText,
message.listResponseMessage?.title,
message.templateButtonReplyMessage?.selectedDisplayText
]
}

export function getModerationTextCandidates(m = {}) {
return [
m.text,
m.body,
m.caption,
m.msg?.text,
m.msg?.caption,
m.msg?.matchedText,
m.msg?.canonicalUrl,
...directMessageTexts(m.message || {})
].filter(text => typeof text === 'string' && text.length)
}

export function findModeratedLink(m = {}) {
const values = typeof m === 'string' ? [m] : getModerationTextCandidates(m)
return values.find(text => GROUP_LINK_REGEX.test(text) || CHANNEL_LINK_REGEX.test(text) || GENERIC_LINK_REGEX.test(text)) || ''
}

export function findWhatsAppModeratedLink(m = {}) {
const values = typeof m === 'string' ? [m] : getModerationTextCandidates(m)
return values.find(text => GROUP_LINK_REGEX.test(text) || CHANNEL_LINK_REGEX.test(text)) || ''
}

export function hasWhatsAppText(m = {}) {
const values = typeof m === 'string' ? [m] : getModerationTextCandidates(m)
return values.some(text => WHATSAPP_TEXT_REGEX.test(text))
}

export function isAntiLinkEnabled(chat = {}) {
if (!chat || typeof chat !== 'object') return false
if (typeof chat.antiLink !== 'undefined') return Boolean(chat.antiLink)
return Boolean(chat.antilink)
}

export function isUserMutedInChat(user, chatId) {
if (!user || !chatId) return false
if (user.isMuted === true) return true
if (user.mutedChats?.[chatId] === true) return true
return user.muto === true && (!user.mutoChat || user.mutoChat === chatId)
}

export function getMessageDeletePayload(m, sender) {
const key = m?.__deleteKey || m?.key || {}
const id = key.id || m?.id
const remoteJid = key.remoteJid || m?.chat
if (!id || !remoteJid) return null
const payload = { remoteJid, fromMe: Boolean(key.fromMe), id }
const participant = key.participant || m?.participant || sender || m?.sender
if (m?.isGroup && participant) payload.participant = participant
return payload
}

export async function enforceMutedUser(conn, m, sender, permissionContext = {}) {
if (!m?.isGroup) return false
const user = global.db?.getUser?.(sender) || global.db?.data?.users?.[sender]
if (!isUserMutedInChat(user, m.chat)) return false
if (permissionContext.isBotAdmin || m.isBotAdmin) {
const deletePayload = getMessageDeletePayload(m, sender)
if (deletePayload) await conn.sendMessage(m.chat, { delete: deletePayload }).catch(() => {})
}
return true
}

export function messageHasModeratedLink(value = '') {
return Boolean(findModeratedLink(value))
}

export function isBotResponsible(conn, chatId = '') {
if (!chatId?.endsWith?.('@g.us')) return true
const current = normalizeSessionJid(conn?.authState?.creds?.me?.jid || conn?.authState?.creds?.me?.id || conn?.user?.jid || conn?.user?.id || conn)
if (!current) return false
let primary = ''
const chat = global.db?.getChat?.(chatId) || global.db?.data?.chats?.[chatId] || {}
primary = chat?.primaryBot || chat?.botPrimario || chat?.primaryBotJid || ''
try { primary ||= global.db?.sqlite?.prepare('SELECT primary_bot_jid FROM group_routing WHERE chat_id=?').get(chatId)?.primary_bot_jid || '' } catch {}
primary = normalizeSessionJid(primary)
return !primary || primary === current
}

export async function enforceAntiLink(conn, m, sender, permissionContext = {}) {
if (!m?.isGroup) return false
if (!isBotResponsible(conn, m.chat)) return false
const chat = global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat]
if (!isAntiLinkEnabled(chat)) return false
const { isAdmin, isOwner, isROwner, isBotAdmin } = permissionContext
if (isAdmin || isOwner || isROwner || m.fromMe) return false
if (conn?.decodeJid?.(sender || m.sender) === conn?.decodeJid?.(conn?.user?.id)) return false
const detectedLink = findWhatsAppModeratedLink(m)
if (!detectedLink) return false
if (!isBotAdmin && !m.isBotAdmin) {
await m.reply?.('✦ El antilink está activo pero no puedo eliminarte porque no soy admin.').catch(() => {})
return true
}
const inviteCode = await conn.groupInviteCode?.(m.chat).catch(() => null)
if (inviteCode && detectedLink.includes(`chat.whatsapp.com/${inviteCode}`)) return false
const deletePayload = getMessageDeletePayload(m, sender)
await conn.sendMessage(m.chat, { delete: deletePayload || m.key }).catch(error => console.error('Error al borrar mensaje antilink:', error))
await conn.sendMessage(m.chat, { text: `*「 ENLACE DETECTADO 」*\n\n《✧》@${String(sender || m.sender).split('@')[0]} Rompiste las reglas del Grupo. Serás eliminado...`, mentions: [sender || m.sender] }, { quoted: m }).catch(() => {})
try {
await conn.groupParticipantsUpdate?.(m.chat, [sender || m.sender], 'remove')
} catch (error) {
console.error('[moderation] no se pudo expulsar al usuario', error)
}
m.__pluginHalt = true
return true
}

export async function runAutoModeration(conn, m, sender, permissionContext = {}) {
if (await enforceMutedUser(conn, m, sender, permissionContext)) return true
if (await enforceAntiLink(conn, m, sender, permissionContext)) return true
return false
}
