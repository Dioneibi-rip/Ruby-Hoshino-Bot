import { canManageBotSecurity } from '../../core/session-utils.js'
import { cleanupSessionState } from '../../core/session-manager.js'

let handler = async (m, { conn, isAdmin, isOwner, isROwner }) => {
if (m.isGroup && !(isAdmin || isOwner || isROwner || canManageBotSecurity(m.sender, conn))) {
global.dfail('admin', m, conn)
throw false
}
const chat = global.db.getChat(m.chat)
chat.primaryBot = null
chat.botPrimario = null
chat.isBanned = {}
chat.bannedBots = []
if (chat.botSettings && typeof chat.botSettings === 'object') {
for (const settings of Object.values(chat.botSettings)) {
if (settings && typeof settings === 'object') settings.isBanned = false
}
}
global.db.updateChat(m.chat, chat)
cleanupSessionState(conn)
await conn.reply(m.chat, '✅ Estado de bots restablecido: sin bot primario y con todos los sub-bots habilitados en este grupo.', m)
}
handler.help = ['resetbot']
handler.tags = ['owner']
handler.command = ['resetbot']
handler.group = true
export default handler
