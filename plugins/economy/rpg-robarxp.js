const ro = 3000;

const handler = async (m, { conn, usedPrefix, command }) => {
const user = global.db.getUser(m.sender);

let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.sender

if (!who) {
return conn.reply(m.chat, `${emoji} Debes mencionar a alguien para intentar robarle XP.`, m);
}

global.db.getUser(who);

if (who === m.sender) {
return conn.reply(m.chat, `${emoji2} *No puedes robarte a ti mismo.*`, m);
}

const target = global.db.getUser(who);
target.exp = Number.isFinite(target.exp) ? Math.max(0, target.exp) : 0;
user.exp = Number.isFinite(user.exp) ? user.exp : 0;

const rob = Math.floor(Math.random() * (ro - 200 + 1)) + 200;

if (target.exp < 200) {
return conn.reply(m.chat, `${emoji2} @${who.split('@')[0]} no tiene al menos *200 XP* como para que valga la pena robar.`, m, { mentions: [who] });
}

const finalRob = Math.min(rob, target.exp);

user.exp += finalRob;
target.exp -= finalRob;

await conn.reply(m.chat, `${emoji} Le robaste *${finalRob} XP* a @${who.split('@')[0]}`, m, { mentions: [who] });
};

handler.help = ['robxp'];
handler.tags = ['economy'];
handler.command = ['robxp', 'robarxp'];
handler.group = true;
handler.register = true;
handler.cooldown = 7200000;

export default handler;
