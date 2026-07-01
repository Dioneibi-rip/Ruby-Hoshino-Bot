import { normalizeSessionJid, setChatBannedForBot } from '../../src/core/session-utils.js'

let handler = async (m, { conn, isROwner }) => {
const botJid = normalizeSessionJid(conn)
if (!isROwner && !m.fromMe) return m.react('❌')
const chat = global.db.getChat(m.chat)
const ok = setChatBannedForBot(chat, botJid, false)
global.db.updateChat(m.chat, chat)
await m.react(ok ? '✅' : '❌')
}
handler.help = ['unbanchat']
handler.tags = ['owner']
handler.command = ['unbanchat', 'desbanearchat']
export default handler
