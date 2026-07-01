import uploadImage from '../../lib/uploadImage.js'
import fetch from 'node-fetch'
let handler = async (m, { conn, usedPrefix, command, args, text }) => {
let q = m.quoted ? m.quoted : m
let mime = (q.msg || q).mimetype || ''
if (!mime) {
await conn.reply(m.chat, `${emoji} Por favor, responda a una *Imagen* o *Video.*`, m);
return false;
}
if (!text) {
await conn.reply(m.chat, `${emoji} Ingresa el peso nuevo de la imágen/video.`, m);
return false;
}
await m.react('🕓')
try {
if (isNaN(text)) {
await conn.reply(m.chat, `${emoji2} Sólo números.`, m).then(_ => m.react('✖️'));
return false;
}
if (!/image\/(jpe?g|png)|video|document/.test(mime)) {
await conn.reply(m.chat, `${emoji2} Formato no soportado.`, m);
return false;
}
let img = await q.download()
let url = await uploadImage(img)

if (/image\/(jpe?g|png)/.test(mime)) {
await conn.sendMessage(m.chat, { image: {url: url}, caption: ``, fileLength: `${text}`, mentions: [m.sender] }, { ephemeralExpiration: 24*3600, quoted: m})
await m.react('✅')
} else if (/video/.test(mime)) {
return conn.sendMessage(m.chat, { video: {url: url}, caption: ``, fileLength: `${text}`, mentions: [m.sender] }, { ephemeralExpiration: 24*3600, quoted: m })
await m.react('✅')
}
} catch (e) {
await m.react('✖️')
return false;
}}
handler.tags = ['tools']
handler.help = ['tamaño *<cantidad>*']
handler.command = ['filelength', 'length', 'tamaño']
handler.register = true

export default handler
