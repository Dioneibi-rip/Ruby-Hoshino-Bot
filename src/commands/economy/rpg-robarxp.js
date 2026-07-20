import { resolveTarget, resolveIdentityName } from '../../core/identity-utils.js'
const ro = 3000;

const handler = async (m, { conn, usedPrefix, command }) => {
const user = global.db.getUser(m.sender);

let who = await resolveTarget(m, conn, { errorMessage: '' })

if (!who) {
await conn.reply(m.chat, `${emoji} Debes mencionar a alguien para intentar robarle XP.`, m);
return false;
}

global.db.getUser(who);

if (who === m.sender) {
await conn.reply(m.chat, `${emoji2} *No puedes robarte a ti mismo.*`, m);
return false;
}

const targetName = await resolveIdentityName(conn, who, { fallback: `@${String(who).split('@')[0]}` });
const target = global.db.getUser(who);
target.exp = Number.isFinite(target.exp) ? Math.max(0, target.exp) : 0;
user.exp = Number.isFinite(user.exp) ? user.exp : 0;

const rob = Math.floor(Math.random() * (ro - 200 + 1)) + 200;

if (target.exp < 200) {
await conn.reply(m.chat, `${emoji2} ${targetName} no tiene al menos *200 XP* como para que valga la pena robar.`, m, { mentions: [who] });
return false;
}

const finalRob = Math.min(rob, target.exp);

user.exp += finalRob;
target.exp -= finalRob;

await conn.reply(m.chat, `${emoji} Le robaste *${finalRob} XP* a ${targetName}`, m, { mentions: [who] });
};

handler.help = ['robxp'];
handler.tags = ['economy'];
handler.command = ['robxp', 'robarxp'];
handler.group = true;
handler.register = true;
handler.cooldown = 7200000;

handler.cooldownMessage = (seconds, time, hms) => `${emoji3} Debes esperar ${hms} para usar *#robxp* de nuevo.`;

export default handler;
