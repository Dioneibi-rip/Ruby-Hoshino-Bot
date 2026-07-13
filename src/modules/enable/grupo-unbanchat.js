import { canManageBotSecurity, normalizeSessionJid, setChatBannedForBot } from '../../core/session-utils.js'

function getConnectionJids(conn) {
return [...new Set([
conn?.user?.jid,
conn?.user?.id,
conn?.decodeJid?.(conn?.user?.jid),
conn?.decodeJid?.(conn?.user?.id),
normalizeSessionJid(conn),
].map(normalizeSessionJid).filter(Boolean))]
}

function canManageChatBot(m, conn, { isAdmin, isOwner, isROwner } = {}) {
return Boolean(m.fromMe || isAdmin || isOwner || isROwner || canManageBotSecurity(m.sender, conn))
}

let handler = async (m, { conn, isAdmin, isOwner, isROwner }) => {
if (!canManageChatBot(m, conn, { isAdmin, isOwner, isROwner })) return m.react('❌')
const chat = global.db.getChat(m.chat)
const botJids = getConnectionJids(conn)
let ok = false
for (const botJid of botJids) ok = setChatBannedForBot(chat, botJid, false) || ok
if (chat.isBanned && typeof chat.isBanned === 'object') delete chat.isBanned['*']
if (chat.botSettings && typeof chat.botSettings === 'object') {
for (const botJid of botJids) {
if (chat.botSettings[botJid]) chat.botSettings[botJid].isBanned = false
}
}
global.db.updateChat(m.chat, chat)
global.db.scheduleFlush?.()
await m.react(ok ? '✅' : '❌')
}
handler.help = ['unbanchat']
handler.tags = ['owner']
handler.command = ['unbanchat', 'desbanearchat']
handler.admin = true
handler.group = true
export default handler
