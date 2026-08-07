import { promises as fs } from 'fs';
import {
loadHarem,
saveHarem,
addOrUpdateClaim,
findClaim,
isSameUserId
} from '../../library/gacha-group.js';
import {
loadCharacters,
findCharacterById,
extractCharacterIdFromText
} from '../../library/gacha-characters.js';
import { canUserClaimCharacter } from '../../library/gacha-restrictions.js';
import { resetProtectionOnTransfer } from '../../library/gacha-protection.js';
import { deleteActiveRoll, evaluateRollWindow, formatWindowSeconds, getActiveRoll } from '../../library/gacha-roll-window.js';

function isUserInGroup(userId, participants = []) {
if (!userId) return false;

if (!Array.isArray(participants) || !participants.length) return true;

return participants.some(participant => {
const ids = [participant?.id, participant?.jid, participant?.lid].filter(Boolean);
return ids.some(id => isSameUserId(id, userId));
});
}

async function loadClaimMessages() {
try {
return global.db?.getSection?.('claim_config') || {};
} catch (e) {
return {};
return false;
}
}

async function getCustomClaimMessage(userId, username, characterName) {
const messages = await loadClaimMessages();
const template = messages[userId] || '✧ *$user* ha reclamado a *$character* ✦';
return template.replace(/\$user/g, username).replace(/\$character/g, characterName);
}

let handler = async (m, { conn, participants = [] }) => {
const userId = m.sender;
const groupId = m.chat;
const now = Date.now();

if (!m.quoted || !m.quoted.text) {
await conn.reply(m.chat, '⚠️ Debes citar un personaje válido (usa #rw para ver el roll y luego cita ese mensaje con #claim).', m);
return false;
}

try {
const characters = await loadCharacters();
const id = extractCharacterIdFromText(m.quoted.text);
if (!id) {
await conn.reply(m.chat, '⚠️ No se detectó el ID del personaje en el mensaje citado.', m);
return false;
}

const character = findCharacterById(characters, id);

if (!character) {
await conn.reply(m.chat, '🚫 Personaje no encontrado.', m);
return false;
}

const rollData = getActiveRoll(groupId, id);

let timeElapsedStr = "";

if (rollData) {
const window = evaluateRollWindow(rollData, userId, now);
if (window.state === 'expired') {
deleteActiveRoll(groupId, id);
await conn.reply(m.chat, "🍂 Ese personaje ya expiró y nadie puede reclamarlo ahora (vuelve a usar #rw).", m);
return false;
}
if (window.state === 'protected') {
const protectedBy = await conn.getName(rollData.user);
await conn.reply(m.chat, `🛡️ El personaje *${character.name}* está siendo protegido por *${protectedBy}* durante *${formatWindowSeconds(window.protectionRemainingMs)}*.`, m);
return false;
}
timeElapsedStr = ` (${(window.elapsedMs / 1000).toFixed(1)}s)`;
} else {
const harem = await loadHarem();
const claim = findClaim(harem, groupId, id);
if (!claim) {
await conn.reply(m.chat, "🍂 Ese personaje no está disponible para reclamar en este grupo (usa #rw para tirar uno).", m);
return false;
}
}

const exclusiveRule = canUserClaimCharacter(character.id, userId);
if (!exclusiveRule.allowed) {
const exclusiveName = await conn.getName(exclusiveRule.ownerJid).catch(() => `@${exclusiveRule.ownerJid.split('@')[0]}`);
await conn.reply(m.chat, `🔒 El personaje *${character.name}* (ID ${character.id}) es exclusivo y solo puede ser reclamado por *${exclusiveName}*.`, m);
return false;
}

const haremBefore = await loadHarem();
const existingClaim = findClaim(haremBefore, groupId, id);
if (existingClaim && !isSameUserId(existingClaim.userId, userId) && isUserInGroup(existingClaim.userId, participants)) {
await conn.reply(m.chat, `❌ El personaje *${character.name}* ya fue reclamado por ${existingClaim.userId.split('@')[0]}.`, m);
return false;
}

if (existingClaim && !isSameUserId(existingClaim.userId, userId)) {
existingClaim.userId = userId;
existingClaim.lastClaimTime = now;
resetProtectionOnTransfer(existingClaim, { now, reason: 'claim_absent_owner' });
} else {
addOrUpdateClaim(haremBefore, groupId, userId, id);
}
if (typeof global.db?.upsertHaremClaim === 'function') {
global.db.upsertHaremClaim(existingClaim || { groupId, userId, characterId: String(id), lastClaimTime: now })
} else {
await saveHarem(haremBefore);
}

deleteActiveRoll(groupId, id);

const username = await conn.getName(userId);
const baseMessage = await getCustomClaimMessage(userId, username, character.name);
const mensajeFinal = `${baseMessage}${timeElapsedStr}`;

await conn.reply(m.chat, mensajeFinal, m);

} catch (e) {
conn.reply(m.chat, `✘ Error al reclamar waifu:\n${e.message}`, m);
return false;
}
};

handler.help = ['claim'];
handler.tags = ['waifus'];
handler.command = ['claim', 'reclamar', 'c'];
handler.group = true;
handler.cooldown = 1800000;
handler.cooldownMessage = (seconds, time, hms) => `⏳ Espera ${hms || time || seconds + 's'} antes de volver a usar este comando.`;

export default handler;
