import axios from 'axios'
import sharp from 'sharp'

class StickerLy {

async search(query) {
if (!query) throw new Error('Query is required')

const { data } = await axios.post(
'https://api.sticker.ly/v4/stickerPack/smartSearch',
{
keyword: query,
enabledKeywordSearch: true,
filter: {
extendSearchResult: false,
sortBy: 'POPULAR',
languages: ['ALL'],
minStickerCount: 5,
searchBy: 'ALL',
stickerType: 'ALL'
}
},
{
headers: {
'user-agent':
'androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)',
'content-type': 'application/json',
'accept-encoding': 'gzip'
}
}
)

if (
!data.result ||
!data.result.stickerPacks ||
data.result.stickerPacks.length === 0
) return null

return data.result.stickerPacks
.map(pack => ({
name: pack.name,
author: pack.authorName || 'Desconocido',
url: pack.shareUrl,
stickerCount: pack.stickerCount || 0
}))
.filter(pack =>
pack.name &&
pack.author &&
!pack.name.toLowerCase().includes('my stickers') &&
!pack.author.toLowerCase().includes('stick') &&
pack.stickerCount >= 8
)
.sort((a, b) => b.stickerCount - a.stickerCount)
}

async detail(url) {

const match = url.match(/\/s\/([^\/\?#]+)/)

if (!match)
throw new Error('Invalid URL. Use sticker.ly share URL')

const { data } = await axios.get(
`https://api.sticker.ly/v4/stickerPack/${match[1]}?needRelation=true`,
{
headers: {
'user-agent':
'androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)',
'content-type': 'application/json',
'accept-encoding': 'gzip'
}
}
)

if (!data.result)
throw new Error('No se pudo obtener el paquete')

const stickers = data.result.stickers
.filter(stick =>
stick &&
(
stick.resourceUrl ||
stick.fileName
)
)
.map(stick => ({
fileName: stick.fileName,
isAnimated: stick.isAnimated,
imageUrl:
stick.resourceUrl ||
`${data.result.resourceUrlPrefix}${stick.fileName}`
}))
.filter(stick => stick.imageUrl)

if (stickers.length === 0)
throw new Error('Este paquete no tiene stickers válidos')

return {
name: data.result.name || 'Sin nombre',
author: data.result.user?.displayName || 'Desconocido',
stickers,
stickerCount: stickers.length
}
}
}

let handler = async (m, { conn, text, usedPrefix, command }) => {

if (!text) {
return m.reply(
`⚠️ Ingresa un enlace o texto para buscar stickers.\n\n` +
`📌 Ejemplo:\n${usedPrefix + command} Miku\n\n` +
`📌 Ejemplo:\n${usedPrefix + command} https://sticker.ly/s/123456`
)
}

await m.react('⏳')

try {

const api = new StickerLy()
let packDetails

if (text.includes('sticker.ly/s/')) {

packDetails = await api.detail(text)

} else {

const searchResults = await api.search(text)

if (!searchResults || searchResults.length === 0) {
await m.react('❌')
return m.reply(
`❌ No se encontraron paquetes buenos para:\n"${text}"`
)
}

const topPacks = searchResults.slice(0, 5)

const selectedPack =
topPacks[Math.floor(Math.random() * topPacks.length)]

packDetails = await api.detail(selectedPack.url)
}

let infoMessage = `📦 *PAQUETE ENCONTRADO*\n\n`
infoMessage += `🏷️ *Nombre:* ${packDetails.name}\n`
infoMessage += `👤 *Autor:* ${packDetails.author}\n`
infoMessage += `📊 *Total:* ${packDetails.stickerCount} stickers\n\n`
infoMessage += `⏳ *Enviando stickers...*`

await m.reply(infoMessage)

const maxStickers = Math.min(packDetails.stickers.length, 10)

let enviados = 0

for (let i = 0; i < maxStickers; i++) {

const stickerData = packDetails.stickers[i]

try {

const response = await axios.get(
stickerData.imageUrl,
{
responseType: 'arraybuffer',
timeout: 15000
}
)

const buffer = Buffer.from(response.data)

if (!buffer || buffer.length < 1000) {
console.log(`Sticker vacío omitido: ${i + 1}`)
continue
}

let finalSticker

try {

finalSticker = await sharp(buffer)
.webp()
.toBuffer()

} catch {

finalSticker = buffer

}

await conn.sendMessage(
m.chat,
{
sticker: finalSticker
},
{
quoted: m
}
)

enviados++

await new Promise(resolve =>
setTimeout(resolve, 1200)
)

} catch (stickerError) {

console.log(
`Error sticker ${i + 1}:`,
stickerError.message
)

}
}

if (enviados === 0) {

await m.react('❌')

return m.reply(
'❌ Todos los stickers del paquete fallaron.\n' +
'Prueba otro nombre o enlace.'
)

}

await m.react('✅')

m.reply(
`✅ Se enviaron ${enviados} stickers correctamente.`
)

} catch (e) {

console.error(e)

await m.react('❌')

m.reply(
`❌ Ocurrió un error.\n\n` +
`📌 Error: ${e.message}`
)

}
}

handler.help = ['stickerly <texto/url>']
handler.tags = ['descargas', 'stickers']
handler.command = ['stickerly', 'sl', 'dlsticker']
handler.group = false

export default handler