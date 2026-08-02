import axios from '../../library/http.js'

const APIs = {
'1': "https://apkcombo.com",
'2': "apk-dl.com",
'3': "https://apk.support",
'4': "https://apps.evozi.com/apk-downloader",
'5': "https://ws75.aptoide.com/api/7",
'6': "https://cafebazaar.ir"
}

const api = (name, path = '/', params = {}) => {
const baseUrl = name in APIs ? APIs[name] : name
const queryParams = Object.keys(params).length > 0 ? '?' + new URLSearchParams(Object.entries({ ...params })) : ''
return baseUrl + path + queryParams
}

const formatSize = (bytes) => {
if (bytes === 0) return '0 B'
const k = 1024
const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
const i = Math.floor(Math.log(bytes) / Math.log(k))
return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

let handler = async (m, { conn, usedPrefix, command, text }) => {
const toFancy = (str) => {
const map = {
'a':'ᥲ','b':'ᑲ','c':'ᥴ','d':'ᑯ','e':'ᥱ','f':'𝖿','g':'g','h':'һ','i':'і','j':'j','k':'k','l':'ᥣ','m':'m','n':'ᥒ','o':'᥆','p':'⍴','q':'q','r':'r','s':'s','t':'𝗍','u':'ᥙ','v':'᥎','w':'ɯ','x':'x','y':'ᥡ','z':'z',
'A':'A','B':'B','C':'C','D':'D','E':'E','F':'F','G':'G','H':'H','I':'I','J':'J','K':'K','L':'L','M':'M','N':'N','O':'O','P':'P','Q':'Q','R':'R','S':'S','T':'T','U':'U','V':'V','W':'W','X':'X','Y':'Y','Z':'Z'
}
return str.split('').map(c => map[c] || c).join('')
}

if (!text) return conn.reply(m.chat, `🚩 *${toFancy("Ingrese el nombre de la apk")}*`, m, rcanal)

try {
await m.react(rwait)

const searchUrl = api('5', '/apps/search', { query: text, limit: 1 })

let response = await axios.get(searchUrl)
let result = response.data

if (!result || !result.datalist || !result.datalist.list || !result.datalist.list.length) {
throw new Error("No se encontraron resultados")
}

let appData = result.datalist.list[0]
let rawSizeMB = appData.size / 1048576

let data5 = {
name: appData.name,
package: appData.package,
lastup: appData.updated.split(' ')[0],
size: formatSize(appData.size),
icon: appData.icon,
dllink: appData.file.path
}

let txt = `
✿ ㅤ ׄㅤ 🪷̸ㅤ ˒˓ㅤ 𓏸̶ ㅤ ׄ   ✿
\`\`\`A P T O I D E   D L\`\`\`

┌͡╼᮫͜  ⟆ 🍟  ${toFancy("Resultados")}
┆᮫⌣⃕╼̟ᜒ 📱 ${toFancy("Nombre")}: ${data5.name}
┆⌣⃕╼̟ᜒ 📦 ${toFancy("Package")}: ${data5.package}
┆⌣⃕╼̟ᜒ 🪴 ${toFancy("Update")}: ${data5.lastup}
┆⌣⃕╼̟ᜒ ⚖ ${toFancy("Peso")}: ${data5.size}
└͡╼᮫͜ ⌢᜔֔⌣ׄ𝅄⌢ֵ݊⌣֘ ܁

𖥻 · ˖ ࣪ ${toFancy("Descargando Archivo")}... ☆`.trim()

await conn.sendMessage(m.chat, {
image: { url: data5.icon },
caption: txt,
contextInfo: {}
}, { quoted: m })

if (rawSizeMB > 999) {
return conn.reply(m.chat, `🛑 *${toFancy("El archivo es demasiado pesado")}*`, m, rcanal)
}

let fkontak = {
key: { fromMe: false, participant: '0@s.whatsapp.net' },
message: { contactMessage: { displayName: 'Aptoide', vcard: '' }}
}

await conn.sendMessage(m.chat, {
document: { url: data5.dllink },
mimetype: 'application/vnd.android.package-archive',
fileName: data5.name + '.apk'
}, { quoted: fkontak })

await m.react(done)

} catch (e) {
console.log(e)
await m.react(error)
return conn.reply(m.chat, `🛑 *${toFancy("Ocurrió un fallo al buscar")}*`, m, rcanal)
}
}

handler.tags = ['descargas']
handler.help = ['apkmod']
handler.command = ['apk', 'modapk', 'aptoide']
handler.register = true

export default handler