import fs from 'fs';
import path from 'path';

const ownerPath = 'src/database/owners.json';

const protectedOwners = [
'18294868853',
'18096758983',
'526671548329'
];

const newsletterJid = '120363335626706839@newsletter';
const newsletterName = '⏤͟͞ू⃪፝͜⁞⟡『 Ruby-Hoshino-Channel 』࿐⟡';

const handler = async (m, { conn, text, args, usedPrefix, command, participants }) => {
try {
if (!fs.existsSync(ownerPath)) {
fs.mkdirSync(path.dirname(ownerPath), { recursive: true });
fs.writeFileSync(ownerPath, JSON.stringify(global.owner, null, 2));
} else {
const savedOwners = JSON.parse(fs.readFileSync(ownerPath));
if (savedOwners.length > global.owner.length) {
global.owner = savedOwners;
}
}

let name;
try {
name = conn.getName(m.sender);
} catch (e) {
name = m.sender;
}

const contextInfo = {
mentionedJid: [m.sender],
isForwarded: true,
forwardingScore: 999,
forwardedNewsletterMessageInfo: {
newsletterJid,
newsletterName,
serverMessageId: -1
}
};

const emojiAdd = '✨';
const emojiDel = '❌';
const noTarget = `${emojiAdd} ⓘ 𝙋𝙤𝙧 𝙛𝙖𝙫𝙤𝙧 𝙢𝙚𝙣𝙘𝙞𝙤𝙣𝙖 𝙤 𝙧𝙚𝙨𝙥𝙤𝙣𝙙𝙚 𝙖𝙡 𝙪𝙨𝙪𝙖𝙧𝙞𝙤 𝙦𝙪𝙚 𝙦𝙪𝙞𝙚𝙧𝙚𝙨 ${command === 'addowner' ? '𝙖𝙣̃𝙖𝙙𝙞𝙧' : '𝙦𝙪𝙞𝙩𝙖𝙧'} 𝙘𝙤𝙢𝙤 𝙤𝙬𝙣𝙚𝙧.`;

let who = m.mentionedJid?.[0]
|| m.quoted?.sender
|| (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

if (!who) return conn.reply(m.chat, noTarget, m, { mentions: [m.sender], contextInfo });

let targetJid = who;
let targetLid = null;

if (m.isGroup) {
const pInfo = participants.find(p => p.id === who || p.lid === who || p.jid === who);
if (pInfo) {
if (pInfo.id) targetJid = pInfo.id;
if (pInfo.lid) targetLid = pInfo.lid;
}
}

const jidNumber = targetJid.replace(/[@:].*$/, '');
const lidNumber = targetLid ? targetLid.replace(/[@:].*$/, '') : null;

let contactName;
try {
contactName = await conn.getName(targetJid);
} catch (e) {
contactName = jidNumber;
}

if (command === 'addowner') {
let added = false;
if (!global.owner.find(o => o[0] === jidNumber)) {
global.owner.push([jidNumber, contactName, true]);
added = true;
}
if (lidNumber && !global.owner.find(o => o[0] === lidNumber)) {
global.owner.push([lidNumber, contactName, true]);
added = true;
}

if (!added) {
return conn.reply(m.chat, `🌸 *${contactName}* 𝙮𝙖 𝙚𝙨 𝙤𝙬𝙣𝙚𝙧, *${name}-chan*~`, m, { contextInfo });
}

fs.writeFileSync(ownerPath, JSON.stringify(global.owner, null, 2));

await conn.reply(
m.chat,
`
『 👤 』𝙉𝙪𝙚𝙫𝙤 𝙪𝙨𝙪𝙖𝙧𝙞𝙤 𝙚𝙣 𝙡𝙖 𝙡𝙞𝙨𝙩𝙖 𝙙𝙚 𝙤𝙬𝙣𝙚𝙧𝙨 ˃ 𖥦 ˂
> *${contactName}*
`.trim(),
m,
{ mentions: [targetJid], contextInfo }
);
}

if (command === 'delowner') {
if (protectedOwners.includes(jidNumber)) {
return conn.reply(
m.chat,
`🚫 ⓘ 𝙉𝙤 𝙚𝙨𝙩𝙖́ 𝙥𝙚𝙧𝙢𝙞𝙩𝙞𝙙𝙤 𝙦𝙪𝙞𝙩𝙖𝙧𝙡𝙚 𝙤𝙬𝙣𝙚𝙧 𝙖 𝙚𝙨𝙖 𝙥𝙚𝙧𝙨𝙤𝙣𝙖, 𝙚𝙨𝙩𝙖́ 𝙥𝙧𝙤𝙩𝙚𝙜𝙞𝙙𝙖.`,
m,
{ contextInfo }
);
}

const initialLength = global.owner.length;
global.owner = global.owner.filter(o => o[0] !== jidNumber && o[0] !== lidNumber);

if (global.owner.length < initialLength) {
fs.writeFileSync(ownerPath, JSON.stringify(global.owner, null, 2));
await conn.reply(
m.chat,
`
╥﹏╥ 𝙀𝙡 𝙪𝙨𝙪𝙖𝙧𝙞𝙤 *${contactName}* 𝙝𝙖 𝙨𝙞𝙙𝙤 𝙧𝙚𝙢𝙤𝙫𝙞𝙙𝙤 𝙙𝙚 𝙡𝙖 𝙡𝙞𝙨𝙩𝙖 𝙙𝙚 𝙤𝙬𝙣𝙚𝙧𝙨
`.trim(),
m,
{ mentions: [targetJid], contextInfo }
);
} else {
await conn.reply(
m.chat,
`${emojiDel} ⓘ 𝙀𝙨𝙚 𝙪𝙨𝙪𝙖𝙧𝙞𝙤 𝙣𝙤 𝙚𝙨𝙩𝙖́ 𝙚𝙣 𝙡𝙖 𝙡𝙞𝙨𝙩𝙖 𝙙𝙚 𝙊𝙬𝙣𝙚𝙧𝙨.`,
m,
{ contextInfo }
);
}
}

} catch (e) {
console.error('Error en el handler:', e);
return conn.reply(m.chat, 'Ocurrió un error inesperado: ' + e, m);
}
};

handler.command = ['addowner', 'delowner'];
handler.rowner = true;
handler.help = ['addowner <@user>', 'delowner <@user>'];
handler.tags = ['owner'];
handler.group = true;

export default handler;