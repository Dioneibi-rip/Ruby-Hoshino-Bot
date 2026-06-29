import { enqueueMediaJob } from '../../lib/queue.js'

var handler = async (m, { conn, args, command, text }) => {
const isCmd = /^(ig|instagram|instadl|igdl)$/i.test(command)
if (!isCmd) return
if (!text && !args[0]) return conn.reply(m.chat, `🚩 *Ingrese un enlace de Instagram*\n\nEjemplo: !ig https://www.instagram.com/reel/xxxx`, m, rcanal)
const url = args[0] || text
if (!url.match(/instagram.com|instagr.am|ig.me/)) return conn.reply(m.chat, '🚩 *Enlace no válido*', m, rcanal)
await enqueueMediaJob('instagram', { chat: m.chat, url, sender: m.sender })
}

handler.help = ['ig']
handler.tags = ['descargas']
handler.command = ['ig', 'instagram', 'igdl', 'instadl']
handler.register = true
handler.estrellas = 1

export default handler
