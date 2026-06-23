import { loadCharacters } from '../../lib/gacha-characters.js';
import {
loadHarem,
saveHarem,
isSameUserId
} from '../../lib/gacha-group.js';
import { resetProtectionOnTransfer } from '../../lib/gacha-protection.js';

const CONFIRMATION_TTL_MS = 60_000
const confirmaciones = globalThis.confirmacionesGiveAllHarem || new Map()
globalThis.confirmacionesGiveAllHarem = confirmaciones

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

let handler = async (m, { conn, participants }) => {
const normalizeToJid = (rawJid) => {
if (!rawJid || typeof rawJid !== 'string') return rawJid;
if (!rawJid.endsWith('@lid')) return rawJid;
const pInfo = participants.find(p => p?.lid === rawJid);
return pInfo?.id || rawJid;
};

let senderJid = normalizeToJid(m.sender);
let mentionedJid = normalizeToJid(m.mentionedJid?.[0] || m.quoted?.sender);

if (!mentionedJid) return m.reply('✿ Debes mencionar o responder a un mensaje del usuario para regalarle todas tus waifus en este grupo.');
if (mentionedJid === senderJid) return m.reply('✿ No puedes regalarte tus propias waifus.');

const groupId = m.chat;

const characters = await loadCharacters();
const charactersById = new Map(characters.map(character => [character.id, character]));
const harem = await loadHarem();
const myWaifus = harem.filter(c => c.groupId === groupId && isSameUserId(c.userId, senderJid));

if (myWaifus.length === 0) return m.reply('✿ No tienes waifus para regalar en este grupo.');

const valorTotal = myWaifus.reduce((acc, w) => {
const ch = charactersById.get(w.characterId);
return acc + (parseInt(ch?.value) || 0);
}, 0);

setConfirmation(`${groupId}:${senderJid}`, {
waifus: myWaifus.map(c => c.characterId),
receptor: mentionedJid,
valorTotal
});

const textoConfirmacion = `「✐」 @${senderJid.split('@')[0]}, ¿Estás seguro que deseas regalar todos tus personajes a *@${mentionedJid.split('@')[0]}* en este grupo?

❏ Personajes a regalar: *${myWaifus.length}*
❏ Valor total: *${valorTotal.toLocaleString()}*

✐ Para confirmar responde a este mensaje con "*Aceptar*".
> Esta acción no se puede deshacer, revisa bien los datos antes de confirmar.`;

await conn.sendMessage(m.chat, {
text: textoConfirmacion,
mentions: [senderJid, mentionedJid]
}, { quoted: m });
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
if (m.text?.trim().toLowerCase() !== 'aceptar') return;
const data = takeConfirmation(key);
if (!data) return;

if (data) {

const harem = await loadHarem();
const dataWaifusSet = data.waifusSet || new Set(data.waifus);
data.waifusSet = dataWaifusSet;
let regalados = 0;

for (const char of harem.slice()) {
if (char.groupId === m.chat && data.waifusSet.has(char.characterId) && isSameUserId(char.userId, senderJid)) {
char.userId = data.receptor;
resetProtectionOnTransfer(char, { now: Date.now(), reason: 'giveallharem' });
regalados++;
}
}

await saveHarem(harem);

return conn.sendMessage(m.chat, {
text: `「✐」 Has regalado con éxito todos tus personajes a *@${data.receptor.split('@')[0]}* en este grupo!\n\n> ❏ Personajes regalados: *${regalados}*\n> ❏ Valor total: *${data.valorTotal.toLocaleString()}*`,
mentions: [data.receptor]
}, { quoted: m });
}
};

handler.help = ['giveallharem @user', 'giveallharem (respondiendo mensaje)'];
handler.tags = ['gacha'];
handler.command = ['giveallharem', 'regalarharem'];
handler.group = true;
handler.register = true;

export default handler;
