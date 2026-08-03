import { WAMessageStubType } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'
const newsletterJid = '120363335626706839@newsletter';
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭';

function normalizeMentionJid(value) {
if (!value) return null
if (typeof value === 'object') value = value.id || value.jid || value.phoneNumber || value.lid || ''
let text = String(value).trim()
if (!text) return null
if (text.startsWith('{')) {
try {
const parsed = JSON.parse(text)
text = parsed.id || parsed.jid || parsed.phoneNumber || parsed.lid || text
} catch {}
}
text = String(text).replace(/^@/, '').trim()
if (/^\d+$/.test(text)) return `${text}@s.whatsapp.net`
if (/^\d+@(?:s\.whatsapp\.net|lid)$/.test(text)) return text
return text.includes('@') ? text : null
}


function isForbiddenError(error) {
const text = [error?.message, error?.stack, error?.reason, error?.code, error?.statusCode, error?.output?.statusCode, error?.data?.statusCode].filter(Boolean).join(' ').toLowerCase()
return text.includes('403') || text.includes('forbidden')
}

function mentionLabel(jid) {
const normalized = normalizeMentionJid(jid)
return normalized ? `@${normalized.split('@')[0].split(':')[0]}` : '@usuario'
}


async function sendWelcomeMessage(conn, chatId, targetJid, imagePath, text, fallbackPath) {
const contextInfo = {
mentionedJid: [targetJid].filter(Boolean),
isForwarded: true,
forwardingScore: 9999999,
forwardedNewsletterMessageInfo: { newsletterJid: newsletterJid, newsletterName: newsletterName, serverMessageId: -1 }
}
try {
const image = /^https?:\/\//i.test(String(imagePath)) ? { url: imagePath } : fs.readFileSync(imagePath)
await conn.sendMessage(chatId, { image, caption: text, contextInfo }, { quoted: null })
} catch (error) {
if (isForbiddenError(error)) return true
console.error('[welcome] error generando/enviando imagen de bienvenida', error)
try {
const fallbackImage = fallbackPath ? fs.readFileSync(fallbackPath) : null
if (fallbackImage) return await conn.sendMessage(chatId, { image: fallbackImage, caption: text, contextInfo }, { quoted: null })
} catch (fallbackError) {
if (isForbiddenError(fallbackError)) return true
}
try {
await conn.sendMessage(chatId, { text, mentions: [targetJid].filter(Boolean), contextInfo }, { quoted: null })
} catch (textError) {
if (!isForbiddenError(textError)) console.error('[welcome] error enviando texto de respaldo', textError)
}
}
}

