import { buildParticipantsByLid, normalizeIdentityJid, resolveTarget, resolveIdentityName } from '../../core/identity-utils.js'
const handler = async (m, { conn, participants = [] }) => {
try {

const participantsByLid = buildParticipantsByLid(participants);
let senderJid = await normalizeIdentityJid(conn, m.sender, participantsByLid);

const user = global.db.getUser(senderJid);

let target = await resolveTarget(m, conn, { participantsByLid, errorMessage: '' })

if (!target) {
await conn.reply(m.chat, `${emoji2} Debes mencionar a alguien para intentar robar.`, m);
return false;
}

let targetJid = await normalizeIdentityJid(conn, target, participantsByLid);
const targetName = await resolveIdentityName(conn, targetJid, { participantsByLid, fallback: `@${String(targetJid).split('@')[0]}` });

if (targetJid === senderJid) {
await conn.reply(m.chat, `${emoji2} No puedes robarte a ti mismo.`, m);
return false;
}

const targetUser = global.db.getUser(targetJid);

const minVictimCash = 2500;
const victimCash = Number(targetUser.coin) || 0;
if (victimCash < minVictimCash) {
await conn.reply(m.chat, `${emoji2} ${targetName} no tiene efectivo suficiente (mínimo ${minVictimCash.toLocaleString()} ${m.moneda}).`, m, { mentions: [targetJid] });
return false;
}

const successChance = user.premium ? 0.47 : 0.40;
const maxSteal = Math.max(1200, Math.floor(victimCash * 0.12));
const minSteal = 600;

if (Math.random() < successChance) {
const amount = Math.min(victimCash, randomInt(minSteal, maxSteal));
targetUser.coin = victimCash - amount;
user.coin = (Number(user.coin) || 0) + amount;

return conn.reply(
m.chat,
`🕶️ Robo exitoso a ${targetName}\n💸 Te llevaste *¥${amount.toLocaleString()} ${m.moneda}*`,
m,
{ mentions: [targetJid] },
);
}

const multa = Math.max(300, Math.floor(Math.abs(Number(user.coin) || 0) * 0.05));
user.coin = Math.max(0, (Number(user.coin) || 0) - multa);

return conn.reply(
m.chat,
`🚨 Fallaste el robo a ${targetName} y te multaron.\n💸 Perdiste *¥${multa.toLocaleString()} ${m.moneda}*`,
m,
{ mentions: [targetJid] },
);
} catch (err) {
console.error('Error en comando rob:', err);
await conn.reply(m.chat, `${emoji2} Ocurrió un error al ejecutar el robo.`, m);
return false;
}
};

handler.help = ['rob'];
handler.tags = ['rpg'];
handler.command = ['robar', 'steal', 'rob'];
handler.group = true;
handler.register = true;
handler.cooldown = 7200000;

handler.cooldownMessage = (seconds, time, hms) => `${emoji3} Debes esperar *${hms}* para volver a robar.`;

export default handler;

function randomInt(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}
