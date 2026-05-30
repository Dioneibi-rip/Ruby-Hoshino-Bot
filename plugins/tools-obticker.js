import axios from 'axios'
import sharp from 'sharp'

class StickerLy {

async search(query) {

if (!query)
throw new Error('Query requerida')

const { data } = await axios.post(
'https://api.sticker.ly/v4/stickerPack/smartSearch',
{
keyword: query,
enabledKeywordSearch: true,
filter: {
extendSearchResult: false,
sortBy: 'RECOMMENDED',
languages: ['ALL'],
minStickerCount: 3,
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
!data.result.stickerPacks.length
) return []

const normalizedQuery =
query.toLowerCase().trim()

const packs = data.result.stickerPacks

.map(pack => ({

name: pack.name || 'Sin nombre',

author: pack.authorName || 'Desconocido',

url: pack.shareUrl,

stickerCount:
pack.resourceFiles?.length ||
pack.stickerCount ||
0,

viewCount: pack.viewCount || 0,

exportCount: pack.exportCount || 0,

isAnimated: pack.isAnimated || false

}))

.filter(pack => {

if (!pack.url)
return false

if (pack.stickerCount < 3)
return false

const name =
pack.name.toLowerCase()

const author =
pack.author.toLowerCase()

const badNames = [
'my stickers',
'test',
'sin nombre'
]

if (
badNames.some(v =>
name.includes(v)
)
) return false

// 🔥 SOLO paquetes relacionados

const exactName =
name.includes(normalizedQuery)

const exactAuthor =
author.includes(normalizedQuery)

return exactName || exactAuthor

})

.sort((a, b) => {

const aExact =
a.name
.toLowerCase()
.includes(normalizedQuery)
? 1000000
: 0

const bExact =
b.name
.toLowerCase()
.includes(normalizedQuery)
? 1000000
: 0

const scoreA =
aExact +
(a.exportCount * 2) +
a.viewCount +
(a.stickerCount * 50)

const scoreB =
bExact +
(b.exportCount * 2) +
b.viewCount +
(b.stickerCount * 50)

return scoreB - scoreA

})

return packs
}

async detail(url) {

const match =
url.match(/\/s\/([^\/\?#]+)/)

if (!match)
throw new Error(
'URL inválida'
)

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
throw new Error(
'Paquete no encontrado'
)

const stickers =
data.result.stickers

.map(stick => ({

fileName: stick.fileName,

isAnimated:
stick.isAnimated || false,

imageUrl:

stick.resourceUrl ||

stick.resourceFiles?.[0] ||

`${data.result.resourceUrlPrefix}${stick.fileName}`

}))

.filter(stick =>
stick.imageUrl
)

return {

name:
data.result.name ||
'Sin nombre',

author:
data.result.user?.displayName ||
'Desconocido',

stickers,

stickerCount:
stickers.length

}
}
}

let handler = async (
m,
{
conn,
text,
usedPrefix,
command
}
) => {

if (!text) {

return m.reply(
`⚠️ Ingresa un texto o URL.\n\n` +
`📌 Ejemplo:\n` +
`${usedPrefix + command} Hatsune Miku\n\n` +
`📌 Ejemplo:\n` +
`${usedPrefix + command} Goku`
)

}

await m.react('⏳')

try {

const api =
new StickerLy()

let packDetails

if (
text.includes(
'sticker.ly/s/'
)
) {

packDetails =
await api.detail(text)

} else {

const results =
await api.search(text)

if (!results.length) {

await m.react('❌')

return m.reply(
`❌ No encontré paquetes relacionados con:\n${text}`
)

}

const top =
results.slice(0, 3)

const selected =
top[
Math.floor(
Math.random() * top.length
)
]

packDetails =
await api.detail(selected.url)

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

let msg =
`📦 *PAQUETE ENCONTRADO*\n\n`

msg +=
`🏷️ *Nombre:* ${packDetails.name}\n`

msg +=
`👤 *Autor:* ${packDetails.author}\n`

msg +=
`📊 *Stickers:* ${packDetails.stickerCount}\n\n`

msg +=
`⏳ *Enviando stickers...*`

await m.reply(msg)

const max =
Math.min(
packDetails.stickers.length,
10
)

let enviados = 0

for (
let i = 0;
i < max;
i++
) {

const sticker =
packDetails.stickers[i]

try {

const response =
await axios.get(
sticker.imageUrl,
{
responseType:
'arraybuffer',
timeout: 15000
}
)

const buffer =
Buffer.from(
response.data
)

let finalBuffer

try {

finalBuffer =
await sharp(buffer)
.webp()
.toBuffer()

} catch {

finalBuffer =
buffer

}

await conn.sendMessage(
m.chat,
{
sticker:
finalBuffer
},
{
quoted: m
}
)

enviados++

await new Promise(
resolve =>
setTimeout(
resolve,
1200
)
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
'❌ No pude enviar stickers válidos.'
)

}

await m.react('✅')

} catch (e) {

console.error(e)

await m.react('❌')

m.reply(
`❌ Error:\n${e.message}`
)

}
}

handler.help = ['stickerly <texto/url>']
handler.tags = ['descargas']
handler.command = ['stickerly', 'sl', 'dlsticker']
handler.group = false

export default handler