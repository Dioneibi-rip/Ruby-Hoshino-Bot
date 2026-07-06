import { formatJobLine, ensureJobFields } from '../../lib/rpg-jobs.js'
async function loadMarriages() {
return global.db?.getSection?.('marriages') || {}
}
async function resolvePartnerJid(userId, user) {
if (user?.marry) return user.marry
const marriages = await loadMarriages()
if (marriages[userId]?.partner) return marriages[userId].partner
return null
}
let handler = async (m, { conn, usedPrefix }) => {
let userId
if (m.quoted?.sender) userId = m.quoted.sender
else if (m.mentionedJid?.[0]) userId = m.mentionedJid[0]
else userId = m.sender
let user = global.db.getUser(userId)
if (!user) return m.reply('> (っ- ‸ - ς) 𝖤𝗅 𝗎𝗌𝗎⍺𝗋𝗂𝗈 𝗇𝗈 𝖾𝗑𝗂𝗌𝗍𝖾 𝖾𝗇 𝗅⍺ 𝖻⍺𝗌𝖾 𝖽𝖾 𝖽⍺𝗍𝗈𝗌... 🌸')
ensureJobFields(user)
try {
let whatsappName
try {
whatsappName = await conn.getName(userId)
} catch (e) {
whatsappName = '🌸 𝖲𝗂𝗇 𝖭𝗈𝗆𝖻𝗋𝖾'
}
const name = user.customName || user.name || whatsappName
const cumpleanos = user.birth || '𖠿 𝖭𝗈 𝖾𝗌𝗉𝖾𝖼𝗂𝖿𝗂𝖼⍺𝖽𝗈'
const genero = user.genre || '𖠿 𝖭𝗈 𝖾𝗌𝗉𝖾𝖼𝗂𝖿𝗂𝖼⍺𝖽𝗈'
const age = Number.isFinite(user.age) && user.age >= 0 ? `${user.age}` : `𝖣𝖾𝗌𝖼𝗈𝗇𝗈𝖼𝗂𝖽⍺ (${usedPrefix}setage)`
let parejaId = await resolvePartnerJid(userId, user)
let parejaTag = '🥀 𝖭⍺𝖽𝗂𝖾'
let mentions = [userId]
if (parejaId && typeof parejaId === 'string') {
parejaTag = `⚝ @${parejaId.split('@')[0]}`
if (/@s\.whatsapp\.net$/.test(parejaId)) mentions.push(parejaId)
}
const description = user.description || '🌸 𝖲𝗂𝗇 𝖽𝖾𝗌𝖼𝗋𝗂𝗉𝖼𝗂𝗈́𝗇'
const exp = user.exp || 0
const nivel = user.level || 0
const role = user.role || '✧ 𝖲𝗂𝗇 𝗋⍺𝗇𝗀𝗈'
const coins = user.coin || 0
const bankCoins = user.bank || 0
const jobLine = formatJobLine(user)
const moneda = m.moneda || '𝖢𝗈𝗂𝗇𝗌'
let perfil
try {
perfil = await conn.profilePictureUrl(userId, 'image')
} catch (e) {
perfil = 'https://files.catbox.moe/xr2m6u.jpg'
}
const profileText = `ㅤㅤㅤ
     𝗣𝗋𝗈𝖿𝗂𝗅𝖾 ㅤㅤ❚❚❚ㅤㅤ👤ㅤ⎯🌸ㅤ.   𝗎𝗌𝖾𝗋 
 ㅤー(德)ㅤㅤ 𝖨𝗇𝖿𝗈    ㅤ⬤⬤ㅤ   ㅤ𝟤𝟫𝖼.

      𖹭 𝖭𝗈𝗆𝖻𝗋𝖾ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${name}
      𖹭 𝖴𝗌𝗎⍺𝗋𝗂𝗈ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  @${userId.split('@')[0]}
      𖹭 𝖤𝗌𝗍⍺𝖽𝗈ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${description}
⎯⎯⵿⎯̸⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯̸⵿⎯⎯
      𖹭 𝖤𝖽⍺𝖽ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${age}
      𖹭 𝖢𝗎𝗆𝗉𝗅𝖾ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${cumpleanos}
      𖹭 𝖦𝖾́𝗇𝖾𝗋𝗈ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${genero}
      𖹭 𝖯⍺𝗋𝖾𝗃⍺ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${parejaTag}
⎯⎯⵿⎯̸⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯̸⵿⎯⎯
      𖹭 𝖭𝗂𝗏𝖾𝗅ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${nivel}
      𖹭 𝖤𝗑𝗉ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${exp.toLocaleString()}
      𖹭 𝖱⍺𝗇𝗀𝗈ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${role}
⎯⎯⵿⎯̸⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯̸⵿⎯⎯
      𖹭 𝖢𝗈𝗂𝗇𝗌ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${coins.toLocaleString()} ${moneda}
      𖹭 𝖡⍺𝗇𝖼𝗈ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${bankCoins.toLocaleString()} ${moneda}
      𖹭 𝖯𝗋𝖾𝗆𝗂𝗎𝗆ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${user.premium ? '🌸 𝖲𝗂́' : '🥀 𝖭𝗈'}
      𖹭 𝖳𝗋⍺𝖻⍺𝗃𝗈ㅤ࣪ㅤ » ㅤㅤ㇒⵰ㅤ  ${jobLine}
`.trim()
await conn.sendMessage(m.chat, { image: { url: perfil }, caption: profileText, contextInfo: { mentionedJid: mentions } }, { quoted: m })
} catch (e) {
await m.reply(`> 💔 (´；ω；\`) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 ⍺𝗅 𝗆𝗈𝗌𝗍𝗋⍺𝗋 𝖾𝗅 𝗉𝖾𝗋𝖿𝗂𝗅... ✨\n\n${e.message}`)
return false;
}
}
handler.help = ['profile', 'perfil']
handler.tags = ['rg']
handler.command = ['profile', 'perfil']
export default handler