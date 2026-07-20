import baileys from "@whiskeysockets/baileys"
import { enqueueMediaJob, getMediaQueueConnection } from "../../library/queue.js"
import axios from '../../library/http.js'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function sendAlbumMessage(conn, jid, medias, options = {}) {
if (typeof jid !== "string") throw new TypeError(`jid debe ser string, se recibió: ${jid}`)
if (medias.length < 2) throw new RangeError("Se necesitan al menos 2 imágenes para un álbum")
const caption = options.text || options.caption || ""
const delayMs = !isNaN(options.delay) ? options.delay : 500
const quoted = options.quoted || null
delete options.text
delete options.caption
delete options.delay
delete options.quoted
const album = baileys.generateWAMessageFromContent(
jid,
{ messageContextInfo: {}, albumMessage: { expectedImageCount: medias.length } },
quoted ? { quoted } : {}
)
await conn.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id })
for (let i = 0; i < medias.length; i++) {
const { type, data } = medias[i]
const img = await baileys.generateWAMessage(
album.key.remoteJid,
{ [type]: data, ...(i === 0 ? { caption } : {}) },
{ upload: conn.waUploadToServer }
)
img.message.messageContextInfo = {
messageAssociation: { associationType: 1, parentMessageKey: album.key }
}
await conn.relayMessage(img.key.remoteJid, img.message, { messageId: img.key.id })
await delay(delayMs)
}
return album
}

function registerImageAlbumQueueHandler() {
global.queueHandlers ||= new Map()
if (global.queueHandlers.has("image:album")) return
global.queueHandlers.set("image:album", async ({ jid, medias, options = {} }) => {
const activeConn = getMediaQueueConnection()
if (!activeConn) throw new Error("No hay conexión activa para la cola multimedia")
await sendAlbumMessage(activeConn, jid, medias, options)
})
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
const rwait = '⏳'
if (!text) {
return conn.reply(m.chat, ` ׄ᱉᱉ Por favor, ingresa un término. ✧ 𝗘j𝗲m𝗽l𝗼: ${usedPrefix + command} goku`, m)
}
await m.react(rwait)
await conn.reply(m.chat, ' 🌿 ׄ ⢟ 𝗕𝘂𝘀𝗰𝗮𝗻𝗱𝗼 𝗹𝗮𝘀 𝗳𝗼𝘁𝗶𝘁𝗼𝘀 𝗺á𝘀 𝗹𝗶𝗻𝗱𝗮𝘀, 𝗲𝘀𝗽𝗲𝗿𝗲 𝘂𝗻 𝗺𝗼𝗺𝗲𝗻𝘁𝗼... 𞋬 🌱', m)
try {
const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(text)}&first=1&count=15&tsc=ImageBasicHover`
const response = await axios.get(bingUrl, {
headers: {
"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
"Accept-Language": "en-US,en;q=0.9"
},
responseType: 'text'
})
const html = response.data
const imgUrls = []
for (const match of html.matchAll(/&quot;murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/g)) {
if (!imgUrls.includes(match[1])) {
imgUrls.push(match[1])
}
if (imgUrls.length >= 4) break
}
if (imgUrls.length < 2) {
await m.react('❌')
return conn.reply(m.chat, `*🍂 No logré encontrar suficientes imágenes exactas para:* ${text}`, m)
}
const albumImages = imgUrls.map(url => ({
type: "image",
data: { url }
}))
registerImageAlbumQueueHandler()
await enqueueMediaJob("image:album", {
jid: m.chat,
medias: albumImages,
options: {
caption: `⪛✰ ɪᴍᴀɢᴇɴ - ʙᴜsǫᴜᴇᴅᴀ ✰⪜\n🌿 *Resultado de:* ${text}`,
quoted: m
}
}, { conn })
await m.react('✅')
} catch (error) {
await m.react('✖️')
conn.reply(m.chat, '*🥀 Ocurrió un error de conexión al buscar las imágenes. Intenta con otra palabra.*', m)
return false
}
}

handler.help = ['imagen <texto>']
handler.tags = ['buscador', 'tools', 'descargas']
handler.command = ['image', 'imagen', 'img']
handler.register = true

export default handler