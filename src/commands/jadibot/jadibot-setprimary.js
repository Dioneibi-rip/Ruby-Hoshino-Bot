import { setGroupPrimaryBot } from '../../core/subbot-store.js'
let handler = async (m, { conn }) => {
if (!m.isGroup) return conn.reply(m.chat, '🥀 Este comando solo funciona en grupos.', m)
const mentioned = m.mentionedJid?.[0] || m.quoted?.sender || ''
const target = mentioned || conn.user?.jid || 'primary'
const primary = setGroupPrimaryBot(m.chat, target)
return conn.reply(m.chat, `✅ Bot primario del grupo configurado en:\n${primary}`, m)
}
handler.help = ['setprimary @bot']
handler.tags = ['jadibot']
handler.group = true
handler.admin = true
handler.command = ['setprimary', 'botprimario', 'setbot']
export default handler
