import axios from 'axios'
import { fileTypeFromBuffer } from 'file-type'
import { enqueueMediaJob, getMediaQueueConnection } from '../../lib/queue.js'
import { delay } from '@whiskeysockets/baileys'

async function pinterestScraper(query, limit = 10) {
const url = 'https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D' + encodeURIComponent(query) + '%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22query%22%3A%22' + encodeURIComponent(query) + '%22%2C%22scope%22%3A%22pins%22%2C%22rs%22%3A%22typed%22%7D%2C%22context%22%3A%7B%7D%7D'
const headers = { accept: 'application/json, text/javascript, */*; q=0.01', referer: 'https://id.pinterest.com/', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'x-requested-with': 'XMLHttpRequest' }
try {
const response = await axios.get(url, { headers, timeout: 20000 })
const results = response.data?.resource_response?.data?.results
if (!Array.isArray(results)) return []
return results.map(item => item?.images?.orig?.url || item?.images?.['736x']?.url || item?.images?.['400x300']?.url || null).filter(Boolean).sort(() => 0.5 - Math.random()).slice(0, limit)
} catch (err) {
console.error('Error en el scraper de Pinterest:', err)
return []
}
}

async function downloadValidMedia(url) {
const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 25000, maxContentLength: 15 * 1024 * 1024, headers: { referer: 'https://www.pinterest.com/', 'user-agent': 'Mozilla/5.0' } })
const buffer = Buffer.from(response.data || [])
if (buffer.length < 1024) throw new Error('La imagen descargada está vacía o corrupta')
const type = await fileTypeFromBuffer(buffer)
if (!type || !/^image\/(jpeg|png|webp|gif)$/.test(type.mime)) throw new Error('El archivo descargado no es una imagen válida')
return buffer
}

let handler = async (m, { conn, text, usedPrefix }) => {
if (!text) return conn.reply(m.chat, '꒰ 🪷 ꒱ ⋆ ࣪. ¡A-Aʀᴇ! Nᴇᴄᴇsɪᴛᴏ ǫᴜᴇ ᴍᴇ ᴅɪɢᴀs ǫᴜᴇ́ ʙᴜsᴄᴀʀ... ₍ᐢ•ﻌ•ᐢ₎*･ﾟ｡\n\n> ✧ *Eᴊᴇᴍᴘʟᴏ:* `' + usedPrefix + 'pin Ruby Hoshino icons`', m)
try {
await m.react('🕒')
await enqueueMediaJob('pinterest', { chat: m.chat, text: text.trim(), usedPrefix, message: { key: m.key, message: m.message, sender: m.sender, chat: m.chat } }, { conn })
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

global.queueHandlers ||= new Map()
global.queueHandlers.set('pinterest', async (data) => {
const conn = getMediaQueueConnection()
const m = data.message
try {
const imageUrls = await pinterestScraper(data.text, 10)
if (!imageUrls.length) {
await conn.sendMessage(data.chat, { react: { text: '✖️', key: m.key } })
return conn.reply(data.chat, '꒰ 🥀 ꒱ ⋆ ࣪. Gᴏᴍᴇɴ... ɴᴏ ᴇɴᴄᴏɴᴛʀᴇ́ ɴᴀᴅᴀ ᴘᴀʀᴀ `' + data.text + '` 🥺💔', m)
}
const caption = '✧ ─ ⋆⋅ ୨ 📌 ୧ ⋅⋆ ─ ✧\n\n🎀 ⋆ ࣪. *Bᴜ́sǫᴜᴇᴅᴀ:* `' + data.text + '`\n✨ ⋆ ࣪. *Rᴇsᴜʟᴛᴀᴅᴏs:* `' + imageUrls.length + ' ɪᴍᴀ́ɢᴇɴᴇs ᴇɴᴄᴏɴᴛʀᴀᴅᴀs`\n\n*⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥*'
let sent = 0
for (let i = 0; i < imageUrls.length; i++) {
try {
const buffer = await downloadValidMedia(imageUrls[i])
await conn.sendMessage(data.chat, { image: buffer, caption: sent === 0 ? caption : undefined }, { quoted: sent === 0 ? m : undefined })
sent += 1
await delay(700)
} catch (error) {
console.error('Imagen de Pinterest descartada:', error)
}
}
if (!sent) throw new Error('Todas las imágenes descargadas estaban corruptas o no disponibles')
await conn.sendMessage(data.chat, { react: { text: '🎀', key: m.key } })
} catch (e) {
console.error('Error en queueHandler de pinterest:', e)
await conn.sendMessage(data.chat, { react: { text: '✖️', key: m.key } })
conn.reply(data.chat, '꒰ ⚠️ ꒱ ⋆ ࣪. ¡E-Eʀʀᴏʀ ᴇɴ ᴇʟ sɪsᴛᴇᴍᴀ! (｡>﹏<｡)\n> 🔧 Úsᴀ `*' + data.usedPrefix + 'report*` ᴘᴀʀᴀ ᴀᴠɪsᴀʀ ᴀ ᴍɪ ᴄʀᴇᴀᴅᴏʀ.\n\n`' + e.message + '`', m)
}
})
