import { sticker } from '../../lib/sticker.js'

const MAX_VIDEO_SECONDS = 10
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 8 * 1024 * 1024

let handler = m => m

handler.all = async function (m) {
let chat = global.db.getChat(m.chat)
if (!chat?.autosticker || !m.isGroup) return !0
let q = m
let media = q.msg || q
let mime = media.mimetype || q.mediaType || ''
if (!mime || /webp/g.test(mime)) return !0
let fileLength = getFileLength(media)
let stiker = false
if (/image/g.test(mime)) {
if (fileLength && fileLength > MAX_IMAGE_BYTES) return
let img = await q.download?.()
if (!img) return
stiker = await sticker(img, false, packname, author)
} else if (/video/g.test(mime)) {
let seconds = Number(media.seconds || q.seconds || 0)
if (seconds > MAX_VIDEO_SECONDS) return await m.reply(`《✧》El video no debe durar más de ${MAX_VIDEO_SECONDS} segundos, inténtalo de nuevo.`)
if (fileLength && fileLength > MAX_VIDEO_BYTES) return await m.reply(`《✧》El video es demasiado pesado para autosticker, inténtalo con uno más ligero.`)
let img = await q.download?.()
if (!img) return
stiker = await sticker(img, false, packsticker, packsticker2)
} else {
return !0
}
if (stiker) await conn.sendFile(m.chat, stiker, 'sticker.webp', '', m, true)
return !0
}
export default handler

function getFileLength(media = {}) {
let size = media.fileLength || media.filesize || media.fileSize || media.size
if (typeof size === 'object') size = size.low || size.value || size.toNumber?.()
size = Number(size)
return Number.isFinite(size) ? size : 0
}
