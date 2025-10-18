import fs from 'fs'
import { WAMessageStubType } from '@whiskeysockets/baileys'
const newsletterJid = '120363335626706839@newsletter';
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭';
const packname = '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥';
const iconos = [
'https://qu.ax/kCFBu.jpeg','https://qu.ax/oywhU.jpeg','https://qu.ax/OqruN.jpeg',
'https://qu.ax/EQNsz.jpeg','https://qu.ax/zKJLa.jpeg','https://qu.ax/jSfLz.jpg',
'https://qu.ax/vEYfK.jpg','https://qu.ax/vEYfK.jpg','https://qu.ax/cQVWG.jpg',
'https://qu.ax/aKHwP.jpg','https://qu.ax/jpdRe.jpg','https://qu.ax/DomyS.jpg',
'https://qu.ax/fwbjQ.jpg','https://qu.ax/gqMcL.jpg','https://qu.ax/oYaOd.jpg',
'https://qu.ax/krkFy.jpeg', 
];
const getRandomIcono = () => iconos[Math.floor(Math.random() * iconos.length)];
async function generarBienvenida({ conn, userId, groupMetadata, chat }) {
const username = `@${userId.split('@')[0]}`;
const pp = await conn.profilePictureUrl(userId, 'image').catch(() => 'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745522645448.jpeg');
const fecha = new Date().toLocaleDateString("es-ES", { timeZone: "America/Santo_Domingo", day: 'numeric', month: 'long', year: 'numeric' });
const groupSize = groupMetadata.participants.length;
const desc = groupMetadata.desc?.toString() || 'Sin descripción';
let caption;
if (chat.welcomeText) {
caption = chat.welcomeText
.replace(/@user/g, username)
.replace(/@subject/g, groupMetadata.subject)
.replace(/@desc/g, desc);
} else {
const defaultWelcomeMessage = `¡Hola, @user! 🌸\nTe damos la bienvenida al súper grupo *«@subject»*\n\n「 🌷 」 *Lee la descripción:*\n@desc\n\n¡Esperamos que disfrutes tu estadía! 💖`;
const mensaje = defaultWelcomeMessage
.replace(/@user/g, username)
.replace(/@subject/g, groupMetadata.subject)
.replace(/@desc/g, desc);
caption = `╭─┈「 🌸 𝑩𝑰𝑬𝑵𝑽𝑬𝑵𝑰𝑫𝑨 🌸 」\n│\n│ 🎀  ${mensaje}\n│\n├─┈「 𝐈𝐍𝐅𝐎 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 」\n│\n│ 👥  *Miembros:* ${groupSize}\n│ 📅  *Fecha:* ${fecha}\n│\n╰─┈「 ${packname} 」`;
}
return { pp, caption, mentions: [userId] };
}
async function generarDespedida({ conn, userId, groupMetadata, chat }) {
const username = `@${userId.split('@')[0]}`;
const pp = await conn.profilePictureUrl(userId, 'image').catch(() => 'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745522645448.jpeg');
const fecha = new Date().toLocaleDateString("es-ES", { timeZone: "America/Santo_Domingo", day: 'numeric', month: 'long', year: 'numeric' });
const groupSize = groupMetadata.participants.length;
let caption;
if (chat.byeText) {
caption = chat.byeText
.replace(/@user/g, username)
.replace(/@subject/g, groupMetadata.subject);
} else {
const defaultByeMessage = `¡Adiós, @user! 👋\nTe extrañaremos en *«@subject»*.\n¡Vuelve pronto! ૮₍ ˃ ⤙ ˂ ₎ა`;
const mensaje = defaultByeMessage
.replace(/@user/g, username)
.replace(/@subject/g, groupMetadata.subject);
caption = `╭─┈「 💔 𝑨𝑫𝑰𝑶́𝑺 💔 」\n│\n│ ૮₍ ˃ ⤙ ˂ ₎ა  ${mensaje}\n│\n├─┈「 𝐈𝐍𝐅𝐎 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 」\n│\n│ 👥  *Miembros:* ${groupSize}\n│ 📅  *Fecha:* ${fecha}\n│\n╰─┈「 ${packname} 」`;
}
return { pp, caption, mentions: [userId] };
}
let handler = m => m
handler.before = async function (m, { conn, participants, groupMetadata }) {
if (!m.messageStubType || !m.isGroup) return !0
const chat = global.db.data.chats[m.chat]
if (!chat) return !0;
const primaryBot = chat.primaryBot
if (primaryBot && conn.user.jid !== primaryBot) return !0
const userId = m.messageStubParameters[0]
if (chat.welcome && m.messageStubType == WAMessageStubType.GROUP_PARTICIPANT_ADD) {
const { pp, caption, mentions } = await generarBienvenida({ conn, userId, groupMetadata, chat })
const contextInfo = {
mentionedJid: mentions,
isForwarded: true,
forwardingScore: 999,
forwardedNewsletterMessageInfo: {
newsletterJid,
newsletterName,
serverMessageId: -1
},
externalAdReply: {
title: packname,
body: 'I🎀 𓈒꒰ 𝐘𝐚𝐲~ 𝐁𝐢𝐞𝐧𝐯𝐞𝐧𝐢𝐝@! (≧∇≦)/',
thumbnailUrl: getRandomIcono(),
sourceUrl: global.redes,
mediaType: 1,
renderLargerThumbnail: false
}
};
await conn.sendMessage(m.chat, { image: { url: pp }, caption, contextInfo }, { quoted: null })
}
if (chat.welcome && (m.messageStubType == WAMessageStubType.GROUP_PARTICIPANT_REMOVE || m.messageStubType == WAMessageStubType.GROUP_PARTICIPANT_LEAVE)) {
const { pp, caption, mentions } = await generarDespedida({ conn, userId, groupMetadata, chat })
const contextInfo = {
mentionedJid: mentions,
isForwarded: true,
forwardingScore: 999,
forwardedNewsletterMessageInfo: {
newsletterJid,
newsletterName,
serverMessageId: -1
},
externalAdReply: {
title: packname,
body: 'I🎀 𓈒꒰ 𝐒𝐚𝐲𝐨̄𝐧𝐚𝐫𝐚... (TωT)/',
thumbnailUrl: getRandomIcono(),
sourceUrl: global.redes,
mediaType: 1,
renderLargerThumbnail: false
}
};
await conn.sendMessage(m.chat, { image: { url: pp }, caption, contextInfo }, { quoted: null })
}
}
export { generarBienvenida, generarDespedida }
export default handler