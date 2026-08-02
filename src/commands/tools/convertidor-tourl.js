import { uploadAuto, resolveUploadLink } from '../../library/uploader.js'

let handler = async (m, { conn }) => {
let q = m.quoted ? m.quoted : m
let mime = (q.msg || q).mimetype || ''
if (!mime) return conn.reply(m.chat, `${emoji} Por favor, responda a una *Imagen* o *Vídeo.*`, m)
await m.react(rwait)
try {
let media = await q.download()
let uploaded = await uploadAuto(media, mime)
let link = resolveUploadLink(uploaded)
let img = Buffer.from(await (await fetch(`${link}`)).arrayBuffer())
let txt = `乂  *L I N K - E N L A C E*  乂\n\n`
txt += `*» Enlace* : ${link}\n`
txt += `*» Acortado* : ${await shortUrl(link)}\n`
txt += `*» Tamaño* : ${formatBytes(media.length)}\n`
txt += `*» Expiración* : Desconocido\n\n`
txt += `> *${dev}*`
await conn.sendFile(m.chat, img, 'thumbnail.jpg', txt, m, fkontak)
await m.react(done)
} catch {
await m.react(error)
return false
}}
handler.help = ['tourl']
handler.tags = ['transformador']
handler.register = true
handler.command = ['tourl', 'upload']
export default handler

function formatBytes(bytes) {
if (bytes === 0) return '0 B'
const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
const i = Math.floor(Math.log(bytes) / Math.log(1024))
return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`
}

async function shortUrl(url) {
try {
const res = await fetch(`https://tinyurl.com/api-create.php?url=${url}`)
return await res.text()
} catch {
return url
}
}
