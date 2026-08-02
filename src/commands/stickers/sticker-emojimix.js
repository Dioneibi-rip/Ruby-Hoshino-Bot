import { sticker } from '../../library/sticker.js'

const EMOJI_KITCHEN_URL = 'https://tenor.googleapis.com/v2/featured'
const EMOJI_KITCHEN_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'

async function fetchJson(url, options) {
const response = await fetch(url, options)
if (!response.ok) throw new Error(`Emoji Kitchen respondió HTTP ${response.status}`)
return response.json()
}

function getEmojiMixResults(payload = {}) {
if (Array.isArray(payload?.results)) return payload.results
if (Array.isArray(payload?.result)) return payload.result
if (Array.isArray(payload)) return payload
return []
}

function getEmojiMixImageUrl(result = {}) {
return result?.url
|| result?.media_formats?.png_transparent?.url
|| result?.media_formats?.gif_transparent?.url
|| result?.media_formats?.tinygif?.url
|| result?.media?.[0]?.png?.url
|| result?.media?.[0]?.gif?.url
|| ''
}

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
if (!args[0] || !String(text || '').includes('+')) return m.reply(`📌 Ejemplo: *${usedPrefix + command}* 😎+🤑`)

const [emoji, emoji2] = String(text || '').split('+').map(value => value.trim()).filter(Boolean)
if (!emoji || !emoji2) return m.reply(`📌 Ejemplo: *${usedPrefix + command}* 😎+🤑`)

const url = `${EMOJI_KITCHEN_URL}?key=${EMOJI_KITCHEN_KEY}&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji)}_${encodeURIComponent(emoji2)}`
const payload = await fetchJson(url)
const results = getEmojiMixResults(payload)
if (!results.length) return m.reply('❀ No encontré una mezcla para esos emojis. Intenta con otra combinación.')

const userId = m.sender
const packstickers = global.db.getUser(userId) || {}
const texto1 = packstickers.text1 || global.packsticker
const texto2 = packstickers.text2 || global.packsticker2

let sent = 0
for (const result of results.slice(0, 4)) {
const imageUrl = getEmojiMixImageUrl(result)
if (!imageUrl) continue
const stiker = await sticker(false, imageUrl, texto1, texto2)
await conn.sendFile(m.chat, stiker, null, { asSticker: true }, m)
sent += 1
}

if (!sent) return m.reply('❀ Emoji Kitchen respondió, pero no envió imágenes compatibles para esta mezcla.')
}

handler.help = ['emojimix *<emoji+emoji>*']
handler.tags = ['sticker']
handler.command = ['emojimix']
handler.register = true

export default handler
