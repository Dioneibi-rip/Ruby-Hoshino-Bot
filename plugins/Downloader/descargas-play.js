import { ytmp3, ytmp4 } from "../../lib/youtubedl.js"
import yts from "yt-search"
import fs from "fs"
import { exec } from "child_process"
import { join } from "path"

async function pathExists(file){
try{
await fs.promises.access(file)
return true
}catch{
return false
}
}

// Se escaparon las barras inclinadas / para que el regex sea válido en JavaScript
const youtubeRegexID = /(?:http:\/\/googleusercontent\.com\/youtube\.com\/0)([a-zA-Z0-9_-]{11})/

const newsletterJid = '120363335626706839@newsletter'
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭'

const handler = async (m, { conn, text, command }) => {
try {
if (!text || !text.trim()) {
return conn.reply(m.chat, '✧ 𝙃𝙚𝙮! Debes escribir *el nombre o link* del video/audio para descargar.', m)
}

await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key }})

let searchResult = null
const match = text.match(youtubeRegexID)

if (match) {
try {
searchResult = await yts({ videoId: match[1] })
} catch (e) {
const s = await yts(text)
searchResult = s.all[0]
}
} else {
const s = await yts(text)
searchResult = s.all.find(v => v.type === 'video') || s.all[0]
}

if (!searchResult) {
await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
return m.reply("⚠︎ No encontré resultados.")
}

const { title, thumbnail, timestamp, views, ago, url, author } = searchResult
const vistas = formatViews(views)
const canal = author?.name || "Desconocido"

// Se corrigieron las comillas invertidas aquí
const infoMessage = `ㅤ۫ ㅤ 🦭 ୧ ˚ \\𝒅𝒆𝒔𝒄𝒂𝒓𝒈𝒂 𝒆𝒏 𝒄𝒂𝒎𝒊𝒏𝒐\` ! ୨ 𖹭 ִֶָ
᮫ؙܹ ᳘︵᮫ּܹ࡛〫ࣥܳ⌒ؙ۫ ᮫ּ۪֯⏝ֺ࣯࠭۟ ᮫ּ〪࣭︶᮫ܹ᳟〫࠭߳፝֟᷼⏜᮫᮫ּ〪࣭࠭〬︵᮫ּ᳝̼࣪ 🍚⃘ᩚּ̟߲ ּ〪࣪︵᮫࣭࣪࠭ᰯּ〪࣪࠭⏜ְ࣮〫߳ ᮫ּׅ࣪۟︶᮫ܹׅ࠭〬 ᮫ּּ࣭᷼⏝ᩥ᮫〪ܹ۟࠭۟۟ ᮫ּؙ⌒᮫ܹ۫︵ᩝּּ۟࠭ ࣭۪۟
🧊✿⃘࣪◌ ֪ \`𝗧𝗶́𝘁𝘂𝗹𝗼\` » ${title}
🧊✿⃘࣪◌ ֪ \`𝗖𝗮𝗻𝗮𝗹\` » ${canal}
🧊✿⃘࣪◌ ֪ \`𝗗𝘂𝗿𝗮𝗰𝗶𝗼́𝗻\` » ${timestamp}
🧊✿⃘࣪◌ ֪ \`𝗩𝗶𝘀𝘁𝗮𝘀\` » ${vistas}
🧊✿⃘࣪◌ ֪ \`𝗣𝘂𝗯𝗹𝗶𝗰𝗮𝗱𝗼\` » ${ago}
🧊✿⃘࣪◌ ֪ \`𝗟𝗶𝗻𝗸\` » ${url}

𐙚 🪵 ｡ Preparando tu descarga... ˙𐙚`.trim()

let thumbBuffer = null
try {
thumbBuffer = (await conn.getFile(thumbnail))?.data
} catch (e) {
console.log("Error thumb")
}

await conn.reply(m.chat, infoMessage, m, {
contextInfo: {
isForwarded: true,
forwardingScore: 999,
forwardedNewsletterMessageInfo: {
newsletterJid: newsletterJid,
newsletterName: newsletterName,
serverMessageId: -1
}}
})

if (["play", "yta", "ytmp3", "playaudio"].includes(command)) {
try {
const r = await ytmp3(url, title)
if (!r?.download?.url) throw new Error("Link caído")

await conn.sendMessage(m.chat, {
audio: { url: r.download.url },
fileName: `${r.metadata.title}.mp3`,
mimetype: "audio/mpeg",
ptt: false
}, { quoted: m })

await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key }})
} catch (e) {
console.error(e)
await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
m.reply("Error al descargar audio.")
}
} else if (["play2", "ytv", "ytmp4", "mp4"].includes(command)) {
try {
const r = await ytmp4(url, title)
if (!r?.download?.url) throw new Error("Link caído")

const videoUrl = r.download.url
const tmpDir = join(process.cwd(), 'tmp')
if (!await pathExists(tmpDir)) await fs.promises.mkdir(tmpDir)

const fileName = join(tmpDir, `${Date.now()}.mp4`)

await new Promise((resolve, reject) => {
// Se corrigieron los backticks en el comando exec
exec(`ffmpeg -i "${videoUrl}" -c:v copy -c:a aac -movflags +faststart "${fileName}"`, (err) => {
if (err) reject(err)
else resolve()
})
})

if (!await pathExists(fileName)) throw new Error("Error en FFmpeg")

await conn.sendMessage(m.chat, {
video: await fs.promises.readFile(fileName),
fileName: `${title}.mp4`,
caption: `${title}`,
mimetype: "video/mp4"
}, { quoted: m })

await fs.promises.unlink(fileName)
await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key }})
} catch (e) {
console.error(e)
await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
return conn.reply(m.chat, "✦ No se pudo procesar el video. Intenta más tarde.", m)
}
}
} catch (error) {
console.error(error)
await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key }})
return m.reply("⚠︎ Error inesperado.")
}
}

handler.command = ["play", "yta", "ytmp3", "play2", "ytv", "ytmp4", "playaudio", "mp4"]
handler.help = ["play", "yta", "ytmp3", "play2", "ytv", "ytmp4", "playaudio", "mp4"]
handler.tags = ["descargas"]

export default handler

// Se separaron correctamente los condicionales que estaban fusionados
function formatViews(views) {
if (!views) return "No disponible"
if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)}B`
if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
if (views >= 1000) return `${(views / 1000).toFixed(1)}k`

return views.toString()
}
