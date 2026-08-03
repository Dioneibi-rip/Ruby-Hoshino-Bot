import { normalizeIdentityJid, buildParticipantsByLid } from '../../core/identity-utils.js'
export async function before(m, { conn, participants = [] }) {
if (m.fromMe || m.__afkReturnHandled) return true;
const body = String(m.text || m.body || '').trim();
const isAfkCommand = /^([!#./\\])?afk(?:\s|$)/i.test(body);

const user = global.db.getUser(m.sender);
if (!user) return true;

const clockString = (ms) => {
let h = Math.floor(ms / 3600000);
let m = Math.floor(ms / 60000) % 60;
let s = Math.floor(ms / 1000) % 60;
return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
};

if (user.afk > -1 && !isAfkCommand) {
let timeAfk = clockString(new Date() - user.afk);
let reasonText = user.afkReason ? `\n         🧇̫͠ ꒰  *𝖬𝗈𝗍𝗂𝗏𝗈:* ${user.afkReason}` : '';

let returnText = `> 🍰 𝖣𝖾𝗃𝖺𝗌𝗍𝖾     𝖽𝖾     𝖾𝗌𝗍𝖺𝗋     𝗂𝗇𝖺𝖼𝗍𝗂𝗏𝗈     !

୨ㅤ࣪ㅤ︶︶︶︶ ㅤ꒰ 🎀 ꒱ㅤ︶︶︶︶ㅤ࣪ㅤ୧

🍪̮͡ 〣  *𝖳𝗂𝖾𝗆𝗉𝗈     𝖨𝗇𝖺𝖼𝗍𝗂𝗏𝗈:* ${timeAfk}${reasonText}

> \`𝖡𝗂𝖾𝗇𝗏𝖾𝗇𝗂𝖽𝗈     𝖽𝖾     𝗏𝗎𝖾𝗅𝗍𝖺     ♡\``;

conn.reply(m.chat, returnText, m, { mentions: [m.sender] });
user.afk = -1;
user.afkReason = '';
}

const participantsByLid = buildParticipantsByLid(participants);
const rawJids = [...new Set([...(m.mentionedJid || []), ...(m.quoted ? [m.quoted.sender] : [])])];
const jids = [];
for (const jid of rawJids) jids.push(await normalizeIdentityJid(conn, jid, participantsByLid));

for (const jid of jids) {
if (jid === conn.user.jid) continue;

const mentionedUser = global.db.getUser(jid);
if (!mentionedUser) continue;

const afkTime = mentionedUser.afk;
if (!afkTime || afkTime < 0) continue;

const reason = mentionedUser.afkReason || '𝖲𝗂𝗇     𝖾𝗌𝗉𝖾𝖼𝗂𝖼𝖺𝗋';
let timeAfk = clockString(new Date() - afkTime);

let mentionText = `> 💤 𝖤𝗅     𝗎𝗌𝗎𝖺𝗋𝗂𝗈     𝖾𝗌𝗍𝖺́     𝗂𝗇𝖺𝖼𝗍𝗂𝗏𝗈     ,     𝗇𝗈     𝗅𝗈     𝖾𝗍𝗂𝗊𝗎𝖾𝗍𝖾𝗌     . . .

୨ㅤ࣪ㅤ︶︶︶︶ ㅤ꒰ 🌸 ꒱ㅤ︶︶︶︶ㅤ࣪ㅤ୧

🏩ິࣼᝒ  *𝖴𝗌𝗎𝖺𝗋𝗂𝗈:* @${jid.split('@')[0]}
🍥̶̸̑ 〣  *𝖬𝗈𝗍𝗂𝗏𝗈:* ${reason}
🥛̫̌ യ  *𝖳𝗂𝖾𝗆𝗉𝗈:* ${timeAfk}`;

conn.reply(m.chat, mentionText, m, { mentions: [jid] });
}
return true;
}