const toFancy = (str) => {
const map = {'a':'ᥲ','b':'ᑲ','c':'ᥴ','d':'ᑯ','e':'ᥱ','f':'𝖿','g':'g','h':'һ','i':'і','j':'j','k':'k','l':'ᥣ','m':'m','n':'ᥒ','o':'᥆','p':'⍴','q':'q','r':'r','s':'s','t':'𝗍','u':'ᥙ','v':'᥎','w':'ɯ','x':'x','y':'ᥡ','z':'z','A':'A','B':'B','C':'C','D':'D','E':'E','F':'F','G':'G','H':'H','I':'I','J':'J','K':'K','L':'L','M':'M','N':'N','O':'O','P':'P','Q':'Q','R':'R','S':'S','T':'T','U':'U','V':'V','W':'W','X':'X','Y':'Y','Z':'Z'}
return str.split('').map(c => map[c] || c).join('')
}
export async function before(m, { conn, participants = [], groupMetadata = {} } = {}) {
if (!m.messageStubType || !m.isGroup) return true
const chat = global.db.getChat(m.chat)
if (!chat || !chat.welcome) return true
const isWelcome = [
WAMessageStubType.GROUP_PARTICIPANT_ADD,
WAMessageStubType.GROUP_PARTICIPANT_INVITE,
27, 31
].includes(m.messageStubType)
const isBye = [
WAMessageStubType.GROUP_PARTICIPANT_REMOVE,
WAMessageStubType.GROUP_PARTICIPANT_LEAVE,
28, 32
].includes(m.messageStubType)
if (!isWelcome && !isBye) return true
const safeParticipants = Array.isArray(participants) ? participants : []
const usuariosAfectados = Array.isArray(m.messageStubParameters) && m.messageStubParameters.length > 0 ? m.messageStubParameters : [m.sender]
for (let userId of usuariosAfectados) {
if (!userId) continue;
const targetJid = normalizeMentionJid(userId) || normalizeMentionJid(m.sender)
if (!targetJid) continue
try {
const greetingAssetsDir = path.join(process.cwd(), 'src', 'assets', 'greetings')
const fallbackGreetingImage = isWelcome ? path.join(greetingAssetsDir, 'welcome_card.jpg') : path.join(greetingAssetsDir, 'leave_card.jpg')
const profile = conn.botProfile || {}
const greetingImage = isWelcome ? (profile.welcomeImageUrl || fallbackGreetingImage) : (profile.goodbyeImageUrl || fallbackGreetingImage)
const username = mentionLabel(targetJid)
const groupName = groupMetadata?.subject || 'este grupo'
const desc = groupMetadata?.desc?.toString() || 'Sin descripción'
const groupSize = (Array.isArray(groupMetadata?.participants) && groupMetadata.participants.length) || safeParticipants.length || 0
const fecha = new Date().toLocaleDateString("es-ES", { timeZone: "America/Santo_Domingo", day: 'numeric', month: 'long', year: 'numeric' })
if (isWelcome) {
let text
if (chat.welcomeText) {
const botName = profile.botName || conn.botProfile?.botName || 'Ruby Hoshino'
text = chat.welcomeText.replace(/@user/g, username).replace(/@subject/g, groupName).replace(/@desc/g, desc).replace(/\{user\}/g, username).replace(/\{group\}/g, groupName).replace(/\{botName\}/g, botName)
} else {
text = `
︶᮫໋۪۪᷼͡⏝᜔໋〫᷑ׄ♡᜔ׅ𝆬۟┅᮫໋ׅׄ᪲︶᮫᜔ׅᷭ͡⏝᮫᜔〪ׅ〫𝆬⢥ֶ𝆬✿۪۪𝆬֟🍒̷̸᩠〪۪۪〫〫〫ᷭ✿ֶ〫𝆬⡬᮫〪ׅׄ⏝᮫໋〪ׅ〫𝆬ׄ͡︶᜔ׄ┅᮫۪۪᪲

✿ ㅤ ׄㅤ 🪷̸ㅤ ˒˓ㅤ 𓏸̶ ㅤ ׄ   ✿
\`\`\`B I E N V E N I D O\`\`\`

*${toFancy("_͜𐨎݃🌹 ᩬᩬ̷̸໋  𐇽֟፝͝▱ֺּUsuario ̷̸̸̷ׁ່֢݁ᮢ▭ᮬ─")}* ${username}
*${toFancy("_͜𐨎݃🌹 ᩬᩬ̷̸໋  𐇽֟፝͝▱ֺּGrupo ̷̸̸̷ׁ່֢݁ᮢ▭ᮬ─")}* ${groupName}

ֺ    ﾺ  ۪  ﹙🌹 ֺ    𔓗
_*/𝐓𝐞𝐧𝐞𝐦𝐨𝐬 𝐦𝐮𝐜𝐡𝐨 𝐩𝐨𝐫 𝐥𝐨 𝐜𝐮𝐚𝐥 𝐜𝐫𝐞𝐜𝐞𝐫 𝐲 𝐝𝐞𝐬𝐚𝐫𝐫𝐨𝐥𝐥𝐚𝐫𝐧𝐨𝐬 𝐦𝐮𝐜𝐡𝐨 𝐦𝐚́𝐬 𝐞𝐧 𝐞𝐥 𝐠𝐫𝐮𝐩𝐨 𝐞𝐫𝐞𝐬 𝐁𝐢𝐞𝐧𝐯𝐞𝐧𝐢𝐝𝐨 𝐬𝐢𝐧 𝐢𝐦portar 𝐪𝐮𝐞.../*_

┌͡╼᮫͜  ⟆ ✿̼⃜  ${toFancy("Estadísticas")} ㅤ
┆᮫⌣⃕╼̟ᜒ 👥 : ${groupSize}
┆⌣⃕╼̟ᜒ 📅 : ${fecha}
└͡╼᮫͜ ⌢᜔֔⌣ׄ𝅄⌢ֵ݊⌣֘ ܁ ⌢᜔֔⌣ׄ𝅄⌢ֵ݊⌣֘܁⌢̼ׄ

︶᮫໋۪۪᷼͡⏝᜔໋〫᷑ׄ♡᜔ׅ𝆬۟┅᮫໋ׅׄ᪲︶᮫᜔ׅᷭ͡⏝᮫᜔〪ׅ〫𝆬⢥ֶ𝆬✿۪۪𝆬֟🍒̷̸᩠〪۪۪〫〫〫ᷭ✿ֶ〫𝆬

> establece un mensaje de bienvenida con #setwelcome`.trim()
}
await sendWelcomeMessage(conn, m.chat, targetJid, greetingImage, text, fallbackGreetingImage)
} else if (isBye) {
let text
if (chat.byeText) {
const botName = profile.botName || conn.botProfile?.botName || 'Ruby Hoshino'
text = chat.byeText.replace(/@user/g, username).replace(/@subject/g, groupName).replace(/\{user\}/g, username).replace(/\{group\}/g, groupName).replace(/\{botName\}/g, botName)
} else {
text = `
︶᮫໋۪۪᷼͡⏝᜔໋〫᷑ׄ♡᜔ׅ𝆬۟┅᮫໋ׅׄ᪲︶᮫᜔ׅᷭ͡⏝᮫᜔〪ׅ〫𝆬⢥ֶ𝆬✿۪۪𝆬֟🍒̷̸᩠〪۪۪〫〫〫ᷭ✿ֶ〫𝆬⡬᮫〪ׅׄ⏝᮫໋〪ׅ〫𝆬ׄ͡︶᜔ׄ┅᮫۪۪᪲

✿ ㅤ ׄㅤ 🪷̸ㅤ ˒˓ㅤ 𓏸̶ ㅤ ׄ   ✿
\`\`\`S A Y O N A R A\`\`\`

ㅤ    *${toFancy("Se ha ido un usuario...")}*

┌͡╼᮫͜  ⟆ ✿̼⃜  ${toFancy("Datos")} ㅤ
┆᮫⌣⃕╼̟ᜒ 👤 ${username}
┆⌣⃕╼̟ᜒ 🍂 ${toFancy("Ha dejado:")}
┆⌣⃕╼̟ᜒ ${groupName}
└͡╼᮫͜ ⌢᜔֔⌣ׄ𝅄⌢ֵ݊⌣֘ ܁ ⌢᜔֔⌣ׄ𝅄⌢ֵ݊⌣֘܁⌢̼ׄ

𖥻    ·  ˖ ࣪  𓈃    ${toFancy("Estado Actual")}    ‧₊˚ ㅤ ☆
꒰꒰ ࣪  ㅤ 𓂃࣪  ✦ ᜔ ໋ㅤㅤ ⏝︶     ֺ  ⪨  𝄖  ֹ
⋮ ꯭͡𖹭꯭͡ ⋮     🥥     ⋮ ꯭͡𖹭꯭͡ ⋮
-        ${groupSize}     —     ${fecha}

︶᮫໋۪۪᷼͡⏝᜔໋〫᷑ׄ♡᜔ׅ𝆬۟┅᮫໋ׅׄ᪲︶᮫᜔ׅᷭ͡⏝᮫᜔〪ׅ〫𝆬⢥ֶ𝆬✿۪۪𝆬֟🍒̷̸᩠〪۪۪〫〫〫ᷭ✿ֶ〫𝆬

> establece un mensaje de despedida con #setbye`.trim()
}
await sendWelcomeMessage(conn, m.chat, targetJid, greetingImage, text, fallbackGreetingImage)
}
} catch (error) {
if (!isForbiddenError(error)) console.error('[welcome] error procesando participante', error);
}
}
}
export default { before, needsParticipants: true }
