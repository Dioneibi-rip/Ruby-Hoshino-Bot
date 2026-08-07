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
import { deleteActiveRoll, evaluateRollWindow, formatWindowSeconds, getActiveRoll, pruneActiveRolls, ROLL_EXPIRATION_MS, ROLL_PROTECTION_MS } from '../../library/gacha-roll-window.js';
import { replyWithFkontak } from '../../core/notice.js';

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
await replyWithFkontak(conn, m, '(,,•᷄‎ࡇ•᷅ ,,)? ძᥱbᥱs ᥴі𝗍ᥲr ᥙᥒ ⍴ᥱrs᥆ᥒᥲjᥱ vᥲᥣіძ᥆.\n\n» ᥙsᥲ *#rw* ⍴ᥲrᥲ 𝗍іrᥲr ᥙᥒ r᥆ᥣᥣ y ᥣᥙᥱg᥆ ᥴі𝗍ᥲ ᥱsᥱ mᥱᥒsᥲjᥱ ᥴ᥆ᥒ *#claim*', { name: '✘ Rᥙby H᥆shіᥒ᥆ · Cᥣᥲіm' });
return false;
}

try {
const characters = await loadCharacters();
const id = extractCharacterIdFromText(m.quoted.text);
if (!id) {
await replyWithFkontak(conn, m, '(,,•᷄‎ࡇ•᷅ ,,)? ᥒ᥆ sᥱ ძᥱ𝗍ᥱᥴ𝗍᥆ ᥱᥣ ID ძᥱᥣ ⍴ᥱrs᥆ᥒᥲjᥱ ᥱᥒ ᥱᥣ mᥱᥒsᥲjᥱ ᥴі𝗍ᥲძ᥆.', { name: '✘ Rᥙby H᥆shіᥒ᥆ · Cᥣᥲіm' });
return false;
}

const character = findCharacterById(characters, id);

if (!character) {
await replyWithFkontak(conn, m, '(,,•᷄‎ࡇ•᷅ ,,)? ⍴ᥱrs᥆ᥒᥲjᥱ ᥒ᥆ ᥱᥒᥴ᥆ᥒ𝗍rᥲძ᥆.', { name: '✘ Rᥙby H᥆shіᥒ᥆ · Cᥣᥲіm' });
return false;
}

pruneActiveRolls(now);
const rollData = getActiveRoll(groupId, id);

let timeElapsedStr = "";

if (rollData) {
const window = evaluateRollWindow(rollData, userId, now);
if (window.state === 'expired') {
deleteActiveRoll(groupId, id);
await replyWithFkontak(conn, m, `(,,•᷄‎ࡇ•᷅ ,,)? ᥱsᥱ ⍴ᥱrs᥆ᥒᥲjᥱ yᥲ ᥱx⍴іr᥆ (vᥱᥒ𝗍ᥲᥒᥲ ძᥱ ${Math.round(ROLL_EXPIRATION_MS / 1000)}s) y ᥒᥲძіᥱ ⍴ᥙᥱძᥱ rᥱᥴᥣᥲmᥲrᥣ᥆.\n\n» vᥙᥱᥣvᥱ ᥲ ᥙsᥲr *#rw*`, { name: '⏳ Rᥙby H᥆shіᥒ᥆ · Vᥱᥒ𝗍ᥲᥒᥲ ᥱx⍴іrᥲძᥲ' });
return false;
}
if (window.state === 'protected') {
const protectedBy = await conn.getName(rollData.user).catch(() => `@${String(rollData.user || '').split('@')[0]}`);
await replyWithFkontak(conn, m, `(,,•᷄‎ࡇ•᷅ ,,)? ᥱᥣ ⍴ᥱrs᥆ᥒᥲjᥱ *${character.name}* ᥱs𝗍ᥲ ⍴r᥆𝗍ᥱgіძ᥆ ⍴᥆r *${protectedBy}*.\n\n🛡️ ⍴r᥆𝗍ᥱᥴᥴі᥆ᥒ rᥱs𝗍ᥲᥒ𝗍ᥱ: *${formatWindowSeconds(window.protectionRemainingMs)}* ძᥱ ${Math.round(ROLL_PROTECTION_MS / 1000)}s\n⏳ ᥱx⍴іrᥲ ᥱᥒ: *${formatWindowSeconds(window.expirationRemainingMs)}*`, { name: '🛡️ Rᥙby H᥆shіᥒ᥆ · Pr᥆𝗍ᥱᥴᥴі᥆ᥒ ᥲᥴ𝗍іvᥲ' });
return false;
}
timeElapsedStr = ` (${(window.elapsedMs / 1000).toFixed(1)}s)`;
} else {
const harem = await loadHarem();
const claim = findClaim(harem, groupId, id);
if (!claim) {
await replyWithFkontak(conn, m, '(,,•᷄‎ࡇ•᷅ ,,)? ᥱsᥱ ⍴ᥱrs᥆ᥒᥲjᥱ ᥒ᥆ ᥱs𝗍ᥲ ძіs⍴᥆ᥒіbᥣᥱ ⍴ᥲrᥲ rᥱᥴᥣᥲmᥲr ᥱᥒ ᥱs𝗍ᥱ grᥙ⍴᥆.\n\n» ᥙsᥲ *#rw* ⍴ᥲrᥲ 𝗍іrᥲr ᥙᥒ᥆', { name: '✘ Rᥙby H᥆shіᥒ᥆ · Cᥣᥲіm' });
return false;
}
}

const exclusiveRule = canUserClaimCharacter(character.id, userId);
if (!exclusiveRule.allowed) {
const exclusiveName = await conn.getName(exclusiveRule.ownerJid).catch(() => `@${exclusiveRule.ownerJid.split('@')[0]}`);
await replyWithFkontak(conn, m, `(,,•᷄‎ࡇ•᷅ ,,)? ᥱᥣ ⍴ᥱrs᥆ᥒᥲjᥱ *${character.name}* (ID ${character.id}) ᥱs ᥱxᥴᥣᥙsіv᥆ y s᥆ᥣ᥆ ⍴ᥙᥱძᥱ sᥱr rᥱᥴᥣᥲmᥲძ᥆ ⍴᥆r *${exclusiveName}*.`, { name: '🔒 Rᥙby H᥆shіᥒ᥆ · Exᥴᥣᥙsіv᥆' });
return false;
}

const haremBefore = await loadHarem();
const existingClaim = findClaim(haremBefore, groupId, id);
if (existingClaim && !isSameUserId(existingClaim.userId, userId) && isUserInGroup(existingClaim.userId, participants)) {
await replyWithFkontak(conn, m, `(,,•᷄‎ࡇ•᷅ ,,)? ᥱᥣ ⍴ᥱrs᥆ᥒᥲjᥱ *${character.name}* yᥲ 𝖿ᥙᥱ rᥱᥴᥣᥲmᥲძ᥆ ⍴᥆r @${existingClaim.userId.split('@')[0]}.`, { name: '✘ Rᥙby H᥆shіᥒ᥆ · Yᥲ rᥱᥴᥣᥲmᥲძ᥆', mentions: [existingClaim.userId] });
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

await replyWithFkontak(conn, m, mensajeFinal, { name: '✧ Rᥙby H᥆shіᥒ᥆ · Cᥣᥲіm ᥱxі𝗍᥆s᥆', mentions: [userId] });

} catch (e) {
await replyWithFkontak(conn, m, `(,,•᷄‎ࡇ•᷅ ,,)? ᥱrr᥆r ᥲᥣ rᥱᥴᥣᥲmᥲr wᥲі𝖿ᥙ.\n\n» ${e.message}`, { name: '✘ Rᥙby H᥆shіᥒ᥆ · Err᥆r' });
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
