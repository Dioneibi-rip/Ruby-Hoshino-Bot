const GROUP_LINK_REGEX = /(?:https?:\/\/)?chat\.whatsapp\.com\/[0-9A-Za-z]{20,24}/i
const CHANNEL_LINK_REGEX = /(?:https?:\/\/)?whatsapp\.com\/channel\/[0-9A-Za-z]{20,32}/i
const GENERIC_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?[\w-]+(?:\.[\w-]+)+(?:\/\S*)?/i

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

export function messageHasModeratedLink(text = '') {
const value = String(text || '')
return GROUP_LINK_REGEX.test(value) || CHANNEL_LINK_REGEX.test(value) || GENERIC_LINK_REGEX.test(value)
}

export async function enforceAntiLink(conn, m, sender, permissionContext = {}) {
if (!m?.isGroup || !messageHasModeratedLink(m.text)) return false
const chat = global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat]
if (!chat?.antiLink && !chat?.antilink) return false
const { isAdmin, isOwner, isROwner, isBotAdmin } = permissionContext
if (isAdmin || isOwner || isROwner || m.fromMe) return false
if (!isBotAdmin && !m.isBotAdmin) return false
const deletePayload = getMessageDeletePayload(m, sender)
if (deletePayload) await conn.sendMessage(m.chat, { delete: deletePayload }).catch(() => {})
const user = global.db?.getUser?.(sender) || global.db?.data?.users?.[sender]
if (user) {
if (typeof user.warn !== 'number' || !Number.isFinite(user.warn)) user.warn = 0
user.warn += 1
}
await conn.sendMessage(m.chat, { text: `*「 ENLACE DETECTADO 」*\n\n《✧》@${String(sender).split('@')[0]} Rompiste las reglas del Grupo serás eliminado...`, mentions: [sender] }, { quoted: m }).catch(() => {})
await conn.groupParticipantsUpdate?.(m.chat, [sender], 'remove').catch(() => {})
m.__pluginHalt = true
return true
}

export async function runAutoModeration(conn, m, sender, permissionContext = {}) {
if (await enforceMutedUser(conn, m, sender, permissionContext)) return true
return false
}
