import axios from '../../infra/http.js'
let enviando = false
const handler = async (m, { conn, text, usedPrefix, command, args }) => {
if (!args || !args[0]) return conn.reply(m.chat, `> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖧𝗈𝗅𝖺 𝗅𝗂𝗇𝖽𝗑, 𝗍𝖾 𝖿𝖺𝗅𝗍𝗈́ 𝖾𝗅 𝗅𝗂𝗇𝗄 𝖽𝖾 𝗎𝗇 𝗏𝗂𝖽𝖾𝗈 𝖽𝖾 𝖳𝗐𝗂𝗍𝗍𝖾𝗋/𝖷... 🌸\n> 𝖤𝗃𝖾𝗆𝗉𝗅𝗈: *${usedPrefix}${command} <url>*`, m)
if (enviando) return
enviando = true
try {
const urlParam = encodeURIComponent(args[0])
const apiResponse = await axios.get(`https://api.siputzx.my.id/api/d/twitter?url=${urlParam}`)
const res = apiResponse.data
if (!res.status || !res.data || !res.data.downloadLink) {
enviando = false
return conn.reply(m.chat, `> (っ- ‸ - ς) 𝖭𝗈 𝗌𝖾 𝗉𝗎𝖽𝗈 𝖾𝗑𝗍𝗋𝖺𝖾𝗋 𝖾𝗅 𝗏𝗂𝖽𝖾𝗈... 𝖨𝗇𝗍𝖾𝗇𝗍𝖺 𝖼𝗈𝗇 𝗈𝗍𝗋𝗈 𝗅𝗂𝗇𝗄 🔗`, m)
}
const { downloadLink, videoTitle, videoDescription } = res.data
const caption = [
"ㅤ︵︵𝅼⏝︶︵ㅤ໋ㅤ᷼⏜⌢᷼ㅤㅤ໋︵︶⏝𝅼︵︵",
"ㅤ 𐇽ㅤㅤֺㅤㅤ𓈒ㅤ✿፝𖹭ㅤ🕊️ㅤ〬  𖹭ㅤ〭ㅤㅤ𖹭⃜͜ᮬ𖹭ㅤ",
"",
`       ꒰𑃖︧ᮬ 𝗧𝗶́𝘁𝘂𝗹𝗼: ${videoTitle || '𝖲𝗂𝗇 𝗍𝗂́𝗍𝗎𝗅𝗈 𝅄   ★'}`,
`       ꒰𑃖︧ᮬ 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝗰𝗶𝗼́𝗻: ${videoDescription || '𝖲𝗂𝗇 𝖽𝖾𝗌𝖼𝗋𝗂𝗉𝖼𝗂𝗈́𝗇 𝅄   ★'}`,
"",
"           ㅤ︶ּ⏝ׅ︶ ౨ৎ ︶ׁׅ⏝ּ︶",
"       ▒    `¡𝖠𝗊𝗎𝗂́ 𝗍𝗂𝖾𝗇𝖾𝗌 𝗍𝗎 𝗏𝗂𝖽𝖾𝗈!` 📎✨"
].join('\n')
await conn.sendMessage(m.chat, { video: { url: downloadLink }, caption: caption }, { quoted: m })
enviando = false
return
} catch (error) {
enviando = false
console.error(error)
conn.reply(m.chat, `> ❌ 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 𝖺𝗅 𝖽𝖾𝗌𝖼𝖺𝗋𝗀𝖺𝗋 𝗍𝗎 𝖺𝗋𝖼𝗁𝗂𝗏𝗈... 💔`, m)
return false
}
}
handler.help = ['twitter <url>']
handler.tags = ['dl']
handler.command = ['x', 'xdl', 'dlx', 'twdl', 'tw', 'twt', 'twitter']
handler.group = true
handler.register = true
export default handler