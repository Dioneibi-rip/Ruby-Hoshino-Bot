import { normalizeSessionJid, setChatBannedForBot } from '../../core/session-utils.js'

function ownerNumber(value = '') {
return String(Array.isArray(value) ? value[0] : value || '').split('@')[0].replace(/[^0-9]/g, '')
}

function isGlobalOwner(sender = '') {
const senderNumber = ownerNumber(sender)
return Boolean(senderNumber && (global.owner || []).some(owner => ownerNumber(owner) === senderNumber))
}

function currentBotJid(conn) {
return normalizeSessionJid(conn?.user?.jid || conn?.user?.id || conn?.authState?.creds?.me?.jid || conn?.authState?.creds?.me?.id || conn) || 'primary'
}

async function reactSuccess(conn, m) {
return conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
}

let handler = async (m, { conn }) => {
if (!m.fromMe && !isGlobalOwner(m.sender)) return conn.reply(m.chat, '⚠️ Solo el propio bot o un owner global pueden usar este comando.', m)
const chat = global.db.getChat?.(m.chat) || global.db.data?.chats?.[m.chat] || { id: m.chat }
chat.bannedBots = chat.bannedBots && typeof chat.bannedBots === 'object' && !Array.isArray(chat.bannedBots) ? chat.bannedBots : {}
const botJid = currentBotJid(conn)
chat.bannedBots[botJid] = true
setChatBannedForBot(chat, botJid, true)
if (global.db.updateChat) global.db.updateChat(m.chat, chat)
else if (global.db.set) global.db.set('chats', m.chat, chat)
global.db.scheduleFlush?.()
await global.db.write?.()
await reactSuccess(conn, m)
}
handler.help = ['banchat']
handler.tags = ['owner']
handler.command = ['banchat']
handler.group = true
export default handler
