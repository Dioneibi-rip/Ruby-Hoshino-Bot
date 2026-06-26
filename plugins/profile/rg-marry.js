const CONFIRMATION_TTL_MS = 60_000
const confirmaciones = globalThis.confirmacionesMarry || new Map()
globalThis.confirmacionesMarry = confirmaciones

function setConfirmation(key, payload) {
const previous = confirmaciones.get(key)
if (previous?.timeout) clearTimeout(previous.timeout)
const timeout = setTimeout(() => confirmaciones.delete(key), CONFIRMATION_TTL_MS)
timeout.unref?.()
confirmaciones.set(key, { ...payload, timeout })
}

function takeConfirmation(key) {
const data = confirmaciones.get(key)
if (!data) return null
if (data.timeout) clearTimeout(data.timeout)
confirmaciones.delete(key)
return data
}

let handler = async (m, { conn, command, participants }) => {
const normalizeToJid = (rawJid) => {
if (!rawJid || typeof rawJid !== 'string') return rawJid;
if (!rawJid.endsWith('@lid')) return rawJid;
const pInfo = participants.find(p => p?.lid === rawJid);
return pInfo?.id || rawJid;
};

let senderJid = normalizeToJid(m.sender);
const isPropose = /^marry$/i.test(command);
const isDivorce = /^divorce$/i.test(command);
const marriages = await (global.db?.getSection?.('marriages') || {});

const isUserMarried = (user) => Boolean(global.db.getUser(user)?.marry || marriages[user]?.partner);
const getPartner = (user) => global.db.getUser(user)?.marry || marriages[user]?.partner || '';

if (isPropose) {
const rawProposee = m.quoted?.sender || m.mentionedJid?.[0];

if (!rawProposee) {
if (isUserMarried(senderJid)) {
let partner = getPartner(senderJid);
let partnerName = conn.getName(partner) || `@${partner.split('@')[0]}`;
return await conn.reply(m.chat, `《✧》 Ya estás casado con *${partnerName}*\n> Puedes divorciarte con el comando: *#divorce*`, m);
} else {
return m.reply('《✧》 Debes mencionar a alguien para proponer matrimonio.\n> Ejemplo » *#marry @Usuario*');
}
}

let proposeeJid = normalizeToJid(rawProposee);

if (isUserMarried(senderJid)) {
let partner = getPartner(senderJid);
return m.reply(`Ya estás casado con @${partner.split('@')[0]}.`);
}
if (isUserMarried(proposeeJid)) {
return m.reply(`@${proposeeJid.split('@')[0]} ya está casado(a).`);
}
if (senderJid === proposeeJid) return m.reply('¡No puedes proponerte matrimonio a ti mismo!');

setConfirmation(`${m.chat}:${proposeeJid}`, {
proposer: senderJid
});

let proposerName = conn.getName(senderJid) || `@${senderJid.split('@')[0]}`;
let proposeeName = conn.getName(proposeeJid) || `@${proposeeJid.split('@')[0]}`;

const confirmationMessage = `♡ ${proposerName} te ha propuesto matrimonio. ${proposeeName} ¿aceptas? •(=^●ω●^=)•\n\n*Debes Responder con:*\n> ✐ "Si" » para aceptar\n> ✐ "No" » para rechazar.`;
await conn.reply(m.chat, confirmationMessage, m, { mentions: [proposeeJid, senderJid] });

} else if (isDivorce) {
if (!isUserMarried(senderJid)) return m.reply('No estás casado con nadie.');
let partner = getPartner(senderJid);

if (typeof global.db.divorcePair === 'function') {
partner = global.db.divorcePair(senderJid);
} else {
let userDb = global.db.getUser(senderJid);
let partnerDb = global.db.getUser(partner);
if (userDb) delete userDb.marry;
if (partnerDb) delete partnerDb.marry;
}
await global.db.write?.();
await conn.reply(m.chat, `✐ ${conn.getName(senderJid)} y ${conn.getName(partner)} se han divorciado.`, m, { mentions: [senderJid, partner] });
}
};

handler.before = async function (m, { conn, participants }) {
const normalizeToJid = (rawJid) => {
if (!rawJid || typeof rawJid !== 'string') return rawJid;
if (!rawJid.endsWith('@lid')) return rawJid;
const pInfo = participants.find(p => p?.lid === rawJid);
return pInfo?.id || rawJid;
};

let senderJid = normalizeToJid(m.sender);
const key = `${m.chat}:${senderJid}`;

const responseText = m.text?.trim().toLowerCase() || '';
if (responseText !== 'si' && responseText !== 'sí' && responseText !== 'no') return;

const data = takeConfirmation(key);
if (!data) return;

if (responseText === 'no') {
return conn.sendMessage(m.chat, { text: '*《✧》Han rechazado tu propuesta de matrimonio.*' }, { quoted: m });
}

if (responseText === 'si' || responseText === 'sí') {
const { proposer } = data;
const marriages = await (global.db?.getSection?.('marriages') || {});
const isUserMarried = (user) => Boolean(global.db.getUser(user)?.marry || marriages[user]?.partner);

if (isUserMarried(proposer) || isUserMarried(senderJid)) {
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
text: `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩\n\n¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧\n\n*•.¸♡ Esposo(a):* ${proposerName}\n*•.¸♡ Esposo(a):* ${senderName}\n\n\`Disfruten de su luna de miel\`\n\n✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`,
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