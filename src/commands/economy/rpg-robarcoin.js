import { buildParticipantsByLid, normalizeIdentityJid, resolveTarget, resolveIdentityName } from '../../core/identity-utils.js'
const handler = async (m, { conn, participants = [] }) => {
try {

const participantsByLid = buildParticipantsByLid(participants);
let senderJid = await normalizeIdentityJid(conn, m.sender, participantsByLid) || m.sender;

const user = global.db.getUser(senderJid);

let target = await resolveTarget(m, conn, { participantsByLid, errorMessage: '' })

if (!target) {
await conn.reply(m.chat, `${emoji2} Debes mencionar a alguien para intentar robar.`, m);
return false;
}

let targetJid = await normalizeIdentityJid(conn, target, participantsByLid) || target;
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

const successChance = user.premium ? 0.63 : 0.60;
const maxSteal = Math.max(3500, Math.floor(victimCash * 0.25));
const minSteal = 1200;

if (Math.random() < successChance) {
const amount = Math.min(victimCash, randomInt(minSteal, maxSteal));
targetUser.coin = victimCash - amount;
user.coin = (Number(user.coin) || 0) + amount;

await global.db.updateUser(targetJid, { coin: targetUser.coin });
await global.db.updateUser(senderJid, { coin: user.coin });

return conn.reply(
m.chat,
`🕶️ Robo exitoso a ${targetName}\n💸 Te llevaste *¥${amount.toLocaleString()} ${m.moneda}*`,
m,
{ mentions: [targetJid] },
);
}

const multa = Math.max(500, Math.floor(Math.max(0, Number(user.coin) || 0) * 0.15));
user.coin = (Number(user.coin) || 0) - multa;
const caught = Math.random() < 0.15;
const patch = { coin: user.coin };
if (caught) {
const jailUntil = Date.now() + 30 * 60 * 1000;
user.extras = user.extras && typeof user.extras === 'object' && !Array.isArray(user.extras) ? user.extras : {};
user.extras.jailUntil = jailUntil;
patch.extras = { jailUntil };
}
await global.db.updateUser(senderJid, patch);

return conn.reply(
m.chat,
`🚨 Fallaste el robo a ${targetName} y te multaron.\n💸 Perdiste *¥${multa.toLocaleString()} ${m.moneda}*${caught ? '\n🚔 Te atraparon: estarás preso *30 minutos*.' : ''}`,
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
