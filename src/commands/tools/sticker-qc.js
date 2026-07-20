import { sticker } from '../../library/sticker.js'
import axios from '../../library/http.js'
const handler = async (m, { conn, args }) => {
const rwait = global.rwait || "⏳";
const done = global.done || "✅";
const error = global.error || "❌";
let text
if (args.length >= 1) {
text = args.join(' ')
} else if (m.quoted?.text) {
text = m.quoted.text
} else {
return conn.reply(m.chat, '՞߹ - ߹՞ 𝖯𝗈𝗋 𝖿⍺𝗏𝗈𝗋, 𝗂𝗇𝗀𝗋𝖾𝗌⍺ 𝗎𝗇 𝗍𝖾𝗑𝗍𝗈 𝗉⍺𝗋⍺ 𝖼𝗋𝖾⍺𝗋 𝖾𝗅 𝗌𝗍𝗂𝖼𝗄𝖾𝗋... 🌸', m)
}
if (!text) return conn.reply(m.chat, '> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖯𝗈𝗋 𝖿⍺𝗏𝗈𝗋, 𝗂𝗇𝗀𝗋𝖾𝗌⍺ 𝗎𝗇 𝗍𝖾𝗑𝗍𝗈 𝗉⍺𝗋⍺ 𝖼𝗋𝖾⍺𝗋 𝖾𝗅 𝗌𝗍𝗂𝖼𝗄𝖾𝗋... 🌸', m)
try {
await m.react(rwait);
const mentionedUser = m.mentionedJid?.[0] || m.quoted?.sender || m.sender
const pp = await conn.profilePictureUrl(mentionedUser, 'image').catch(() => 'https://telegra.ph/file/24fa902ead26340f3df2c.png')
const nombre = await conn.getName(mentionedUser)
const mentionRegex = new RegExp(`@${mentionedUser.split('@')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g')
const mishi = text.replace(mentionRegex, '').trim()
if (mishi.length > 30) {
await m.react(error);
return conn.reply(m.chat, '> (っ- ‸ - ς) 𝖤𝗅 𝗍𝖾𝗑𝗍𝗈 𝗇𝗈 𝗉𝗎𝖾𝖽𝖾 𝗍𝖾𝗇𝖾𝗋 𝗆⍺́𝗌 𝖽𝖾 𝟥𝟢 𝖼⍺𝗋⍺𝖼𝗍𝖾𝗋𝖾𝗌... 💔', m)
}
const obj = {
type: 'quote',
format: 'png',
backgroundColor: '#000000',
width: 512,
height: 768,
scale: 2,
messages: [{
entities: [],
avatar: true,
from: {
id: 1,
name: nombre,
photo: {
url: pp
}
},
text: mishi,
replyMessage: {}
}]
}
const json = await axios.post('https://quote.yuri.ly/generate', obj, {
headers: {
'Content-Type': 'application/json'
}
})
const buffer = Buffer.from(json.data.result.image, 'base64')
const userId = m.sender
const packstickers = global.db.data.users[userId] || {}
const texto1 = packstickers.text1 || global.packsticker
const texto2 = packstickers.text2 || global.packsticker2
const stiker = await sticker(buffer, false, texto1, texto2)
if (stiker) {
await conn.sendFile(m.chat, stiker, 'sticker.webp', '', m)
await m.react(done);
}
} catch (error) {
console.error(error)
await m.react(error);
return conn.reply(m.chat, '> 💔 (´；ω；`) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 ⍺𝗅 𝗀𝖾𝗇𝖾𝗋⍺𝗋 𝖾𝗅 𝗌𝗍𝗂𝖼𝗄𝖾𝗋... 𝗅⍺ ⍺𝗉𝗂 𝗉𝗎𝖾𝖽𝖾 𝖾𝗌𝗍⍺𝗋 𝖼⍺𝗂́𝖽⍺... ✨', m)
}
}
handler.help = ['qc']
handler.tags = ['sticker']
handler.group = true
handler.command = ['qc']
export default handler