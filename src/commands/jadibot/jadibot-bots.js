import { listSubbots } from '../../core/subbot-store.js'

let handler = async (m, { conn }) => {
const bots = listSubbots()
if (!bots.length) return conn.reply(m.chat, '🤖 No hay Sub-Bots registrados.', m)
const text = bots.map((bot, i) => `${i + 1}. ${bot.bot_jid}\nOwner: ${bot.owner_jid}\nEstado: ${bot.status}${bot.paused ? ' pausado' : ''}\nMoneda: ${bot.currency}`).join('\n\n')
return conn.reply(m.chat, `🤖 Sub-Bots registrados:\n\n${text}`, m)
}
handler.help = ['bots']
handler.tags = ['jadibot']
handler.command = ['bots', 'sockets', 'socket']
export default handler
