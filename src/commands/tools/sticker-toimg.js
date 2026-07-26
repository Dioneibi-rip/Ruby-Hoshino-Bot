import { webp2png } from '../../library/media-converter.js'

let handler = async (m, { conn }) => {
const q = m.quoted || m
const mime = q?.mimetype || q?.mediaType || q?.msg?.mimetype || ''
if (!/webp|sticker/i.test(mime)) return m.reply(`${emoji} Debes citar un sticker para convertir a imagen.`)
let output
try {
const media = await q.download()
if (!media?.length) return m.reply(`${msm} No pude descargar el sticker citado.`)
output = await webp2png(media)
if (!output?.length) return m.reply(`${msm} No pude convertir el sticker a imagen.`)
await conn.sendFile(m.chat, output, 'sticker.png', null, m)
} catch (err) {
console.error('Error en toimg:', err)
await m.reply(`⚠️ No pude convertir el sticker a imagen: ${err.message}`)
return false
}
}

handler.help = ['toimg (reply)']
handler.tags = ['sticker']
handler.command = ['toimg', 'img', 'jpg']

export default handler
