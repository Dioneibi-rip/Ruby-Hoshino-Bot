import axios from 'axios'
import baileys from '@whiskeysockets/baileys'
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
async function pinterestScraper(query, limit = 10) {
const url = 'https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D' + encodeURIComponent(query) + '%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22query%22%3A%22' + encodeURIComponent(query) + '%22%2C%22scope%22%3A%22pins%22%2C%22rs%22%3A%22typed%22%7D%2C%22context%22%3A%7B%7D%7D'
const headers = { 'accept': 'application/json, text/javascript, */*; q=0.01', 'referer': 'https://id.pinterest.com/', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'x-requested-with': 'XMLHttpRequest' }
const response = await axios.get(url, { headers })
if (!response.data?.resource_response?.data?.results) return []
const results = response.data.resource_response.data.results.map(item => {
if (!item.images) return null
return item.images.orig?.url || item.images['736x']?.url || item.images['400x300']?.url || null
}).filter(Boolean)
return results.sort(() => 0.5 - Math.random()).slice(0, limit)
}
let handler = async (m, { conn, text, usedPrefix }) => {
if (!text) return conn.reply(m.chat, '꒰ 🪷 ꒱ ⋆ ࣪. ¡A-Aʀᴇ! Nᴇᴄᴇsɪᴛᴏ ǫᴜᴇ ᴍᴇ ᴅɪɢᴀs ǫᴜᴇ́ ʙᴜsᴄᴀʀ... ₍ᐢ•ﻌ•ᐢ₎*･ﾟ｡\n\n> ✧ *Eᴊᴇᴍᴘʟᴏ:* `' + usedPrefix + 'pin Ruby Hoshino icons`', m)
try {
await m.react('🕒')
const imageUrls = await pinterestScraper(text, 10)
if (!imageUrls.length) {
await m.react('✖️')
return conn.reply(m.chat, '꒰ 🥀 ꒱ ⋆ ࣪. Gᴏᴍᴇɴ... ɴᴏ ᴇɴᴄᴏɴᴛʀᴇ́ ɴᴀᴅᴀ ᴘᴀʀᴀ `' + text + '` 🥺💔', m)
}
const totalImgs = imageUrls.length
const caption = '✧ ─ ⋆⋅ ୨ 📌 ୧ ⋅⋆ ─ ✧\n\n🎀 ⋆ ࣪. *Bᴜ́sǫᴜᴇᴅᴀ:* `' + text + '`\n✨ ⋆ ࣪. *Rᴇsᴜʟᴛᴀᴅᴏs:* `' + totalImgs + ' ɪᴍᴀ́ɢᴇɴᴇs ᴇɴᴄᴏɴᴛʀᴀᴅᴀs`\n\n*⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥*'
if (totalImgs < 2) {
await conn.sendMessage(m.chat, { image: { url: imageUrls[0] }, caption }, { quoted: m })
} else {
const medias = imageUrls.map(url => ({ type: 'image', data: { url } }))
await sendAlbumMessage(conn, m.chat, medias, { caption, quoted: m, delay: 400 })
}
await m.react('🎀')
} catch (e) {
await m.react('✖️')
conn.reply(m.chat, '꒰ ⚠️ ꒱ ⋆ ࣪. ¡E-Eʀʀᴏʀ ᴇɴ ᴇʟ sɪsᴛᴇᴍᴀ! (｡>﹏<｡)\n> 🔧 Úsᴀ `*' + usedPrefix + 'report*` ᴘᴀʀᴀ ᴀᴠɪsᴀʀ ᴀ ᴍɪ ᴄʀᴇᴀᴅᴏʀ.\n\n`' + e.message + '`', m)
}
}
handler.help = ['pinterest <texto>']
handler.tags = ['descargas']
handler.command = ['pinterest', 'pin']
handler.group = true
export default handler