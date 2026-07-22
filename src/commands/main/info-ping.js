import moment from '../../library/momentCompat.js';

function getWhatsAppLatency(m) {
const timestamp = Number(m?.messageTimestamp || 0)
if (!timestamp) return 0
return Math.max(0, moment().diff(moment(timestamp * 1000), 'milliseconds'))
}

let handler = async (m, { conn }) => {
const latensi = getWhatsAppLatency(m)
conn.reply(m.chat, `🍭 *¡Pong!*\n> Tiempo ⴵ ${latensi}ms`, m)
}
handler.help = ['ping']
handler.tags = ['info']
handler.command = ['ping', 'p']
handler.register = true

export default handler
