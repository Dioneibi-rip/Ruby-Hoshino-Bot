import axios from '../../infra/http.js'
let enviando = false
const handler = async (m, { conn, text, usedPrefix, command, args }) => {
if (!args || !args[0]) return conn.reply(m.chat, `⚠️ Te faltó el link de un video de twitter.`, m)
if (enviando) return
enviando = true
try {
const urlParam = encodeURIComponent(args[0])
const apiResponse = await axios.get(`https://api.siputzx.my.id/api/d/twitter?url=${urlParam}`)
const res = apiResponse.data
if (!res.status || !res.data || !res.data.downloadLink) {
enviando = false
return conn.reply(m.chat, `❌ No se pudo extraer el video.`, m)
}
const { downloadLink, videoTitle, videoDescription } = res.data
const caption = `${videoTitle || ''}\n${videoDescription || ''}\n\n✅ Aquí tienes tu video de Twitter :3`.trim()
await conn.sendMessage(m.chat, { video: { url: downloadLink }, caption: caption }, { quoted: m })
enviando = false
return
} catch (error) {
enviando = false
console.error(error)
conn.reply(m.chat, `❌ Error al descargar su archivo`, m)
return false
}
}
handler.help = ['twitter <url>']
handler.tags = ['dl']
handler.command = ['x', 'xdl', 'dlx', 'twdl', 'tw', 'twt', 'twitter']
handler.group = true
handler.register = true
export default handler