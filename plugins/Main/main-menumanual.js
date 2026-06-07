import axios from "axios"

const channelRD = '120363335626706839@newsletter'
const canalNombreM = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭'

var handler = async (m, { conn, usedPrefix, command }) => {
try {
const img = await axios.get("https://github.com/levi275/img/blob/main/Merry-christmas4.jpeg?raw=1", { responseType: "arraybuffer" })
const thumb = Buffer.from(img.data)
let name = m.pushName || 'Aventurero'

const texto = `⋱⏜ֹ๋۪۪۪۪۪۪᷼︵̈⋱ֻ࡛࡛፟＼𑂳⚚／ֻ࡛𑂳࡛⋰̈︵ֹ๋۪۪۪۪۪۪᷼⏜⋰
ᰍִ۪۪۪֟፝ᰍִ͚  ִּ֮   🌟 𝙈𝙀𝙉𝙐 𝙈𝘼𝙉𝙐𝘼𝙇 🌟   ִּ֮ 
    
(｡•ᴗ•)ﾉﾞ¡𝐇𝐨𝐥𝐚, ${name}! 💫
𝐄𝐬𝐭𝐨𝐬 𝐬𝐨𝐧 𝐥𝐚𝐬 𝐨𝐩𝐜𝐢𝐨𝐧𝐞𝐬 𝐝𝐞 𝐦𝐞𝐧𝐮́ 𝐪𝐮𝐞 𝐭𝐢𝐞𝐧𝐞 𝐥𝐚 𝐛𝐨𝐭

> ├┈・──・──・﹕₊˚ ✦・୨୧・
> │  ◦  ⚙️ _${usedPrefix}menuall_
> 🍧 ꒰ 𝗺𝘂𝗲𝘀𝘁𝗿𝗮 𝘁𝗼𝗱𝗼𝘀 𝗹𝗼𝘀 𝗰𝗼𝗺𝗮𝗻𝗱𝗼𝘀 𝗱𝗶𝘀𝗽𝗼𝗻𝗶𝗯𝗹𝗲𝘀 𝗲𝗻 𝗥𝘂𝗯𝘆 ꒱
> │  ◦  ⚙️ _${usedPrefix}menudescargas_
> 🎧 ꒰ 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮 𝗮𝘂𝗱𝗶𝗼𝘀, 𝘃𝗶𝗱𝗲𝗼𝘀, 𝗜𝗴, 𝗙𝗕, 𝗧𝗶𝗸𝗧𝗼𝗸 𝘆 𝗺𝗮́𝘀 ꒱
> │  ◦  ⚙️ _${usedPrefix}menueconomia_
> 🎮 ꒰ ¡𝗖𝗿𝗲𝗮 𝘁𝘂 𝗮𝘃𝗲𝗻𝘁𝘂𝗿𝗮! 𝗠𝗶𝗻𝗮, 𝗰𝗮𝘇𝗮, 𝗴𝗮𝗻𝗮 𝗼𝗿𝗼 𝘆 𝗱𝗼𝗺𝗶𝗻𝗮 𝗲𝗹 𝗥𝗣𝗚. ꒱
> │  ◦  ⚙️ _${usedPrefix}menugacha_
> 🎭 ꒰ ¡𝗚𝗶𝗿𝗮 𝗲𝗹 𝗱𝗲𝘀𝘁𝗶𝗻𝗼 𝘆 𝗰𝗼𝗹𝗲𝗰𝗰𝗶𝗼𝗻𝗮 𝗵𝗲́𝗿𝗼𝗲𝘀 𝗲́𝗽𝗶𝗰𝗼𝘀! ꒱
> │  ◦  ⚙️ _${usedPrefix}menusticker_
> ✨ ꒰ 𝗖𝗿𝗲𝗮 𝘀𝘁𝗶𝗰𝗸𝗲𝗿𝘀 𝗮𝗻𝗶𝗺𝗮𝗱𝗼𝘀, 𝗽𝗲𝗿𝘀𝗼𝗻𝗮𝗹𝗶𝘇𝗮𝗱𝗼𝘀 𝘆 𝘂́𝗻𝗶𝗰𝗼𝘀 ꒱
> │  ◦  ⚙️ _${usedPrefix}menuherramientas_
> ⛓️‍💥 ꒰ 𝗖𝗼𝗺𝗮𝗻𝗱𝗼𝘀 𝘂́𝘁𝗶𝗹𝗲𝘀 𝘆 𝗱𝗶𝘃𝗲𝗿𝘀𝗼𝘀 𝗽𝗮𝗿𝗮 𝗰𝗮𝗱𝗮 𝘀𝗶𝘁𝘂𝗮𝗰𝗶𝗼́𝗻 ꒱
> │  ◦  ⚙️ _${usedPrefix}menuperfil_
> 🧩 ꒰ 𝗔𝗱𝗮𝗽𝘁𝗮 𝘁𝘂 𝘂𝘀𝘂𝗮𝗿𝗶𝗼, 𝗿𝗲𝗴𝗶́𝘀𝘁𝗿𝗮𝘁𝗲 𝘆 𝗿𝗲𝘃𝗶𝘀𝗮 𝘁𝘂 𝗲𝘀𝘁𝗮𝗱𝗼 ꒱
> │  ◦  ⚙️ _${usedPrefix}menugrupo_
> 🌐 ꒰ 𝗛𝗲𝗿𝗿𝗮𝗺𝗶𝗲𝗻𝘁𝗮𝘀 𝗽𝗮𝗿𝗮 𝗹𝗮 𝗮𝗱𝗺𝗶𝗻𝗶𝘀𝘁𝗿𝗮𝗰𝗶𝗼́𝗻 𝗱𝗲 𝘁𝘂 𝗴𝗿𝘂𝗽𝗼 ꒱
> │  ◦  ⚙️ _${usedPrefix}menuanime_
> 💢 ꒰ 𝗘𝘅𝗽𝗿𝗲́𝘀𝗮𝘁𝗲 𝗰𝗼𝗻 𝗿𝗲𝗮𝗰𝗰𝗶𝗼𝗻𝗲𝘀 𝗱𝗲 𝗮𝗻𝗶𝗺𝗲 𝗶𝗰𝗼́𝗻𝗶𝗰𝗮𝘀 ꒱
> │  ◦  ⚙️ _${usedPrefix}menujuegos_
> 🎲 ꒰ 𝗣𝗿𝘂𝗲𝗯𝗮 𝘁𝘂 𝘀𝘂𝗲𝗿𝘁𝗲 𝘆 𝗿𝗲𝘁𝗮 𝗮 𝘁𝘂𝘀 𝗮𝗺𝗶𝗴𝗼𝘀 𝗲𝗻 𝗺𝗶𝗻𝗶-𝗷𝘂𝗲𝗴𝗼𝘀 ꒱
> │  ◦  ⚙️ _${usedPrefix}menunsfw_
> 🔞 ꒰ 𝗔𝗰𝗰𝗲𝘀𝗼 𝗮 𝗰𝗼𝗺𝗮𝗻𝗱𝗼𝘀 𝗡𝗦𝗙𝗪, 𝘀𝗼𝗹𝗼 𝗽𝗮𝗿𝗮 𝗮𝗱𝘂𝗹𝘁𝗼𝘀 (+18) ꒱
> │  ◦  ⚙️ _${usedPrefix}menubusquedas_
> 🌍 ꒰ 𝗕𝘂𝘀𝗰𝗮 𝗶𝗻𝗳𝗼, 𝗹𝗲𝘁𝗿𝗮𝘀, 𝘃𝗶𝗱𝗲𝗼𝘀 𝘆 𝗺𝘂𝗰𝗵𝗼 𝗺𝗮́𝘀 𝗲𝗻 𝗹𝗶́𝗻𝗲𝗮 ꒱
> ╰┉ͦ━ᷫ━ⷭ┈ ⃘⵿݂۪۪۪࣭࣭፝۬۬۬͞💙ꫂ❀ᰰ᷒|²⁰|²|²³ ♡┈⊷ꫂ፝۬۬۬͞ᜓ⃘݂۪۪۪࣭࣭.─❤️⃟ᬽ፝֟━❥ᰰຼ᭢╯*

  ִ ⋱  ִֺ＼ ֺ ִ ̲｜ ֺ ִ ̲／ ֺ ִ⋰ִ  ֺ
 ֻׄ ⚚ ֕ ̷̸᮫᮫ּּּׁ᳟࣭݂۪֟፝ׄ݊͜͞  𝐓𝐞 𝐞𝐬𝐩𝐞𝐫𝐚𝐦𝐨𝐬̶̤࣭᪲۫‿ּ۪۪۪۪۪ٜ࣪⢎ּ۪࣪🪽`

await conn.sendMessage(
m.chat,
{
image: img.data,
caption: texto,
contextInfo: {
mentionedJid: [m.sender],
isForwarded: true,
forwardingScore: 999,
forwardedNewsletterMessageInfo: {
newsletterJid: channelRD,
newsletterName: canalNombreM,
serverMessageId: -1
}}
},
{ quoted: m }
)

} catch (e) {
await conn.reply(m.chat, "❌ Error:\n" + e.toString(), m)
}
}

handler.help = ["menumanual"]
handler.tags = ["main"]
handler.command = ["menumanual"]

export default handler
