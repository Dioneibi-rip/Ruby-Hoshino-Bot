import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn, args }) => {
let stiker = null
let userId = m.sender
let packstickers = global.db.data.users[userId] || {}
let texto1 = packstickers.text1 ?? global.packsticker
let texto2 = packstickers.text2 ?? global.packsticker2

let q = m.quoted || m
let mime = getMime(q)
let txt = args.join(' ')

try {

if (mime) {

if (/video/.test(mime) && q.seconds > 15)
return conn.reply(m.chat,'❌ El video no puede durar más de *15 segundos*',m)

let buffer = await downloadMedia(q, conn)
if (!buffer) throw 'No se pudo descargar el archivo'

await m.react('🧃')

let marca = txt
? txt.split(/[\u2022|]/).map(v => v.trim())
: [texto1, texto2]

stiker = await sticker(buffer, false, marca[0], marca[1])

} else if (args[0] && isUrl(args[0])) {

await m.react('🧃')
stiker = await sticker(false, args[0], texto1, texto2)

} else {
return conn.reply(
m.chat,
'❌ Envía o responde a una imagen / gif / video con el comando.',
m
)
}

if (!stiker) throw 'No se pudo generar el sticker'

await conn.sendMessage(
m.chat,
{ sticker: stiker },
{ quoted: m }
)

await m.react('🧃')

} catch (e) {
await m.react('✖️')
await conn.reply(m.chat,'⚠ Error: ' + e,m)
}
}

handler.help = ['sticker']
handler.tags = ['sticker']
handler.command = ['s','sticker']
export default handler

function getMime(q) {
return q.mimetype
|| q.mediaType
|| q.message?.imageMessage?.mimetype
|| q.message?.videoMessage?.mimetype
|| q.message?.stickerMessage?.mimetype
|| ''
}

async function downloadMedia(q, conn) {
if (typeof q.download === 'function') {
return await q.download()
}
if (q.message) {
return await conn.downloadMediaMessage(q)
}
return null
}

const isUrl = text => {
return /^https?:\/\/.+\.(jpe?g|png|gif|webp)$/i.test(text)
}
