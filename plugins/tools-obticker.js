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
'user-agent': 'androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)',
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

const packs = data.result.stickerPacks
.map(pack => ({
name: pack.name || 'Sin nombre',
author: pack.authorName || 'Desconocido',
url: pack.shareUrl,
stickerCount: pack.stickerCount || 0
}))
.filter(pack =>
pack.url &&
pack.stickerCount >= 5 &&
!pack.name.toLowerCase().includes('my stickers') &&
!pack.author.toLowerCase().includes('stick')
)

if (!packs.length) return null

const sorted = packs.sort(
(a, b) => b.stickerCount - a.stickerCount
)

return sorted
}

async detail(url) {

const match = url.match(/\/s\/([^\/\?#]+)/)

if (!match)
throw new Error('URL inválida de Sticker.ly')

const { data } = await axios.get(
`https://api.sticker.ly/v4/stickerPack/${match[1]}?needRelation=true`,
{
headers: {
'user-agent': 'androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)',
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

return {
name: data.result.name || 'Sin nombre',
author: data.result.user?.displayName || 'Desconocido',
stickers,
stickerCount: stickers.length
}
}
}

let handler = async (
m,
{ conn, text, usedPrefix, command }
) => {

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

if (!searchResults || !searchResults.length) {
await m.react('❌')
return m.reply(
`❌ No encontré paquetes para:\n"${text}"`
)
}

const topPacks = searchResults.slice(0, 5)

const selectedPack =
topPacks[
Math.floor(Math.random() * topPacks.length)
]

packDetails = await api.detail(selectedPack.url)
}

if (
!packDetails.stickers ||
!packDetails.stickers.length
) {
await m.react('❌')
return m.reply(
'❌ Este paquete no tiene stickers válidos.'
)
}

let info = `📦 *PAQUETE ENCONTRADO*\n\n`
info += `🏷️ *Nombre:* ${packDetails.name}\n`
info += `👤 *Autor:* ${packDetails.author}\n`
info += `📊 *Total:* ${packDetails.stickerCount} stickers\n\n`
info += `⏳ *Enviando stickers...*`

await m.reply(info)

const maxStickers = Math.min(
packDetails.stickers.length,
10
)

let enviados = 0

for (let i = 0; i < maxStickers; i++) {

const sticker = packDetails.stickers[i]

try {

const response = await axios.get(
sticker.imageUrl,
{
responseType: 'arraybuffer',
timeout: 15000
}
)

const buffer = Buffer.from(response.data)

let finalBuffer

try {

finalBuffer = await sharp(buffer)
.webp()
.toBuffer()

} catch {

finalBuffer = buffer

}

await conn.sendMessage(
m.chat,
{
sticker: finalBuffer
},
{
quoted: m
}
)

enviados++

await new Promise(resolve =>
setTimeout(resolve, 1200)
)

} catch (err) {

console.log(
`Error sticker ${i + 1}:`,
err.message
)

}
}

if (!enviados) {
await m.react('❌')
return m.reply(
'❌ No pude enviar ningún sticker válido.'
)
}

await m.react('✅')

} catch (e) {

console.error(e)

await m.react('❌')

m.reply(
`❌ Ocurrió un error.\n\n` +
`📌 Error:\n${e.message}`
)

}
}

handler.help = ['stickerly <texto/url>']
handler.tags = ['descargas']
handler.command = ['stickerly', 'sl', 'dlsticker']
handler.group = false

export default handler