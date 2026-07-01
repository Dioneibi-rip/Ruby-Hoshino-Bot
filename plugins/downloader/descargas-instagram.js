import { igdl } from 'ruhend-scraper'
import { enqueueMediaJob, getMediaQueueConnection } from '../../lib/queue.js'

var handler = async (m, { conn, args, command, text }) => {
const isCmd = /^(ig|instagram|instadl|igdl)$/i.test(command)
if (!isCmd) return
if (!text && !args[0]) return conn.reply(m.chat, `🚩 *Ingrese un enlace de Instagram*\n\nEjemplo: !ig https://www.instagram.com/reel/xxxx`, m, rcanal)
const url = args[0] || text
if (!url.match(/instagram.com|instagr.am|ig.me/)) return conn.reply(m.chat, '🚩 *Enlace no válido*', m, rcanal)

await conn.reply(m.chat, '⁖❤️꙰  *Descargando su video de Instagram*', m, {
contextInfo: {
forwardingScore: 2022,
isForwarded: true
}
})

m.react && m.react(rwait).catch(() => {})
await enqueueMediaJob('instagram', {
chat: m.chat,
url,
message: { key: m.key, message: m.message, sender: m.sender, chat: m.chat }
}, { conn })
}

handler.help = ['ig']
handler.tags = ['descargas']
handler.command = ['ig', 'instagram', 'igdl', 'instadl']
handler.register = true
handler.estrellas = 1

export default handler

global.queueHandlers ||= new Map()
global.queueHandlers.set('instagram', async (data) => {
const conn = getMediaQueueConnection()
const m = data.message

async function reportError(e) {
await conn.reply(data.chat, '⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁', m, rcanal)
console.log(e)
}

try {
const res = await igdl(data.url)
const list = res.data || res

if (!list || (Array.isArray(list) && list.length === 0)) throw new Error('No se encontró contenido')

for (let i = 0; i < list.length; i++) {
const media = list[i]
const mediaUrl = media.url || media
const isVideo = /(\.mp4|video)/i.test(mediaUrl)
const ext = isVideo ? 'mp4' : 'jpg'
const prettyCaption = '🌹̫ᩙ᮫〫𝆬  𝙘𝙤𝙣𝙩𝙚𝙣𝙞𝙙𝙤 𝙙𝙚 𝙞𝙣𝙨𝙩𝙖𝙜𝙧𝙖𝙢 𝙡𝙞𝙨𝙩𝙤'

await conn.sendFile(data.chat, mediaUrl, `instagram.${ext}`, prettyCaption, m)
await new Promise(r => setTimeout(r, 800))
}
} catch (e) {
reportError(e)
}
})
