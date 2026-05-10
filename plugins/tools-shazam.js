import acrcloud from 'acrcloud'
import yts from 'yt-search'
import { ytmp3 } from '../lib/youtubedl.js'

let acr = new acrcloud({
host: 'identify-eu-west-1.acrcloud.com',
access_key: 'c33c767d683f78bd17d4bd4991955d81',
access_secret: 'bvgaIAEtADBTbLwiPGYlxupWqkNGIjT7J9Ag2vIu'
})

let handler = async (m, { conn, usedPrefix, command }) => {
let q = m.quoted ? m.quoted : m
let mime = (q.msg || q).mimetype || q.mediaType || ''
if (!/audio|video/.test(mime)) return conn.reply(m.chat, `🐚 𝗘𝘁𝗶𝗾𝘂𝗲𝘁𝗮 𝘂𝗻 𝗮𝘂𝗱𝗶𝗼 𝗼 𝘃𝗶𝗱𝗲𝗼 𝗰𝗼𝗿𝘁𝗼 𝗰𝗼𝗻 *${usedPrefix + command}* 𝗽𝗮𝗿𝗮 𝗯𝘂𝘀𝗰𝗮𝗿 𝗹𝗮 𝗺𝘂́𝘀𝗶𝗰𝗮`, m)

let buffer = await q.download()

await conn.sendMessage(m.chat, { react: { text: "🔍", key: m.key } })

let { status, metadata } = await acr.identify(buffer)
if (status.code !== 0) throw status.msg

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
newsletterJid: channelRD,
newsletterName: canalNombreM,
serverMessageId: -1
}
}
})

await conn.sendMessage(m.chat, { react: { text: "🎶", key: m.key } })

let search = await yts(`${title} ${artist}`)
let result = search?.all?.[0] || search?.videos?.[0]
if (!result) return conn.reply(m.chat, "⚠️ No pude encontrar la canción en YouTube.", m)

let url = result.url
let dl = await ytmp3(url)
if (!dl?.download?.url) return conn.reply(m.chat, "⚠️ No pude descargar la canción.", m)

await conn.sendMessage(m.chat, {
audio: { url: dl.download.url },
mimetype: "audio/mpeg",
fileName: `${title}.mp3`,
ptt: false
}, { quoted: m })

await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
}

handler.help = ['whatmusic <audio/video>']
handler.tags = ['tools']
handler.command = ['whatmusic','shazam']
handler.register = true

export default handler