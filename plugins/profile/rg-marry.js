global.proposalsMarry = global.proposalsMarry || {};
const CONFIRMATION_TTL_MS = 60000;

async function loadMarriages() {
return global.db?.getSection?.('marriages') || {};
}

function isUserMarried(marriages, user) {
return Boolean(global.db.getUser(user)?.marry || marriages[user]?.partner);
}

function getPartner(marriages, user) {
return global.db.getUser(user)?.marry || marriages[user]?.partner || '';
}

const handler = async (m, { conn, command, participants, usedPrefix }) => {
const groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(() => null) : null;
const participantsList = groupMetadata?.participants || participants || [];

const normalizeToJid = (rawJid) => {
if (!rawJid || typeof rawJid !== 'string') return rawJid;
if (!rawJid.endsWith('@lid')) return rawJid;
const pInfo = participantsList?.find(p => p?.lid === rawJid);
return pInfo?.id || rawJid;
};

const isPropose = /^marry$/i.test(command);
const isDivorce = /^divorce$/i.test(command);
const marriages = await loadMarriages();

try {
let proposerJid = normalizeToJid(m.sender);
global.db.getUser(proposerJid);

if (isPropose) {
const rawProposee = m.quoted?.sender || m.mentionedJid?.[0];

if (!rawProposee) {
if (isUserMarried(marriages, proposerJid)) {
let partner = getPartner(marriages, proposerJid);
let partnerName = conn.getName(partner) || `@${partner.split('@')[0]}`;
return await conn.reply(m.chat, `《✧》 Ya estás casado con *${partnerName}*\n> Puedes divorciarte con el comando: *${usedPrefix}divorce*`, m);
} else {
throw new Error(`Debes mencionar a alguien para proponer matrimonio.\n> Ejemplo » *${usedPrefix + command} @Usuario*`);
}
}

let proposeeJid = normalizeToJid(rawProposee);
global.db.getUser(proposeeJid);

if (isUserMarried(marriages, proposerJid)) {
let partner = getPartner(marriages, proposerJid);
throw new Error(`Ya estás casado con @${partner.split('@')[0]}.`);
}
if (isUserMarried(marriages, proposeeJid)) {
throw new Error(`@${proposeeJid.split('@')[0]} ya está casado(a).`);
}
if (proposerJid === proposeeJid) throw new Error('¡No puedes proponerte matrimonio a ti mismo!');

let proposerName = conn.getName(proposerJid) || `@${proposerJid.split('@')[0]}`;
let proposeeName = conn.getName(proposeeJid) || `@${proposeeJid.split('@')[0]}`;

const key = `${m.chat}:${proposeeJid}`;
if (global.proposalsMarry[key]) clearTimeout(global.proposalsMarry[key].timeout);

global.proposalsMarry[key] = {
proposer: proposerJid,
proposee: proposeeJid,
timeout: setTimeout(async () => {
if (global.proposalsMarry[key]) {
delete global.proposalsMarry[key];
await conn.sendMessage(m.chat, { text: '*《✧》Se acabó el tiempo, no se obtuvo respuesta. La propuesta de matrimonio fue cancelada.*' });
}
}, CONFIRMATION_TTL_MS)
};

const confirmationMessage = `♡ ${proposerName} te ha propuesto matrimonio. ${proposeeName} ¿aceptas? •(=^●ω●^=)•\n\n*Debes Responder con:*\n> ✐ "Si" » para aceptar\n> ✐ "No" » para rechazar.`;
return await conn.reply(m.chat, confirmationMessage, m, { mentions: [proposeeJid, proposerJid] });

} else if (isDivorce) {
if (!isUserMarried(marriages, proposerJid)) throw new Error('No estás casado con nadie.');
let partner = getPartner(marriages, proposerJid);
if (typeof global.db.divorcePair === 'function') {
partner = global.db.divorcePair(proposerJid);
} else {
let userDb = global.db.getUser(proposerJid);
let partnerDb = global.db.getUser(partner);
if (userDb) delete userDb.marry;
if (partnerDb) delete partnerDb.marry;
}
await global.db.write?.();
await conn.reply(m.chat, `✐ ${conn.getName(proposerJid)} y ${conn.getName(partner)} se han divorciado.`, m, { mentions: [proposerJid, partner] });
}
} catch (error) {
await conn.reply(m.chat, `《✧》 ${error.message}`, m, { mentions: m.mentionedJid || [] });
return false;
}
};

handler.before = async function (m, { conn, participants }) {
if (m.isBaileys) return;

const groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(() => null) : null;
const participantsList = groupMetadata?.participants || participants || [];

const normalizeToJid = (rawJid) => {
if (!rawJid || typeof rawJid !== 'string') return rawJid;
if (!rawJid.endsWith('@lid')) return rawJid;
const pInfo = participantsList?.find(p => p?.lid === rawJid);
return pInfo?.id || rawJid;
};

let senderJid = normalizeToJid(m.sender);
const key = `${m.chat}:${senderJid}`;

if (!global.proposalsMarry[key]) return;

const responseText = (m.text || '').trim().toLowerCase();
if (!responseText) return;

if (/^[#\.\/!]?(no|rechazar)$/i.test(responseText)) {
if (global.proposalsMarry[key].timeout) clearTimeout(global.proposalsMarry[key].timeout);
delete global.proposalsMarry[key];
return conn.sendMessage(m.chat, { text: '*《✧》Han rechazado tu propuesta de matrimonio.*' }, { quoted: m });
}

if (/^[#\.\/!]?(si|s[íi]|yes|acepto)$/i.test(responseText)) {
const data = global.proposalsMarry[key];
if (data.timeout) clearTimeout(data.timeout);
delete global.proposalsMarry[key];

const { proposer } = data;
const marriages = await loadMarriages();

if (isUserMarried(marriages, proposer) || isUserMarried(marriages, senderJid)) {
return conn.sendMessage(m.chat, { text: '*《✧》La propuesta ya no es válida porque una de las personas ya está casada.*' }, { quoted: m });
}

const fecha = Date.now();
if (typeof global.db.setMarriagePair === 'function') {
global.db.setMarriagePair(proposer, senderJid, fecha);
} else {
let user1 = global.db.getUser(proposer);
let user2 = global.db.getUser(senderJid);
if (user1) user1.marry = senderJid;
if (user2) user2.marry = proposer;
}
await global.db.write?.();

let proposerName = conn.getName(proposer);
let senderName = conn.getName(senderJid);

await conn.sendMessage(m.chat, {
text: `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩\n\n¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧\n\n*•.¸♡ Esposo(a):* ${proposerName}\n*•.¸♡ Esposo(a):* ${senderName}\n\n\`Disfruten de su luna de miel\`\n\n✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩\n`,
mentions: [proposer, senderJid]
}, { quoted: m });
return true;
}
};

handler.tags = ['fun'];
handler.help = ['marry *@usuario*', 'divorce'];
handler.command = ['marry', 'divorce'];
handler.group = true;

export default handler;