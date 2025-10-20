import fs from 'fs'
import { WAMessageStubType } from '@whiskeysockets/baileys'

const newsletterJid = '120363335626706839@newsletter';
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭';
const packname = '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥';

const iconos = [
'https://qu.ax/wwbar.jpg',
'https://qu.ax/iFzQw.jpeg',
'https://qu.ax/dsZyo.jpeg',
'https://qu.ax/eNdBB.jpeg',
'https://qu.ax/MSzGw.jpeg',
'https://qu.ax/JqMBW.jpeg',
'https://qu.ax/HKcSr.jpeg',
'https://qu.ax/HOuUU.jpeg',
'https://qu.ax/ojUNn.jpeg',
'https://qu.ax/HtqBi.jpeg',
'https://qu.ax/bmQOA.jpeg',
'https://qu.ax/nTFtU.jpeg',
'https://qu.ax/PYKgC.jpeg',
'https://qu.ax/exeBy.jpeg',
'https://qu.ax/SCxhf.jpeg',
'https://qu.ax/sqxSO.jpeg',
'https://qu.ax/cdSYJ.jpeg',
'https://qu.ax/dRmZY.jpeg',
'https://qu.ax/ubwLP.jpg',
'https://qu.ax/JSgSc.jpg',
'https://qu.ax/FUXJo.jpg',
'https://qu.ax/qhKUf.jpg',
'https://qu.ax/mZKgt.jpg'
];

const getRandomIcono = () => iconos[Math.floor(Math.random() * iconos.length)];

async function generarBienvenida({ conn, userId, groupMetadata, chat }) {
const username = `@${userId.split('@')[0]}`;
const pp = await conn.profilePictureUrl(userId, 'image').catch(() => 'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745522645448.jpeg');
const fecha = new Date().toLocaleDateString("es-ES", { timeZone: "America/Santo_Domingo", day: 'numeric', month: 'long', year: 'numeric' });
const groupSize = groupMetadata.participants.length + 1; 
const desc = groupMetadata.desc?.toString() || 'Sin descripción';

let caption;
if (chat.welcomeText) {
caption = chat.welcomeText
.replace(/@user/g, username)
.replace(/@subject/g, groupMetadata.subject)
.replace(/@desc/g, desc);
} else {
const defaultWelcomeMessage = `｡ﾟﾟ･｡･ﾟﾟ｡
ﾟ。      ｡ﾟ
　ﾟ･｡･ﾟ
︵ ⊹ ︵ ⊹ ︵ ⊹ ︵ ⊹ ︵ ⊹ ︵ ⊹ ︵
╭──*·˚ 🪷 𝐍𝐔𝐄𝐕𝐎 𝐔𝐒𝐔𝐀𝐑𝐈𝐎 🪷 ˚·*──╮

 ¡𝙃𝙤𝙡𝙖, @user! ૮(ˊ ᵔ ˋ)ა
 Bienvenid@ a la familia de:
 *@subject*

 𝙀𝙨𝙥𝙚𝙧𝙖𝙢𝙤𝙨 𝙦𝙪𝙚 𝙩𝙪 𝙚𝙨𝙩𝙖𝙙𝙞𝙖
 𝙨𝙚𝙖 𝙢𝙖𝙧𝙖𝙫𝙞𝙡𝙡𝙤𝙨𝙖.

· · • • • ✿ • • • · ·
「 𝐈𝐍𝐅𝐎 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 」
🍡 𝐌𝐢𝐞𝐦𝐛𝐫𝐨𝐬: ${groupSize}
📅 𝐅𝐞𝐜𝐡𝐚: ${fecha}
📄 𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐜𝐢𝐨́𝐧: 
${desc}
· · • • • ✿ • • • · ·

> 𝙿𝚞𝚎𝚍𝚎𝚜 𝚙𝚎𝚛𝚜𝚘𝚗𝚊𝚕𝚒𝚣𝚊𝚛 𝚎𝚜𝚝𝚎 𝚖𝚎𝚗𝚜𝚊𝚓𝚎
> 𝚞𝚜𝚊𝚗𝚍𝚘: *#setwelcome*

╰──*·˚ 🍥 ˚·*──────────╯`;

caption = defaultWelcomeMessage
.replace(/@user/g, username)
.replace(/@subject/g, groupMetadata.subject);
}
return { pp, caption, mentions: [userId] };
}

async function generarDespedida({ conn, userId, groupMetadata, chat }) {
const username = `@${userId.split('@')[0]}`;
const pp = await conn.profilePictureUrl(userId, 'image').catch(() => 'https://raw.githubusercontent.com/The-King-Destroy/Adiciones/main/Contenido/1745522645448.jpeg');
const fecha = new Date().toLocaleDateString("es-ES", { timeZone: "America/Santo_Domingo", day: 'numeric', month: 'long', year: 'numeric' });
const groupSize = groupMetadata.participants.length - 1;

let caption;
if (chat.byeText) {
caption = chat.byeText
.replace(/@user/g, username)
.replace(/@subject/g, groupMetadata.subject);
} else {
const defaultByeMessage = `｡ﾟﾟ･｡･ﾟﾟ｡
ﾟ。      ｡ﾟ
　ﾟ･｡･ﾟ
︵ ⊹ ︵ ⊹ ︵ ⊹ ︵ ⊹ ︵ ⊹ ︵ ⊹ ︵
╭──*·˚ 💔 𝐔𝐍𝐀 𝐃𝐄𝐒𝐏𝐄𝐃𝐈𝐃𝐀 💔 ˚·*──╮

 𝙎𝙖𝙮𝙤𝙣𝙖𝙧𝙖, @user (TωT)/~~~
 Ha dejado el grupo:
 *@subject*

 𝙀𝙨𝙥𝙚𝙧𝙖𝙢𝙤𝙨 𝙦𝙪𝙚 𝙝𝙖𝙮𝙖𝙨 𝙙𝙞𝙨𝙛𝙧𝙪𝙩𝙖𝙙𝙤
 𝙩𝙪 𝙩𝙞𝙚𝙢𝙥𝙤 𝙘𝙤𝙣 𝙣𝙤𝙨𝙤𝙩𝙧𝙤𝙨.

· · • • • ✿ • • • · ·
 「 𝐄𝐒𝐓𝐀𝐃𝐎 𝐀𝐂𝐓𝐔𝐀𝐋 」
 📉 𝐌𝐢𝐞𝐦𝐛𝐫𝐨𝐬: ${groupSize}
 📅 𝐅𝐞𝐜𝐡𝐚: ${fecha}
· · • • • ✿ • • • · ·

> 𝙿𝚞𝚎𝚍𝚎𝚜 𝚙𝚎𝚛𝚜𝚘𝚗𝚊𝚕𝚒𝚣𝚊𝚛 𝚎𝚜𝚝𝚎 𝚖𝚎𝚗𝚜𝚊𝚓𝚎
> 𝚞𝚜𝚊𝚗𝚍𝚘: *#setbye*

╰──*·˚ 🥀 ˚·*──────────╯`;

caption = defaultByeMessage
.replace(/@user/g, username)
.replace(/@subject/g, groupMetadata.subject);
}
return { pp, caption, mentions: [userId] };
}

let handler = m => m

handler.before = async function (m, { conn, participants, groupMetadata }) {
if (!m.messageStubType || !m.isGroup) return !0

const chat = global.db.data.chats[m.chat]
if (!chat) return !0;

const primaryBot = chat.botPrimario
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