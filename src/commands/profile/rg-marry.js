import { buildParticipantsByLid, normalizeIdentityJid, resolveIdentityName } from '../../core/identity-utils.js'
let proposals = {};

async function loadMarriages() {
return global.db?.getSection?.('marriages') || {};
}

function isUserMarried(marriages, user) {
return Boolean(global.db.getUser(user)?.marry || marriages[user]?.partner);
}

function getPartner(marriages, user) {
return global.db.getUser(user)?.marry || marriages[user]?.partner || '';
}

const handler = async (m, { conn, command, participants = [], usedPrefix }) => {
const participantsByLid = buildParticipantsByLid(participants);
const normalizeToJid = (rawJid) => normalizeIdentityJid(conn, rawJid, participantsByLid);
const identityName = (jid) => resolveIdentityName(conn, jid, { participantsByLid, fallback: `@${String(jid).split('@')[0]}` });

const isPropose = /^marry$/i.test(command);
const isDivorce = /^divorce$/i.test(command);
const marriages = await loadMarriages();

try {
let proposerJid = await normalizeToJid(m.sender);
global.db.getUser(proposerJid);

if (isPropose) {
const rawProposee = m.quoted?.sender || m.mentionedJid?.[0];

if (!rawProposee) {
if (isUserMarried(marriages, proposerJid)) {
let partner = getPartner(marriages, proposerJid);
let partnerName = await identityName(partner);
return await conn.reply(m.chat, `《✧》 Ya estás casado con *${partnerName}*\n> Puedes divorciarte con el comando: *${usedPrefix}divorce*`, m);
} else {
throw new Error(`Debes mencionar a alguien para proponer o aceptar matrimonio.\n> Ejemplo » *${usedPrefix + command} @Usuario*`);
}
}

let proposeeJid = await normalizeToJid(rawProposee);
global.db.getUser(proposeeJid);

if (isUserMarried(marriages, proposerJid)) {
let partner = getPartner(marriages, proposerJid);
throw new Error(`Ya estás casado con ${await identityName(partner)}.`);
}
if (isUserMarried(marriages, proposeeJid)) {
throw new Error(`${await identityName(proposeeJid)} ya está casado(a).`);
}
if (proposerJid === proposeeJid) throw new Error('¡No puedes proponerte matrimonio a ti mismo!');

if (proposals[proposeeJid] === proposerJid) {
delete proposals[proposeeJid];

const fecha = Date.now();
if (typeof global.db.setMarriagePair === 'function') {
await global.db.setMarriagePair(proposerJid, proposeeJid, fecha);
} else {
let user1 = global.db.getUser(proposerJid);
let user2 = global.db.getUser(proposeeJid);
if (user1) user1.marry = proposeeJid;
if (user2) user2.marry = proposerJid;
}
await global.db.write?.();

let proposerName = await identityName(proposerJid);
let proposeeName = await identityName(proposeeJid);

return await conn.sendMessage(m.chat, {
text: `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩\n\n¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧\n\n*•.¸♡ Esposo(a):* ${proposeeName}\n*•.¸♡ Esposo(a):* ${proposerName}\n\n\`Disfruten de su luna de miel\`\n\n✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`,
mentions: [proposerJid, proposeeJid]
}, { quoted: m });

} else {
proposals[proposerJid] = proposeeJid;

let proposerName = await identityName(proposerJid);
let proposeeName = await identityName(proposeeJid);

setTimeout(() => {
if (proposals[proposerJid] === proposeeJid) {
delete proposals[proposerJid];
conn.sendMessage(m.chat, { text: `*《✧》Se acabó el tiempo. La propuesta de matrimonio de @${proposerJid.split('@')[0]} fue cancelada.*`, mentions: [proposerJid] });
}
}, 120000);

return await conn.sendMessage(m.chat, {
text: `♡ ${proposeeName}, el usuario ${proposerName} te ha enviado una propuesta de matrimonio. ¿Aceptas? •(=^●ω●^=)•\n\n⚘ *Responde con:*\n> ● *_${usedPrefix + command} @${proposerJid.split('@')[0]}_* para confirmar.\n> ● La propuesta expirará en 2 minutos.`,
mentions: [proposerJid, proposeeJid]
}, { quoted: m });
}

} else if (isDivorce) {
if (!isUserMarried(marriages, proposerJid)) throw new Error('No estás casado con nadie.');
let partner = getPartner(marriages, proposerJid);

if (typeof global.db.divorcePair === 'function') {
await global.db.divorcePair(proposerJid);
} else {
let userDb = global.db.getUser(proposerJid);
let partnerDb = global.db.getUser(partner);
if (userDb) delete userDb.marry;
if (partnerDb) delete partnerDb.marry;
}
await global.db.write?.();

const proposerName = await identityName(proposerJid);
const partnerName = await identityName(partner);
await conn.reply(m.chat, `✐ ${proposerName} y ${partnerName} se han divorciado.`, m, { mentions: [proposerJid, partner] });
}
} catch (error) {
await conn.reply(m.chat, `《✧》 ${error.message}`, m, { mentions: m.mentionedJid || [] });
return false;
}
};

handler.tags = ['fun'];
handler.help = ['marry *@usuario*', 'divorce'];
handler.command = ['marry', 'divorce'];
handler.group = true;

export default handler;