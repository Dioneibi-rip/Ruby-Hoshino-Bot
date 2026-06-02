import { WAMessageStubType } from '@whiskeysockets/baileys'
const newsletterJid = '120363335626706839@newsletter';
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭';
const toFancy = (str) => {
const map = {'a':'ᥲ','b':'ᑲ','c':'ᥴ','d':'ᑯ','e':'ᥱ','f':'𝖿','g':'g','h':'һ','i':'і','j':'j','k':'k','l':'ᥣ','m':'m','n':'ᥒ','o':'᥆','p':'⍴','q':'q','r':'r','s':'s','t':'𝗍','u':'ᥙ','v':'᥎','w':'ɯ','x':'x','y':'ᥡ','z':'z','A':'A','B':'B','C':'C','D':'D','E':'E','F':'F','G':'G','H':'H','I':'I','J':'J','K':'K','L':'L','M':'M','N':'N','O':'O','P':'P','Q':'Q','R':'R','S':'S','T':'T','U':'U','V':'V','W':'W','X':'X','Y':'Y','Z':'Z'}
return str.split('').map(c => map[c] || c).join('')
}
export async function before(m, { conn, participants, groupMetadata }) {
if (!m.messageStubType || !m.isGroup) return true
const chat = global.db.data.chats[m.chat]
if (!chat || !chat.welcome) return true
const botJid = conn.user.jid.split('@')[0]
const primaryBot = chat.botPrimario ? chat.botPrimario.split('@')[0] : null
if (primaryBot && botJid !== primaryBot) return true
const isWelcome = [
WAMessageStubType.GROUP_PARTICIPANT_ADD,
WAMessageStubType.GROUP_PARTICIPANT_INVITE,
27, 31, 32
].includes(m.messageStubType)
const isBye = [
WAMessageStubType.GROUP_PARTICIPANT_REMOVE,
WAMessageStubType.GROUP_PARTICIPANT_LEAVE,
28, 33
].includes(m.messageStubType)
if (!isWelcome && !isBye) return true
let usuariosAfectados = m.messageStubParameters && m.messageStubParameters.length > 0 ? m.messageStubParameters : [m.sender]
for (let userId of usuariosAfectados) {
if (!userId) continue;
let targetJid = userId;
if (typeof userId === 'string' && userId.startsWith('{')) {
try {
const parsed = JSON.parse(userId);
targetJid = parsed.phoneNumber || parsed.id || userId;
} catch (e) {}
} else if (typeof userId === 'object' && userId !== null) {
targetJid = userId.phoneNumber || userId.id || userId;
}
try {
const pp = await conn.profilePictureUrl(targetJid, 'image').catch(() => 'https://i.pinimg.com/736x/40/5a/17/405a170d05df4de50e01e8c5cd2a7250.jpg')
const username = `@${targetJid.split('@')[0]}`
const groupName = groupMetadata.subject || 'este grupo'
const desc = groupMetadata.desc?.toString() || 'Sin descripción'
const groupSize = groupMetadata.participants.length
const fecha = new Date().toLocaleDateString("es-ES", { timeZone: "America/Santo_Domingo", day: 'numeric', month: 'long', year: 'numeric' })
if (isWelcome) {
let text
if (chat.welcomeText) {
text = chat.welcomeText.replace(/@user/g, username).replace(/@subject/g, groupName).replace(/@desc/g, desc)
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
await conn.sendMessage(m.chat, {
image: { url: pp },
caption: text,
contextInfo: {
mentionedJid: [targetJid],
isForwarded: true,
forwardingScore: 9999999,
forwardedNewsletterMessageInfo: { newsletterJid: newsletterJid, newsletterName: newsletterName, serverMessageId: -1 }}
}, { quoted: null })
}
if (isBye) {
let text
if (chat.byeText) {
text = chat.byeText.replace(/@user/g, username).replace(/@subject/g, groupName)
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
await conn.sendMessage(m.chat, {
image: { url: pp },
caption: text,
contextInfo: {
mentionedJid: [targetJid],
isForwarded: true,
forwardingScore: 9999999,
forwardedNewsletterMessageInfo: { newsletterJid: newsletterJid, newsletterName: newsletterName, serverMessageId: -1 }}
}, { quoted: null })
}
} catch (error) {
console.error(`[WELCOME] Error al intentar enviar bienvenida/despedida a ${targetJid}:`, error.message);
}
}
}
export default { before }
