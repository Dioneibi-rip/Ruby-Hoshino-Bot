import baileys from "@whiskeysockets/baileys"
import { enqueueMediaJob, getMediaQueueConnection } from "../../library/queue.js"

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

function registerPinterestQueueHandler() {
global.queueHandlers ||= new Map()
if (global.queueHandlers.has("pinterest:album")) return
global.queueHandlers.set("pinterest:album", async ({ jid, medias, options = {} }) => {
const activeConn = getMediaQueueConnection()
if (!activeConn) throw new Error("No hay conexión activa para la cola multimedia")
await sendAlbumMessage(activeConn, jid, medias, options)
})
}

async function pinterestScraper(query, limit = 10) {
const url = `https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22scope%22%3A%22pins%22%2C%22rs%22%3A%22typed%22%7D%2C%22context%22%3A%7B%7D%7D`

const headers = {
'accept': 'application/json, text/javascript, */*; q=0.01',
'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
'referer': 'https://id.pinterest.com/',
'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
'x-app-version': 'c056fb7',
'x-pinterest-appstate': 'active',
'x-pinterest-pws-handler': 'www/index.js',
'x-pinterest-source-url': '/',
'x-requested-with': 'XMLHttpRequest'
}

const res = await fetch(url, { headers })
if (!res.ok) throw new Error(`Pinterest respondió con estado ${res.status}`)

const json = await res.json()
if (!json.resource_response?.data?.results) return []

const results = json.resource_response.data.results
.map(item => {
if (!item.images) return null
const image_large = item.images.orig?.url || null
const imageKeys = Object.keys(item.images)
const mediumKey = imageKeys.find(k => /4\d{2}x|5\d{2}x|6\d{2}x/.test(k)) || imageKeys[0]
const image_medium = item.images[mediumKey]?.url || null
return {
title: item.grid_title || item.title || 'Sin título',
image_large_url: image_large,
image_medium_url: image_medium,
image_small_url: item.images['236x']?.url || null
}
})
.filter(Boolean)

return results.slice(0, limit)
}

const handler = async (m, { conn, args, command, usedPrefix }) => {
const rwait = global.rwait || "⏳"
const done = global.done || "✅"
const error = global.error || "❌"
const dev = global.dev || ""

if (!args[0]) {
return conn.reply(m.chat, `🌸 (｡•́︿•̀｡) *ᴅᴇʙᴇs ᴇsᴄʀɪʙɪʀ ǫᴜᴇ́ ǫᴜɪᴇʀᴇs ǫᴜᴇ ʙᴜsǫᴜᴇ ᴇɴ ᴘɪɴᴛᴇʀᴇsᴛ... ᴀsɪ́:* \n> 💌 \`${usedPrefix}${command} Ruby hoshino`, m)
}

const query = args.join(' ')
const limit = 10

try {
await m.react(rwait)

const images = await pinterestScraper(query, limit)

if (images.length < 2) {
await m.react(error)
return conn.reply(m.chat, `(*꒦ິ꒳꒦ີ) *ɴᴏ ᴇɴᴄᴏɴᴛʀᴇ́ ɪᴍᴀ́ɢᴇɴᴇs ᴘᴀʀᴀ* \`${query}\` *... ᴘᴏʀ ғᴀᴠᴏʀ ɪɴᴛᴇɴᴛᴀ ᴄᴏɴ ᴏᴛʀᴏ ᴛᴇ́ʀᴍɪɴᴏ. ᴘᴇʀᴅᴏ́ɴ.* 💙`, m)
}

const sendCount = Math.min(images.length, limit)

const infoMessage =
`╭─⬣「 ✨ 𝗣𝗜𝗡𝗧𝗘𝗥𝗘𝗦𝗧 𝗦𝗘𝗔𝗥𝗖𝗛 ✨ 」\n` +
`├ׁ̟̇𖥔  ۫  ༘  ࿔  ˖  ⚘  𑁍  ࣪  ˖  𓆩  ✿  𓆪  ˖\n` +
`├ ❀ 𝗕𝘂𝘀𝗾𝘂𝗲𝗱𝗮: *${query}*\n` +
`├ ❀ 𝗥𝗲𝘀𝘂𝗹𝘁𝗮𝗱𝗼𝘀: ${images.length}\n` +
`├ ❀ 𝗘𝗻𝘃𝗶𝗮𝗻𝗱𝗼: ${sendCount} 𝗲𝗻 𝗮𝗹𝗯𝘂𝗺\n` +
`├ ❀ 𝗘𝘀𝘁𝗮𝗱𝗼: ✨ ¡Listo! ✨\n` +
`╰━─━─━─≪✿≫─━─━─━╯\n` +
(dev ? `${dev}\n` : '')

await conn.reply(m.chat, infoMessage.trim(), m)

const albumImages = images.map(img => ({
type: "image",
data: { url: img.image_large_url || img.image_medium_url }
}))

registerPinterestQueueHandler()
await enqueueMediaJob("pinterest:album", {
jid: m.chat,
medias: albumImages,
options: {
caption: `🌸 𝙋𝙄𝙉𝙏𝙀𝙍𝙀𝙎𝙏 𝙎𝙀𝘼𝙍𝘾𝙃`,
quoted: m
}
}, { conn })

await m.react(done)

} catch (e) {
console.error(e)
await m.react(error)
return conn.reply(m.chat, `💔 *¡U-Uuu...!* (´；ω；\`) *ᴏᴄᴜʀʀɪᴏ́ ᴜɴ ᴇʀʀᴏʀ ᴀʟ ɪɴᴛᴇɴᴛᴀʀ ʙᴜsᴄᴀʀ ᴇɴ ᴘɪɴᴛᴇʀᴇsᴛ. ᴛᴀʟ ᴠᴇᴢ ᴘᴜᴇᴅᴏ ɪɴᴛᴇɴᴛᴀʀʟᴏ ᴍᴀ́s ᴛᴀʀᴅᴇ...*`, m)
}
}

handler.help = ['pin', 'pinterest']
handler.tags = ['búsqueda']
handler.command = ['pin', 'pinterest', 'pins']
handler.group = true
handler.register = true

export default handler