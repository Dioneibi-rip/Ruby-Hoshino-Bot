const baileys = (await import('@whiskeysockets/baileys')).default
const { generateWAMessageFromContent, generateWAMessageContent, proto } = baileys

const TIKWM_SEARCH_URL = 'https://www.tikwm.com/api/feed/search'
const REQUEST_TIMEOUT_MS = 15000
const MAX_RESULTS = 5

let handler = async (m, { conn, text }) => {
if (!text) {
return conn.reply(m.chat, ' *°ʚ🎀ɞ° ¿Qᥙᥱ́ ძᥱsᥱᥲs ᑲᥙsᥴᥲr ᥱᥒ TіkT᥆k? Iᥒgrᥱsᥲ ᥙᥒ 𝗍ᥱx𝗍᥆ ȷᥙᥒ𝗍᥆ ᥲᥣ ᥴ᥆mᥲᥒძ᥆.* (✿◠‿◠)', m)
}

try {
await m.react('🕒')

const searchResults = await searchTikTokVideos(text)
if (!searchResults.length) {
return conn.reply(m.chat, '❌ *N᥆ sᥱ ᥱᥒᥴ᥆ᥒ𝗍rᥲr᥆ᥒ rᥱsᥙᥣ𝗍ᥲძ᥆s.* ૮(>﹏<)ა', m)
}

const selectedResults = shuffleArray(searchResults).slice(0, MAX_RESULTS)
const cardResults = await Promise.allSettled(selectedResults.map(result => createCarouselCard(conn, result)))
const cards = cardResults
.map(result => result.status === 'fulfilled' ? result.value : null)
.filter(Boolean)

for (const result of cardResults) {
if (result.status === 'rejected') {
console.error('Error creando tarjeta:', result.reason)
}
}

if (!cards.length) {
return conn.reply(m.chat, '❌ *N᥆ sᥱ ρᥙძіᥱr᥆ᥒ gᥱᥒᥱrᥲr ᥣ᥆s rᥱsᥙᥣ𝗍ᥲძ᥆s.* (╥﹏╥)', m)
}

const msg = buildCarouselMessage(m.chat, text, cards, m)
await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
await m.react('✅')
} catch (error) {
console.error('Error en tiktoksearch:', error)
await m.react('❌')
}
}

async function searchTikTokVideos(text) {
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

try {
const body = new URLSearchParams({ keywords: text, count: '10', cursor: '0', HD: '1' })
const response = await fetch(TIKWM_SEARCH_URL, {
method: 'POST',
body,
signal: controller.signal,
headers: {
'Content-Type': 'application/x-www-form-urlencoded',
'Cookie': 'current_language=en',
'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
}
})

if (!response.ok) {
throw new Error(`TikWM respondió con HTTP ${response.status}`)
}

const payload = await response.json()
const videos = Array.isArray(payload?.data?.videos) ? payload.data.videos : []
return videos
.filter(video => video?.play)
.map(video => ({
title: video.title || 'Vі́ძᥱ᥆ TіkT᥆k',
author: video.author?.nickname || 'Dᥱsᥴ᥆ᥒ᥆ᥴіძ᥆',
play: video.play,
url: buildTikTokUrl(video)
}))
} catch (error) {
console.error('Error buscando en TikTok:', error)
return []
} finally {
clearTimeout(timeout)
}
}

function buildTikTokUrl(video) {
const uniqueId = video.author?.unique_id
const videoId = video.video_id
return uniqueId && videoId ? `https://www.tiktok.com/@${uniqueId}/video/${videoId}` : video.play
}

async function createVideoMessage(conn, video) {
if (!video) {
throw new Error('No se recibió URL, Buffer o stream de video')
}

const content = Buffer.isBuffer(video)
? { video, mimetype: 'video/mp4' }
: { video: { url: video }, mimetype: 'video/mp4' }

const generated = await generateWAMessageContent(content, { upload: conn.waUploadToServer })
if (!generated?.videoMessage) {
throw new Error('Baileys no devolvió un videoMessage válido')
}

return proto.Message.VideoMessage.fromObject(generated.videoMessage)
}

async function createCarouselCard(conn, result) {
const videoMessage = await createVideoMessage(conn, result.play)

return proto.Message.InteractiveMessage.fromObject({
body: proto.Message.InteractiveMessage.Body.fromObject({ text: toFancy(truncate(result.title, 70)) }),
footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: `👤 Aᥙ𝗍᥆r: ${result.author}` }),
header: proto.Message.InteractiveMessage.Header.fromObject({
title: '✦ TіkT᥆k Vіძᥱ᥆ ✦',
hasMediaAttachment: true,
videoMessage
}),
nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
buttons: [
{
name: 'cta_url',
buttonParamsJson: JSON.stringify({ display_text: '🔗 Vᥱr ᥱᥒ TіkT᥆k', url: result.url, merchant_url: result.url })
},
{
name: 'cta_copy',
buttonParamsJson: JSON.stringify({ display_text: '📋 C᥆ρіᥲr Eᥒᥣᥲᥴᥱ', copy_code: result.url })
}
]
})
})
}

function buildCarouselMessage(chat, text, cards, quoted) {
return generateWAMessageFromContent(chat, {
viewOnceMessage: {
message: {
messageContextInfo: {
deviceListMetadata: {},
deviceListMetadataVersion: 2
},
interactiveMessage: proto.Message.InteractiveMessage.fromObject({
body: proto.Message.InteractiveMessage.Body.fromObject({ text: `✦ Rᥱsᥙᥣ𝗍ᥲძ᥆s ძᥱ: ${text} ✨\n\n_Dᥱsᥣіzᥲ ρᥲrᥲ ᥎ᥱr mᥲ́s ᥎і́ძᥱ᥆s 👉_` }),
footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: '🔎 TіkT᥆k Sᥱᥲrᥴһ' }),
header: proto.Message.InteractiveMessage.Header.fromObject({ hasMediaAttachment: false }),
carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards })
})
}
}
}, { quoted })
}

function toFancy(str) {
const map = { a: 'ᥲ', b: 'ᑲ', c: 'ᥴ', d: 'ᑯ', e: 'ᥱ', f: '𝖿', g: 'g', h: 'һ', i: 'і', j: 'j', k: 'k', l: 'ᥣ', m: 'm', n: 'ᥒ', o: '᥆', p: '⍴', q: 'q', r: 'r', s: 's', t: '𝗍', u: 'ᥙ', v: '᥎', w: 'ɯ', x: 'x', y: 'ᥡ', z: 'z' }
return String(str).split('').map(char => map[char.toLowerCase()] || char).join('')
}

function truncate(str, maxLength) {
const value = String(str || '')
return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

function shuffleArray(array) {
const copy = [...array]
for (let i = copy.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1))
;[copy[i], copy[j]] = [copy[j], copy[i]]
}
return copy
}

handler.help = ['tiktoksearch <texto>']
handler.tags = ['buscador']
handler.command = ['tiktoksearch', 'ttss', 'tiktoks']
handler.group = true
handler.register = true

export default handler