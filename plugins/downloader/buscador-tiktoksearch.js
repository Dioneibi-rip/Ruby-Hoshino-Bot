import axios from 'axios'
const { generateWAMessageFromContent, generateWAMessageContent, proto } = (await import('@whiskeysockets/baileys')).default
let handler = async (m, { conn, text }) => {
if (!text) {
return conn.reply(m.chat, ' *°ʚ🎀ɞ° ¿Qᥙᥱ́ ძᥱsᥱᥲs ᑲᥙsᥴᥲr ᥱᥒ TіkT᥆k? Iᥒgrᥱsᥲ ᥙᥒ 𝗍ᥱx𝗍᥆ ȷᥙᥒ𝗍᥆ ᥲᥣ ᥴ᥆mᥲᥒძ᥆.* (✿◠‿◠)', m)
}
const toFancy = str => {
const map = { a: 'ᥲ', b: 'ᑲ', c: 'ᥴ', d: 'ᑯ', e: 'ᥱ', f: '𝖿', g: 'g', h: 'һ', i: 'і', j: 'j', k: 'k', l: 'ᥣ', m: 'm', n: 'ᥒ', o: '᥆', p: '⍴', q: 'q', r: 'r', s: 's', t: '𝗍', u: 'ᥙ', v: '᥎', w: 'ɯ', x: 'x', y: 'ᥡ', z: 'z' }
return str.split('').map(c => map[c.toLowerCase()] || c).join('')
}
function shuffleArray(array) {
for (let i = array.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[array[i], array[j]] = [array[j], array[i]]
}
}
async function createVideoMessage(url) {
const { videoMessage } = await generateWAMessageContent({ video: { url } }, { upload: conn.waUploadToServer })
return videoMessage
}
try {
await m.react('🕒')
let searchResults = []
try {
const { data: response } = await axios.post('https://www.tikwm.com/api/feed/search', new URLSearchParams({ keywords: text, count: 10, cursor: 0, HD: 1 }), { timeout: 15000, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': 'current_language=en', 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' } })
if (response?.data?.videos) {
searchResults = response.data.videos.filter(v => v.play).map(v => ({ title: v.title || 'Vі́ძᥱ᥆ TіkT᥆k', author: v.author?.nickname || 'Dᥱsᥴ᥆ᥒ᥆ᥴіძ᥆', play: v.play, url: `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}` }))
}
} catch (e) {
console.error(e)
}
if (!searchResults.length) {
return conn.reply(m.chat, '❌ *N᥆ sᥱ ᥱᥒᥴ᥆ᥒ𝗍rᥲr᥆ᥒ rᥱsᥙᥣ𝗍ᥲძ᥆s.* ૮(>﹏<)ა', m)
}
shuffleArray(searchResults)
const selectedResults = searchResults.slice(0, 5)
const cards = []
for (const result of selectedResults) {
try {
cards.push({
body: proto.Message.InteractiveMessage.Body.fromObject({ text: toFancy(result.title.length > 70 ? result.title.slice(0, 70) + '...' : result.title) }),
footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: `👤 Aᥙ𝗍᥆r: ${result.author}` }),
header: proto.Message.InteractiveMessage.Header.fromObject({ title: '✦ TіkT᥆k Vіძᥱ᥆ ✦', hasMediaAttachment: true, videoMessage: await createVideoMessage(result.play) }),
nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🔗 Vᥱr ᥱᥒ TіkT᥆k', url: result.url, merchant_url: result.url }) }, { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 C᥆ρіᥲr Eᥒᥣᥲᥴᥱ', copy_code: result.url }) }] })
})
} catch (e) {
console.error('Error creando tarjeta:', e)
}
}
if (!cards.length) {
return conn.reply(m.chat, '❌ *N᥆ sᥱ ρᥙძіᥱr᥆ᥒ gᥱᥒᥱrᥲr ᥣ᥆s rᥱsᥙᥣ𝗍ᥲძ᥆s.* (╥﹏╥)', m)
}
const msg = generateWAMessageFromContent(m.chat, { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage: proto.Message.InteractiveMessage.fromObject({ body: proto.Message.InteractiveMessage.Body.create({ text: `✦ Rᥱsᥙᥣ𝗍ᥲძ᥆s ძᥱ: ${text} ✨\n\n_Dᥱsᥣіzᥲ ρᥲrᥲ ᥎ᥱr mᥲ́s ᥎і́ძᥱ᥆s 👉_` }), footer: proto.Message.InteractiveMessage.Footer.create({ text: '🔎 TіkT᥆k Sᥱᥲrᥴһ' }), header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }), carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards }) }) } } }, { quoted: m })
await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
await m.react('✅')
} catch (error) {
console.error(error)
await m.react('❌')
}
}
handler.help = ['tiktoksearch <texto>']
handler.tags = ['buscador']
handler.command = ['tiktoksearch', 'ttss', 'tiktoks']
handler.group = true
handler.register = true
export default handler