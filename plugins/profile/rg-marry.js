let proposals = {};
const CONFIRMATION_TTL_MS = 60000;
const confirmacionesMarry = globalThis.confirmacionesMarry || new Map();
globalThis.confirmacionesMarry = confirmacionesMarry;
function setConfirmation(key, payload, onTimeout) {
const previous = confirmacionesMarry.get(key);
if (previous?.timeout) clearTimeout(previous.timeout);
const timeout = setTimeout(() => {
confirmacionesMarry.delete(key);
if (onTimeout) onTimeout();
}, CONFIRMATION_TTL_MS);
timeout.unref?.();
confirmacionesMarry.set(key, { ...payload, timeout });
}
function takeConfirmation(key) {
const data = confirmacionesMarry.get(key);
if (!data) return null;
if (data.timeout) clearTimeout(data.timeout);
confirmacionesMarry.delete(key);
return data;
}
async function loadMarriages() {
return global.db?.getSection?.('marriages') || {};
}
function isUserMarried(marriages, user) {
return Boolean(global.db.getUser(user)?.marry || marriages[user]?.partner);
}
function getPartner(marriages, user) {
return global.db.getUser(user)?.marry || marriages[user]?.partner || '';
}
const handler = async (m, { conn, command, participants }) => {
const normalizeToJid = (rawJid) => {
if (!rawJid || typeof rawJid !== 'string') return rawJid;
if (!rawJid.endsWith('@lid')) return rawJid;
const pInfo = participants?.find(p => p?.lid === rawJid);
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
return await conn.reply(m.chat, `《✧》 Ya estás casado con *${partnerName}*\n> Puedes divorciarte con el comando: *#divorce*`, m);
} else {
throw new Error('Debes mencionar a alguien para aceptar o proponer matrimonio.\n> Ejemplo » *#marry @Usuario*');
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
proposals[proposerJid] = proposeeJid;
let proposerName = conn.getName(proposerJid) || `@${proposerJid.split('@')[0]}`;
let proposeeName = conn.getName(proposeeJid) || `@${proposeeJid.split('@')[0]}`;
const confirmationMessage = `♡ ${proposerName} te ha propuesto matrimonio. ${proposeeName} ¿aceptas? •(=^●ω●^=)•\n\n*Debes Responder con:*\n> ✐ "Si" » para aceptar\n> ✐ "No" » para rechazar.`;
await conn.reply(m.chat, confirmationMessage, m, { mentions: [proposeeJid, proposerJid] });
const key = `${m.chat}:${proposeeJid}`;
setConfirmation(key, { proposer: proposerJid }, async () => {
await conn.sendMessage(m.chat, { text: '*《✧》Se acabó el tiempo, no se obtuvo respuesta. La propuesta de matrimonio fue cancelada.*' });
});
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
const normalizeToJid = (rawJid) => {
if (!rawJid || typeof rawJid !== 'string') return rawJid;
if (!rawJid.endsWith('@lid')) return rawJid;
const pInfo = participants?.find(p => p?.lid === rawJid);
return pInfo?.id || rawJid;
};
let senderJid = normalizeToJid(m.sender);
const key = `${m.chat}:${senderJid}`;
if (!confirmacionesMarry.has(key)) return;
const responseText = m.text?.trim().toLowerCase() || '';
if (!responseText) return;
if (/^[#\.\/!]?(no|rechazar)$/i.test(responseText)) {
takeConfirmation(key);
return conn.sendMessage(m.chat, { text: '*《✧》Han rechazado tu propuesta de matrimonio.*' }, { quoted: m });
}
if (/^[#\.\/!]?(si|s[íi]|yes|acepto)$/i.test(responseText)) {
const data = takeConfirmation(key);
if (!data) return;
const { proposer } = data;
delete proposals[proposer];
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
text: `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩\n\n¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧\n\n*•.¸♡ Esposo* ${proposerName}\n*•.¸♡ Esposa* ${senderName}\n\n\`Disfruten de su luna de miel\`\n\n✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`,
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