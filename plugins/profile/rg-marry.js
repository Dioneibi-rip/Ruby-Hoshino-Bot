let proposals = {};
const confirmation = {};

async function loadMarriages() {
return global.db?.getSection?.('marriages') || {}
}

function isUserMarried(marriages, user) {
return Boolean(global.db.getUser(user)?.marry || marriages[user]?.partner)
}

function getPartner(marriages, user) {
return global.db.getUser(user)?.marry || marriages[user]?.partner || ''
}

const handler = async (m, { conn, command, participants }) => {
const isPropose = /^marry$/i.test(command);
const isDivorce = /^divorce$/i.test(command);
const marriages = await loadMarriages();

try {
let proposerJid = m.sender;
if (m.sender.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === m.sender);
if (pInfo && pInfo.id) proposerJid = pInfo.id;
}

global.db.getUser(proposerJid)

if (isPropose) {
const rawProposee = m.quoted?.sender || m.mentionedJid?.[0];

if (!rawProposee) {
if (isUserMarried(marriages, proposerJid)) {
return await conn.reply(m.chat, `《✧》 Ya estás casado con *${conn.getName(getPartner(marriages, proposerJid))}*\n> Puedes divorciarte con el comando: *#divorce*`, m);
} else {
throw new Error('Debes mencionar a alguien para aceptar o proponer matrimonio.\n> Ejemplo » *#marry @Usuario*');
}
}

let proposeeJid = rawProposee;
if (rawProposee.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === rawProposee);
if (pInfo && pInfo.id) proposeeJid = pInfo.id;
}

global.db.getUser(proposeeJid)

if (isUserMarried(marriages, proposerJid)) throw new Error(`Ya estás casado con ${conn.getName(getPartner(marriages, proposerJid))}.`);
if (isUserMarried(marriages, proposeeJid)) throw new Error(`${conn.getName(proposeeJid)} ya está casado con ${conn.getName(getPartner(marriages, proposeeJid))}.`);
if (proposerJid === proposeeJid) throw new Error('¡No puedes proponerte matrimonio a ti mismo!');

proposals[proposerJid] = proposeeJid;
const proposerName = conn.getName(proposerJid);
const proposeeName = conn.getName(proposeeJid);
const confirmationMessage = `♡ ${proposerName} te ha propuesto matrimonio. ${proposeeName}  ¿aceptas? •(=^●ω●^=)•\n\n*Debes Responder con:*\n> ✐"Si" » para aceptar\n> ✐"No" » para rechazar.`;

await conn.reply(m.chat, confirmationMessage, m, { mentions: [proposeeJid, proposerJid] });

confirmation[proposeeJid] = {
proposer: proposerJid,
timeout: setTimeout(() => {
conn.sendMessage(m.chat, { text: '*《✧》Se acabó el tiempo, no se obtuvo respuesta. La propuesta de matrimonio fue cancelada.*' }, { quoted: m });
delete confirmation[proposeeJid];
}, 60000)
};

} else if (isDivorce) {
if (!isUserMarried(marriages, proposerJid)) throw new Error('No estás casado con nadie.');
const partner = global.db.divorcePair(proposerJid);
await global.db.write?.();
await conn.reply(m.chat, `✐ ${conn.getName(proposerJid)} y ${conn.getName(partner)} se han divorciado.`, m);
}
} catch (error) {
await conn.reply(m.chat, `《✧》 ${error.message}`, m);
}
}

handler.before = async (m, { conn, participants }) => {
if (m.isBaileys) return;

let senderJid = m.sender;
if (m.sender.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === m.sender);
if (pInfo && pInfo.id) senderJid = pInfo.id;
}

if (!(senderJid in confirmation)) return;
const responseText = String(m.text || m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase().trim();
if (!responseText) return;

const { proposer, timeout } = confirmation[senderJid];

if (responseText === 'no') {
clearTimeout(timeout);
delete confirmation[senderJid];
return conn.sendMessage(m.chat, { text: '*《✧》Han rechazado tu propuesta de matrimonio.*' }, { quoted: m });
}

if (responseText === 'si' || responseText === 'sí') {
delete proposals[proposer];
const marriages = await loadMarriages();
if (isUserMarried(marriages, proposer) || isUserMarried(marriages, senderJid)) {
clearTimeout(timeout);
delete confirmation[senderJid];
return conn.sendMessage(m.chat, { text: '*《✧》La propuesta ya no es válida porque una de las personas ya está casada.*' }, { quoted: m });
}

const fecha = Date.now();
global.db.setMarriagePair(proposer, senderJid, fecha);
await global.db.write?.();

conn.sendMessage(m.chat, { text: `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩
¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧\n\n*•.¸♡ Esposo ${conn.getName(proposer)}\n*•.¸♡ Esposa ${conn.getName(senderJid)}\n\n\`Disfruten de su luna de miel\`

✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`, mentions: [proposer, senderJid] }, { quoted: m });

clearTimeout(timeout);
delete confirmation[senderJid];
}
};

handler.tags = ['fun'];
handler.help = ['marry *@usuario*', 'divorce'];
handler.command = ['marry', 'divorce'];
handler.group = true;

export default handler;
