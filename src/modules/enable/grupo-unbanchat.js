import { normalizeSessionJid, setChatBannedForBot } from '../../core/session-utils.js'

let handler = async (m, { conn, isOwner }) => {
const botJid = normalizeSessionJid(conn)
const isAllowed = isOwner || m.fromMe
if (!isAllowed) return m.react('❌')
const chat = global.db.getChat(m.chat)
const ok = setChatBannedForBot(chat, botJid, false)
global.db.updateChat(m.chat, chat)
await m.react(ok ? '✅' : '❌')
}
handler.help = ['unbanchat']
handler.tags = ['owner']
handler.command = ['unbanchat', 'desbanearchat']
export default handler
