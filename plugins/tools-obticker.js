import axios from 'axios'
import sharp from 'sharp'
class StickerLy {
async search(query) {
if (!query) throw new Error('Query requerida')
const { data } = await axios.post('https://api.sticker.ly/v4/stickerPack/smartSearch', { keyword: query, enabledKeywordSearch: true, filter: { extendSearchResult: false, sortBy: 'RECOMMENDED', languages: ['ALL'], minStickerCount: 3, searchBy: 'ALL', stickerType: 'ALL' } }, { headers: { 'user-agent': 'androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)', 'content-type': 'application/json', 'accept-encoding': 'gzip' } })
if (!data.result || !data.result.stickerPacks || !data.result.stickerPacks.length) return []
const normalizedQuery = query.toLowerCase().trim()
const packs = data.result.stickerPacks.map(pack => ({ name: pack.name || 'Sin nombre', author: pack.authorName || 'Desconocido', url: pack.shareUrl, stickerCount: pack.resourceFiles?.length || pack.stickerCount || 0, viewCount: pack.viewCount || 0, exportCount: pack.exportCount || 0, isAnimated: pack.isAnimated || false })).filter(pack => {
if (!pack.url || pack.stickerCount < 3) return false
const name = pack.name.toLowerCase()
const author = pack.author.toLowerCase()
const badNames = ['my stickers', 'test', 'sin nombre']
if (badNames.some(v => name.includes(v))) return false
return name.includes(normalizedQuery) || author.includes(normalizedQuery)
}).sort((a, b) => {
const aExact = a.name.toLowerCase().includes(normalizedQuery) ? 1000000 : 0
const bExact = b.name.toLowerCase().includes(normalizedQuery) ? 1000000 : 0
const scoreA = aExact + (a.exportCount * 2) + a.viewCount + (a.stickerCount * 50)
const scoreB = bExact + (b.exportCount * 2) + b.viewCount + (b.stickerCount * 50)
return scoreB - scoreA
})
return packs
}
async detail(url) {
const match = url.match(/\/s\/([^\/\?#]+)/)
if (!match) throw new Error('URL inválida')
const { data } = await axios.get(`https://api.sticker.ly/v4/stickerPack/${match[1]}?needRelation=true`, { headers: { 'user-agent': 'androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)', 'content-type': 'application/json', 'accept-encoding': 'gzip' } })
if (!data.result) throw new Error('Paquete no encontrado')
const stickers = data.result.stickers.map(stick => ({ fileName: stick.fileName, isAnimated: stick.isAnimated || false, imageUrl: stick.resourceUrl || `${data.result.resourceUrlPrefix}${stick.fileName}` })).filter(stick => stick.imageUrl)
return { name: data.result.name || 'Sin nombre', author: data.result.user?.displayName || 'Desconocido', stickers, stickerCount: stickers.length }
}
}
let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!text) {
return m.reply(`𐔌 ࣪ ̟ ּ ִ ׄ ִ ࣪ ˖ ۪࣪ ̟ ּ ִ ࣪⛩️ᩧ᳟˖ ۪࣪ ̟ ּ ִ ׄ ִ ࣪ ˖ ۪࣪ ̟ ּ ִﾉﾞ\n\n      ໊ 𐔌  Hola hermosa personita :3\n      Por favor, ingresa un texto o URL.\n\n ᗝᗝ  ϙִ ࣪ ˖ ࣪🍣̟᳟⃛ ! ੭ ִ ׄ⠷ 𝗘𝗷𝗲𝗺𝗽𝗹𝗼𝘀:\n ⊹ ${usedPrefix + command} Hatsune Miku\n ⊹ ${usedPrefix + command} Goku\n\nᐝ ׅ ׄ ׅ ѕωєєƚ ׄ ׅ ׄ ꊞ ׄ ׅ ׄ ׅ 🌼 ׄ ׅ ㅤׄ 𓈒𓂂`)
}
await m.react('⏳')
try {
const api = new StickerLy()
let packDetails
if (text.includes('sticker.ly/s/')) {
packDetails = await api.detail(text)
} else {
const results = await api.search(text)
if (!results.length) {
await m.react('🥀')
return m.reply(`₍ᐢ ׅ ׄ ׅꊞ ׅ ❌ 𝖭𝗈 𝖾𝗇𝖼𝗈𝗇𝗍𝗋𝖾́ 𝗉𝖺𝗊𝗎𝖾𝗍𝖾𝗌 𝗋𝖾𝗅𝖺𝖼𝗂𝗈𝗇𝖺𝖽𝗈𝗌 𝖼𝗈𝗇: *${text}* ૮(>﹏<)ა`)
}
const top = results.slice(0, 3)
const selected = top[Math.floor(Math.random() * top.length)]
packDetails = await api.detail(selected.url)
}
if (!packDetails.stickers || !packDetails.stickers.length) {
await m.react('🥀')
return m.reply('₍ᐢ ׅ ׄ ׅꊞ ׅ ⚠️ 𝖤𝗌𝗍𝖾 𝗉𝖺𝗊𝗎𝖾𝗍𝖾 𝗇𝗈 𝗍𝗂𝖾𝗇𝖾 𝗌𝗍𝗂𝖼𝗄𝖾𝗋𝗌 𝗏𝖺́𝗅𝗂𝖽𝗈𝗌. ૮(>﹏<)ა')
}
let msg = `〰︎ ⊹ 📦 𝗣𝗔𝗤𝗨𝗘𝗧𝗘 𝗘𝗡𝗖𝗢𝗡𝗧𝗥𝗔𝗗𝗢 ⊹〰︎\n\n🏷️ *Nombre:* ${packDetails.name}\n👤 *Autor:* ${packDetails.author}\n📊 *Stickers:* ${packDetails.stickerCount}\n\n ꒷ ๑ 𝖤𝗇𝗏𝗂𝖺𝗇𝖽𝗈 𝗌𝗍𝗂𝖼𝗄𝖾𝗋𝗌, 𝖾𝗌𝗉𝖾𝗋𝖺 𝗎𝗇 𝗆𝗈𝗆𝖾𝗇𝗍𝗂𝗍𝗈 𝗉𝗈𝗋 𝖿𝖺𝗏𝗈𝗋... ๑ ꒷`
await m.reply(msg)
const max = Math.min(packDetails.stickers.length, 30)
let stickersArray = []
let coverBuffer = null
for (let i = 0; i < max; i++) {
const sticker = packDetails.stickers[i]
try {
const response = await axios.get(sticker.imageUrl, { responseType: 'arraybuffer', timeout: 15000 })
const buffer = Buffer.from(response.data)
if (i === 0) {
try {
coverBuffer = await sharp(buffer, { animated: false }).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 60 }).toBuffer()
} catch {
coverBuffer = buffer
}
}
stickersArray.push({ media: buffer, isAnimated: sticker.isAnimated, emojis: ['🎀'] })
} catch (err) {
console.log(`Error al procesar sticker ${i + 1}:`, err.message)
}
}
if (stickersArray.length === 0) {
await m.react('🥀')
return m.reply('₍ᐢ ׅ ׄ ׅꊞ ׅ ❌ 𝖭𝗈 𝗉𝗎𝖽𝖾 𝗉𝗋𝗈𝖼𝖾𝗌𝖺𝗋 𝗅𝗈𝗌 𝗌𝗍𝗂𝖼𝗄𝖾𝗋𝗌. ૮(>﹏<)ა')
}
await conn.sendMessage(m.chat, { stickerPack: { name: packDetails.name, publisher: packDetails.author, description: 'Descargado por tu Bot Kawaii ✨', cover: coverBuffer, stickers: stickersArray } }, { quoted: m })
await m.react('🎀')
} catch (e) {
console.error(e)
await m.react('🥀')
m.reply(`───│ ❌ 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋:\n${e.message} ✉𓈒𓂂ׅ◝ׄ`)
}
}
handler.help = ['stickerly <texto/url>']
handler.tags = ['descargas']
handler.command = ['stickerly', 'sl', 'dlsticker']
handler.group = false
export default handler
