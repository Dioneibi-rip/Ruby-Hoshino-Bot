import { upsertBotProfile } from '../../core/botProfileStore.js'

let handler = async (m, { conn, text, isROwner }) => {
if (!isROwner && m.sender !== conn.user.jid) throw `Este comando solo puede ser utilizado por el propietario del bot.`
const currency = String(text || '').trim().slice(0, 40)
const current = conn.botProfile?.currencyName || global.currency || 'RubyCoins'
if (!currency) return m.reply(`*–––––『 MONEDA DEL BOT 』–––––*\n\nPor favor, proporciona un nombre para la moneda.\n> *Ejemplo:* #setmoneda Diamantes\n\n*Moneda actual:* ${current}`)
try {
const meta = { ...(conn.botProfile?.meta || {}), currencyName: currency, currency_name: currency }
conn.botProfile = upsertBotProfile(conn?.session?.id || conn?.user?.jid || 'primary', { meta })
global.currency = currency
const settings = global.db.get('settings', conn.user.jid) || {}
settings.moneda = currency
global.db.set('settings', conn.user.jid, settings)
return m.reply(`✅ El nombre de la moneda para este bot ha sido cambiado a: *${currency}*`)
} catch {
return m.reply('🥀 No se pudo guardar la moneda personalizada.')
}
}

handler.help = ['setmoneda <nombre>']
handler.tags = ['owner']
handler.command = ['setmoneda']
export default handler
