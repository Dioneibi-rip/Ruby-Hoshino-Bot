import { normalizeSessionJid } from '../../core/session-utils.js'
import { updateSubbot, upsertSubbot } from '../../core/subbot-store.js'
import { upsertBotProfile } from '../../core/botProfileStore.js'

let handler = async (m, { conn, text }) => {
const currency = String(text || '').trim().slice(0, 40)
if (!currency) return conn.reply(m.chat, '🥀 Usa: #setmoneda <nombre>', m)
try {
const botJid = normalizeSessionJid(conn.user?.jid) || 'primary'
const updated = updateSubbot(botJid, { currency }) || upsertSubbot({ botJid, ownerJid: m.sender, sessionId: botJid, sessionPath: '', status: 'open', currency })
const meta = { ...(conn.botProfile?.meta || {}), currencyName: currency, currency_name: currency }
conn.botProfile = upsertBotProfile(conn?.session?.id || botJid, { meta })
global.currency = currency
return conn.reply(m.chat, `✅ Moneda local de ${updated.bot_jid} cambiada a: ${currency}`, m)
} catch {
return conn.reply(m.chat, '🥀 No se pudo guardar la moneda local.', m)
}
}
handler.help = ['setmoneda <nombre>']
handler.tags = ['jadibot']
handler.command = ['setmoneda']
export default handler
