import { normalizeSessionJid } from '../../core/session-utils.js'
import { updateSubbot, upsertSubbot } from '../../core/subbot-store.js'
let handler = async (m, { conn, text }) => {
const currency = String(text || '').trim().slice(0, 40)
if (!currency) return conn.reply(m.chat, '🥀 Usa: #setmoneda <nombre>', m)
const botJid = normalizeSessionJid(conn.user?.jid) || 'primary'
const updated = updateSubbot(botJid, { currency }) || upsertSubbot({ botJid, ownerJid: m.sender, sessionId: botJid, sessionPath: '', status: 'open', currency })
return conn.reply(m.chat, `✅ Moneda local de ${updated.bot_jid} cambiada a: ${currency}`, m)
}
handler.help = ['setmoneda <nombre>']
handler.tags = ['jadibot']
handler.command = ['setmoneda']
export default handler
