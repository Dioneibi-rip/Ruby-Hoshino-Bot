import { sticker } from '../../lib/sticker.js'

let handler = async (m, { conn, args }) => {
let q = m.quoted ? m.quoted : m
let mime = getMime(q)
if (!mime && !(args[0] && isUrl(args[0]))) return conn.reply(m.chat, '❌ Envía o responde a una imagen / gif / video con el comando.', m)
await m.react('🧃')
try {
let packstickers = global.db.getUser(m.sender) || {}
let texto1 = packstickers.text1 || global.packsticker || ''
let texto2 = packstickers.text2 || global.packsticker2 || ''
let txt = args.join(' ')
let marca = txt ? txt.split(/[\u2022|]/).map(v => v.trim()) : [texto1, texto2]
let stiker = null
if (mime) {
if (/video/.test(mime) && q.seconds > 15) return conn.reply(m.chat, '❌ El video no puede durar más de *15 segundos*', m)
let buffer = await downloadMedia(q, conn)
if (!buffer) throw 'No se pudo descargar el archivo'
stiker = await sticker(buffer, false, marca[0], marca[1])
} else if (args[0] && isUrl(args[0])) {
stiker = await sticker(false, args[0], marca[0], marca[1])
}
if (!stiker) throw 'No se pudo generar el sticker'
await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m })
} catch (e) {
await m.react('✖️')
await conn.reply(m.chat, '⚠ Error: ' + e, m)
}
}
handler.help = ['sticker']
handler.tags = ['sticker']
handler.command = ['s','sticker']
export default handler

function getMime(q) {
return q.mimetype || q.mediaType || q.message?.imageMessage?.mimetype || q.message?.videoMessage?.mimetype || q.message?.stickerMessage?.mimetype || ''
}

async function downloadMedia(q, conn) {
if (typeof q.download === 'function') return await q.download()
if (q.message) return await conn.downloadMediaMessage(q)
return null
}

const isUrl = text => {
return /^https?:\/\/.+\.(jpe?g|png|gif|webp)$/i.test(text)
}