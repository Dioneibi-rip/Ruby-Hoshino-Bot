import { toAudio } from '../../lib/converter.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
let q = m.quoted || m
let mime = (q.msg || q).mimetype || ''
if (!m.quoted) return conn.reply(m.chat,  `${emoji} Etiqueta el *Video o Audio* que desea convertir en documento.`, m)
if(!text) {
await conn.reply(m.chat, `${emoji2} Ingresa el nombre para guardar el documento.`, m);
return false;
}
if (!/audio|video/.test(mime)) {
await conn.reply(m.chat,  `${emoji} Etiqueta el *Video o Audio* que desea convertir en documento.`, m);
return false;
}
let media = await q.download?.()
if (!media) throw m.react('✖️')
await m.react('🕓')
if (/video/.test(mime)) {
return conn.sendMessage(m.chat, { document: media, mimetype: 'video/mp4', fileName: `${text}.mp4`}, {quoted: m}).then(_ => m.react('✅'))
} else if (/audio/.test(mime)) {
return conn.sendMessage(m.chat, { document: media, mimetype: 'audio/mpeg', fileName: `${text}.mp3`}, {quoted: m}).then(_ => m.react('✅'))}
}
handler.help = ['document *<audio/video>*']
handler.tags = ['tools']
handler.command = ['toducument', 'todoc']
handler.register = true

export default handler
