let handler = async (m, { conn, text, command, participants }) => {
let who;
if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
if (!who) {
if (!text) who = m.sender;
else who = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
}

let jid = who;
if (who.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === who);
if (pInfo && pInfo.id) jid = pInfo.id;
}

if (!global.db.data.users[jid]) {
global.db.data.users[jid] = { coin: 0, exp: 0, level: 0 };
}

let users = global.db.data.users;

if (/^chetar$/i.test(command)) {
users[jid].coin = Number.MAX_SAFE_INTEGER;
users[jid].exp = Number.MAX_SAFE_INTEGER;
users[jid].level = Number.MAX_SAFE_INTEGER;

let response = `⏤͟͟͞͞◯⃞👑 𝘾𝙃𝙀𝙏𝘼𝘿𝙊 ⏤͟͟͞͞◯⃞

『 👤 』⋮⋮ 𝙐𝙨𝙪𝙖𝙧𝙞𝙤: @${jid.split('@')[0]}
『 💸 』⋮⋮ ${m.moneda}: *${users[jid].coin.toLocaleString()}*
『 ✨ 』⋮⋮ 𝙀𝙭𝙥: *${users[jid].exp.toLocaleString()}*
『 🌟 』⋮⋮ 𝙉𝙞𝙫𝙚𝙡: *${users[jid].level.toLocaleString()}*

ׄ   ۪ ⏝︶ ׄ  ୨💎୧  ׄ ︶⏝ ۪    ׄ`.trim();

await m.reply(response, null, { mentions: [jid] });

} else if (/^deschetar$/i.test(command)) {

if (!users[jid]) throw `❌ El usuario no tiene datos para deschetarse.`;

users[jid].coin = 0;
users[jid].exp = 0;
users[jid].level = 0;

let response = `⏤͟͟͞͞◯⃞♻️ 𝘿𝙀𝙎𝘾𝙃𝙀𝙏𝘼𝘿𝙊 ⏤͟͟͞͞◯⃞

『 👤 』⋮⋮ 𝙐𝙨𝙪𝙖𝙧𝙞𝙤: @${jid.split('@')[0]}
『 💸 』⋮⋮ ${m.moneda}: *0*
『 ✨ 』⋮⋮ 𝙀𝙭𝙥: *0*
『 🌟 』⋮⋮ 𝙉𝙞𝙫𝙚𝙡: *0*

ׄ   ۪ ⏝︶ ׄ  ୨🗑️୧  ׄ ︶⏝ ۪    ׄ`.trim();

await m.reply(response, null, { mentions: [jid] });
}
};

handler.help = ['chetar *@user*', 'deschetar *@user*'];
handler.tags = ['owner'];
handler.command = ['chetar', 'deschetar'];
handler.register = true;
handler.rowner = true;

export default handler;
