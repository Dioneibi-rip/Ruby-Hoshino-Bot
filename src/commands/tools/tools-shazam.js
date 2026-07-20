import crypto from 'crypto'
import axios, { bufferToBlob } from '../../library/http.js'

async function identifyAudio(buffer) {
const host = 'identify-eu-west-1.acrcloud.com'
const access_key = 'c33c767d683f78bd17d4bd4991955d81'
const access_secret = 'bvgaIAEtADBTbLwiPGYlxupWqkNGIjT7J9Ag2vIu'
const endpoint = '/v1/identify'
const signature_version = '1'
const data_type = 'audio'

const timestamp = Math.floor(Date.now() / 1000)
const stringToSign = ['POST', endpoint, access_key, data_type, signature_version, timestamp].join('\n')
const signature = crypto.createHmac('sha1', access_secret).update(Buffer.from(stringToSign, 'utf-8')).digest().toString('base64')

const form = new FormData()
form.append('sample', bufferToBlob(buffer, 'audio/mpeg'), 'audio.mp3')
form.append('access_key', access_key)
form.append('data_type', data_type)
form.append('signature_version', signature_version)
form.append('signature', signature)
form.append('sample_bytes', buffer.length.toString())
form.append('timestamp', timestamp.toString())

const response = await axios.post(`https://${host}${endpoint}`, form)
return response.data
}

let handler = async (m, { conn, usedPrefix, command }) => {
let q = m.quoted ? m.quoted : m
let mime = (q.msg || q).mimetype || q.mediaType || ''
if (!/audio|video/.test(mime)) {
await conn.reply(m.chat, `🐚 𝗘𝘁𝗶𝗾𝘂𝗲𝘁𝗮 𝘂𝗻 𝗮𝘂𝗱𝗶𝗼 𝗼 𝘃𝗶𝗱𝗲𝗼 𝗰𝗼𝗿𝘁𝗼 𝗰𝗼𝗻 *${usedPrefix + command}* 𝗽𝗮𝗿𝗮 𝗯𝘂𝘀𝗰𝗮𝗿 𝗹𝗮 𝗺𝘂́𝘀𝗶𝗰𝗮`, m)
return false
}

const [{ default: yts }, { ytmp3 }] = await Promise.all([
import('yt-search'),
import('../../library/youtubedl.js')
])

let buffer = await q.download()
await conn.sendMessage(m.chat, { react: { text: "🔍", key: m.key } })

try {
let acrResponse = await identifyAudio(buffer)
let { status, metadata } = acrResponse

if (status.code !== 0) throw new Error(status.msg)
if (!metadata || !metadata.music || metadata.music.length === 0) throw new Error("No se encontraron resultados en la base de datos.")

let info = metadata.music[0]
let title = info.title
let artist = info.artists?.map(v => v.name).join(', ') || "Desconocido"

let msg = `
𖦹 ˚₊ ┆🎧 𝙈𝙪́𝙨𝙞𝙘𝙖 𝙀𝙣𝙘𝙤𝙣𝙩𝙧𝙖𝙙𝙖 ┆₊˚ 𖦹

✦ *Título:* ${title}
✦ *Artista:* ${artist}
`.trim()

await conn.reply(m.chat, msg, m, {
contextInfo: {
mentionedJid: [m.sender],
isForwarded: true,
forwardedNewsletterMessageInfo: {
newsletterJid: typeof channelRD !== 'undefined' ? channelRD : '',
newsletterName: typeof canalNombreM !== 'undefined' ? canalNombreM : '',
serverMessageId: -1
}
}
})

await conn.sendMessage(m.chat, { react: { text: "🎶", key: m.key } })

let search = await yts(`${title} ${artist}`)
let result = search?.all?.[0] || search?.videos?.[0]
if (!result) {
await conn.reply(m.chat, "⚠️ No pude encontrar la canción en YouTube.", m)
return false
}

let url = result.url
let dl = await ytmp3(url)
if (!dl?.download?.url) {
await conn.reply(m.chat, "⚠️ No pude descargar la canción.", m)
return false
}

await conn.sendMessage(m.chat, {
audio: { url: dl.download.url },
mimetype: "audio/mpeg",
fileName: `${title}.mp3`,
ptt: false
}, { quoted: m })

await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } })

} catch (e) {
console.error(e)
await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
await conn.reply(m.chat, `⚠️ Ocurrió un error: ${e.message}`, m)
}
}

handler.help = ['whatmusic <audio/video>']
handler.tags = ['tools']
handler.command = ['whatmusic','shazam']
handler.register = true

export default handler