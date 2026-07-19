import { canManageBotSecurity, resetChatBotRouting } from '../../core/session-utils.js'
import { cleanupSessionState } from '../../core/session-manager.js'

let handler = async (m, { conn, isAdmin, isOwner, isROwner }) => {
if (m.isGroup && !(isAdmin || isOwner || isROwner || canManageBotSecurity(m.sender, conn))) {
global.dfail('admin', m, conn)
throw false
}
const chat = global.db.getChat(m.chat)
resetChatBotRouting(chat)
global.db.updateChat(m.chat, chat)
await global.db.write?.()
cleanupSessionState(conn)
if(Array.isArray(global.conns))for(const sub of global.conns)cleanupSessionState(sub)
global.__rubyPrimaryBotCache?.set?.(m.chat,'')
await conn.reply(m.chat, '✅ Estado de bots restablecido: sin bot primario y con todos los sub-bots habilitados en este grupo.', m)
}
handler.help = ['resetbot']
handler.tags = ['owner']
handler.command = ['resetbot']
handler.group = true
export default handler
