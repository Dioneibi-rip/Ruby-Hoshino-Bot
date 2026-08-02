import axios from '../../library/http.js'
let enviando = false
const handler = async (m, { conn, text, usedPrefix, command, args }) => {
if (!args || !args[0]) {
return conn.reply(m.chat, `> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ ¡𝖧𝗈𝗅𝖺 𝗅𝗂𝗇𝖽𝗑! 𝖳𝖾 𝖿𝖺𝗅𝗍𝗈́ 𝗂𝗇𝗀𝗋𝖾𝗌𝖺𝗋 𝖾𝗅 𝗅𝗂𝗇𝗄 𝖽𝖾 𝗎𝗇 𝗏𝗂𝖽𝖾𝗈 𝖽𝖾 𝖳𝗐𝗂𝗍𝗍𝖾𝗋/𝖷... 🌸\n> 𝖤𝗃𝖾𝗆𝗉𝗅𝗈: *${usedPrefix}${command} https://x.com/user/status/123...*`, m)
}
const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/[0-9]+/i
if (!twitterRegex.test(args[0])) {
return conn.reply(m.chat, `> (っ- ‸ - ς) ¡𝖴𝗎𝗉𝗌! 𝖤𝗌𝖾 𝗇𝗈 𝗉𝖺𝗋𝖾𝖼𝖾 𝗎𝗇 𝗅𝗂𝗇𝗄 𝗏𝖺́𝗅𝗂𝖽𝗈 𝖽𝖾 𝖳𝗐𝗂𝗍𝗍𝖾𝗋 𝗈 𝖷... ✨\n> 𝖯𝗈𝗋 𝖿𝖺𝗏𝗈𝗋, 𝖺𝗌𝖾𝗀𝗎́𝗋𝖺𝗍𝖾 𝖽𝖾 𝗊𝗎𝖾 𝗌𝖾𝖺 𝗎𝗇 𝖾𝗇𝗅𝖺𝖼𝖾 𝖼𝗈𝗋𝗋𝖾𝖼𝗍𝗈 𝗒 𝗏𝗎𝖾𝗅𝗏𝖾 𝖺 𝗂𝗇𝗍𝖾𝗇𝗍𝖺𝗋𝗅𝗈.`, m)
}
if (enviando) return
enviando = true
await m.react?.('⏳')
try {
const urlParam = encodeURIComponent(args[0])
const apiResponse = await axios.get(`https://api.siputzx.my.id/api/d/twitter?url=${urlParam}`)
const res = apiResponse.data
if (!res.status || !res.data || !res.data.downloadLink) {
enviando = false
await m.react?.('💔')
return conn.reply(m.chat, `> (っ- ‸ - ς) 𝖭𝗈 𝗌𝖾 𝗉𝗎𝖽𝗈 𝖾𝗑𝗍𝗋𝖺𝖾𝗋 𝖾𝗅 𝗏𝗂𝖽𝖾𝗈... 𝖳𝖺𝗅 𝗏𝖾𝗓 𝖾𝗅 𝗉𝗈𝗌𝗍 𝖾𝗌 𝗉𝗋𝗂𝗏𝖺𝖽𝗈 𝗈 𝗇𝗈 𝖼𝗈𝗇𝗍𝗂𝖾𝗇𝖾 𝗆𝗎𝗅𝗍𝗂𝗆𝖾𝖽𝗂𝖺. ✨`, m)
}
const { downloadLink, videoTitle, videoDescription } = res.data
const caption = `
 𐇽ㅤㅤ𓈒ㅤ✿፝𖹭ㅤ 𝖳𝗐𝗂𝗍𝗍𝖾𝗋 𝖣𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝗋 ㅤ〬  𖹭
 തㅤ   ׂ         ׅ     🪜ㅤ ㅤֺㅤㅤ𖹭͞යㅤㅤִ

꒰𑃖︧ᮬ 🌸 *𝖳𝗂́𝗍𝗎𝗅𝗈:* ${videoTitle || '𝖲𝗂𝗇 𝗍𝗂́𝗍𝗎𝗅𝗈'}
꒰𑃖︧ᮬ 🎀 *𝖣𝖾𝗌𝖼𝗋𝗂𝗉𝖼𝗂𝗈́𝗇:* ${videoDescription || '𝖲𝗂𝗇 𝖽𝖾𝗌𝖼𝗋𝗂𝗉𝖼𝗂𝗈́𝗇'}

✿፝𖹭ㅤָ⪩⪨ㅤ〫 𝖵𝗂𝖽𝖾𝗈 𝖽𝖾𝗌𝖼𝖺𝗋𝗀𝖺𝖽𝗈 𝖼𝗈𝗇 𝖾́𝗑𝗂𝗍𝗈 ✨ ㅤֺㅤㅤ୭𝆹⵿𝅥❀〫
`.trim()
await conn.sendMessage(m.chat, { video: { url: downloadLink }, caption: caption }, { quoted: m })
await m.react?.('✅')
enviando = false
return
} catch (error) {
enviando = false
console.error(error)
await m.react?.('💔')
conn.reply(m.chat, `> (っ- ‸ - ς) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 𝖺𝗅 𝖽𝖾𝗌𝖼𝖺𝗋𝗀𝖺𝗋 𝖾𝗅 𝖺𝗋𝖼𝗁𝗂𝗏𝗈... ✨\n\n> 💡 *𝖣𝖾𝗍⍺𝗅𝗅𝖾:* \`${error.message}\``, m)
return false
}
}
handler.help = ['twitter <url>']
handler.tags = ['dl']
handler.command = ['x', 'xdl', 'dlx', 'twdl', 'tw', 'twt', 'twitter']
handler.group = true
handler.register = true
export default handler