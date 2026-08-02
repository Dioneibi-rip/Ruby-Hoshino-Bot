import { sticker } from '../../library/sticker.js'

let handler = async (m, { conn, args }) => {
let q = m?.quoted || m
let mime = getMime(q)
if (!mime && !(args[0] && isUrl(args[0]))) {
await conn.reply(m.chat, '❌ Envía o responde a una imagen / gif / video con el comando.', m)
return false
}
await m.react('🧃')
try {
const packstickers = global.db.getUser(m.sender) || {}
const botName = conn.botProfile?.botName || global.packname || 'Ruby Hoshino'
const defaultPack = String(packstickers.text1 ?? botName).trim()
const defaultAuthor = String(packstickers.text2 ?? conn.botProfile?.meta?.stickerAuthor ?? global.author ?? '').trim()
const txt = args.join(' ').trim()
const marca = txt ? txt.split(/[\u2022|]/).map(v => v.trim()) : [defaultPack, defaultAuthor]
let stiker = null
if (mime) {
if (/video/.test(mime) && Number(q?.seconds || q?.msg?.seconds || 0) > 15) {
await conn.reply(m.chat, '❌ El video no puede durar más de *15 segundos*', m)
return false
}
let buffer = await downloadMedia(q, conn)
if (!buffer) throw new Error('No se pudo descargar el archivo')
stiker = await sticker(buffer, false, marca[0], marca[1])
} else if (args[0] && isUrl(args[0])) {
stiker = await sticker(false, args[0], marca[0], marca[1])
}
if (!stiker) throw new Error('No se pudo generar el sticker')
await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m })
} catch (e) {
await m.react('✖️')
await conn.reply(m.chat, '⚠ Error: ' + (e?.message || e), m)
return false
}
}
handler.help = ['sticker']
handler.tags = ['sticker']
handler.command = ['s','sticker']
export default handler

function getMime(q) {
const message = q?.message || q?.msg || {}
return q?.mimetype || q?.mediaType || message?.imageMessage?.mimetype || message?.videoMessage?.mimetype || message?.stickerMessage?.mimetype || ''
}

async function downloadMedia(q, conn) {
if (!q) return null
if (typeof q?.download === 'function') return await q.download()
if (q?.message || q?.msg) return await conn.downloadMediaMessage(q)
return null
}

const isUrl = text => /^https?:\/\/.+\.(jpe?g|png|gif|webp|mp4|webm)(\?.*)?$/i.test(text)
