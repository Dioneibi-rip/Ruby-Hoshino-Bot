import { toAudio } from '../../library/media-converter.js'

const extensionFromMime = (mime = '') => {
if (/mp4|video/i.test(mime)) return 'mp4'
if (/mpeg|mp3/i.test(mime)) return 'mp3'
if (/ogg|opus/i.test(mime)) return 'ogg'
if (/webm/i.test(mime)) return 'webm'
if (/wav/i.test(mime)) return 'wav'
return 'bin'
}

const handler = async (m, { conn }) => {
const q = m.quoted || m
const mime = q?.mimetype || q?.mediaType || q?.msg?.mimetype || ''
if (!/video|audio/i.test(mime)) return conn.reply(m.chat, `${emoji} Por favor, responda al video o nota de voz que desee convertir a Audio/MP3.`, m)
let audio
try {
const media = await q.download()
if (!media?.length) return conn.reply(m.chat, `${msm} Ocurrió un error al descargar el archivo.`, m)
audio = await toAudio(media, extensionFromMime(mime))
if (!audio?.data?.length) return conn.reply(m.chat, `${msm} Ocurrió un error al convertir el archivo a Audio/MP3.`, m)
await conn.sendMessage(m.chat, { audio: audio.data, mimetype: 'audio/ogg; codecs=opus' }, { quoted: m })
} catch (err) {
console.error('Error en toaudio:', err)
await conn.reply(m.chat, `⚠️ No pude convertir el archivo a audio: ${err.message}`, m)
return false
} finally {
await audio?.delete?.().catch(() => {})
}
}

handler.help = ['tomp3', 'toaudio']
handler.command = ['tomp3', 'toaudio']
handler.group = true
handler.register = true

export default handler
