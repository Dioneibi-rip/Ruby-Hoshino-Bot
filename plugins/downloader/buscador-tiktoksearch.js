import axios from 'axios'
const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = (await import("@whiskeysockets/baileys")).default
let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!text) return conn.reply(m.chat, '🍟 *¿Qué deseas buscar en TikTok? Ingresa un texto.*', m)
const toFancy = str => {
const map = { 'a': 'ᥲ', 'b': 'ᑲ', 'c': 'ᥴ', 'd': 'ᑯ', 'e': 'ᥱ', 'f': '𝖿', 'g': 'g', 'h': 'һ', 'i': 'і', 'j': 'j', 'k': 'k', 'l': 'ᥣ', 'm': 'm', 'n': 'ᥒ', 'o': '᥆', 'p': '⍴', 'q': 'q', 'r': 'r', 's': 's', 't': '𝗍', 'u': 'ᥙ', 'v': '᥎', 'w': 'ɯ', 'x': 'x', 'y': 'ᥡ', 'z': 'z' }
return str.split('').map(c => map[c] || c).join('')
}
async function shuffleArray(array) {
for (let i = array.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[array[i], array[j]] = [array[j], array[i]]
}
}
try {
await m.react('🕒')
let searchResults = []
try {
let { data: response } = await axios.post('https://www.tikwm.com/api/feed/search', new URLSearchParams({ keywords: text, count: 12, cursor: 0, web: 1, hd: 1 }), { timeout: 15000, headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "User-Agent": "Mozilla/5.0" } })
if (response.data?.videos) {
searchResults = response.data.videos.map(v => ({ title: v.title, nowm: v.play.startsWith('http') ? v.play : `https://www.tikwm.com${v.play}`, cover: v.cover.startsWith('http') ? v.cover : `https://www.tikwm.com${v.cover}`, author: v.author.nickname, url: `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}` }))
}
} catch (e) {
try {
let { data: response } = await axios.get('https://api.agatz.xyz/api/tiktoksearch?message=' + encodeURIComponent(text), { timeout: 15000 })
searchResults = response.data.map(v => ({ title: v.title, nowm: v.nowm || v.url, cover: v.cover || 'https://i.imgur.com/95t44C0.png', author: 'TikTok User', url: v.url }))
} catch (e2) {}
}
if (!searchResults.length) return conn.reply(m.chat, '❌ No se encontraron videos.', m)
await shuffleArray(searchResults)
let selectedResults = searchResults.splice(0, 5)
let cards = []
for (let result of selectedResults) {
let mediaMessage
try {
mediaMessage = await prepareWAMessageMedia({ image: { url: result.cover } }, { upload: conn.waUploadToServer })
} catch (e) {
continue
}
cards.push({
body: proto.Message.InteractiveMessage.Body.fromObject({ text: toFancy(result.title.substring(0, 50) + "...") }),
footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: `👤 ${result.author}` }),
header: proto.Message.InteractiveMessage.Header.fromObject({ title: toFancy("TikTok Video"), hasMediaAttachment: true, ...mediaMessage }),
nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
buttons: [
{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🔗 Ver en TikTok", url: result.url, merchant_url: result.url }) },
{ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📋 Copiar Enlace", copy_code: result.url }) }
]
})
})
}
const messageContent = generateWAMessageFromContent(m.chat, {
viewOnceMessage: {
message: {
messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
interactiveMessage: proto.Message.InteractiveMessage.fromObject({
body: proto.Message.InteractiveMessage.Body.create({ text: `${toFancy("✦ Rᥱsᥙᥣ𝗍ᥲძ᥆s ძᥱ:")} ${text}\n_Desliza para ver más videos 👉_` }),
footer: proto.Message.InteractiveMessage.Footer.create({ text: "🔎 TikTok Search" }),
header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards: cards })
})
}
}
}, { quoted: m })
await conn.relayMessage(m.chat, messageContent.message, { messageId: messageContent.key.id })
await m.react('✅')
} catch (error) {
await m.react('❌')
}
}
handler.help = ['tiktoksearch <txt>']
handler.tags = ['buscador']
handler.command = ['tiktoksearch', 'ttss', 'tiktoks']
handler.group = true
handler.register = true
export default handler