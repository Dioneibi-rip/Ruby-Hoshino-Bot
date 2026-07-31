import { resetGroupPrimaryBot } from '../../core/subbot-store.js'
let handler = async (m, { conn }) => {
if (!m.isGroup) return conn.reply(m.chat, '🥀 Este comando solo funciona en grupos.', m)
resetGroupPrimaryBot(m.chat)
return conn.reply(m.chat, '✅ Ruta de bots restablecida. Todos los Sub-Bots pueden responder de nuevo.', m)
}
handler.help = ['resetbot']
handler.tags = ['jadibot']
handler.group = true
handler.admin = true
handler.command = ['resetbot']
export default handler
