import { loadHarem, isSameUserId } from '../../library/gacha-group.js';
import { normalizeIdentityJid, buildParticipantsByLid, resolveIdentityName } from '../../core/identity-utils.js';
import { loadCharacters } from '../../library/gacha-characters.js';
import { getGachaCooldownReport, normalizeGachaUserId } from '../../helpers/gacha-cooldowns.js';
import { normalizePity, renderPityBar } from '../../library/gacha-pity.js';
import { evaluateRollWindow, formatWindowSeconds, listActiveRolls, pruneActiveRolls, ROLL_EXPIRATION_MS, ROLL_PROTECTION_MS } from '../../library/gacha-roll-window.js';
import { replyWithFkontak } from '../../core/notice.js';

function getSeriesName(character = {}) {
return String(character.source || character.series || character.anime || character.origin || character.game || '').trim();
}

function buildWindowLine(rollWindows = []) {
if (!rollWindows.length) return 'sіᥒ r᥆ᥣᥣs ᥲᥴ𝗍іv᥆s';
const own = rollWindows.find((roll) => roll.isOwner);
if (own) {
const protection = own.protectionRemainingMs > 0 ? `⍴r᥆𝗍ᥱᥴᥴі᥆ᥒ ${formatWindowSeconds(own.protectionRemainingMs)}` : 'sіᥒ ⍴r᥆𝗍ᥱᥴᥴі᥆ᥒ';
return `ID ${own.characterId} · ${protection} · ᥱx⍴іrᥲ ᥱᥒ ${formatWindowSeconds(own.expirationRemainingMs)}`;
}
const claimable = rollWindows.find((roll) => roll.canClaim);
if (claimable) return `ID ${claimable.characterId} ᥣіbrᥱ · ᥱx⍴іrᥲ ᥱᥒ ${formatWindowSeconds(claimable.expirationRemainingMs)}`;
const guarded = rollWindows[0];
return `ID ${guarded.characterId} ⍴r᥆𝗍ᥱgіძ᥆ ${formatWindowSeconds(guarded.protectionRemainingMs)}`;
}

let handler = async (m, { conn, participants = [] } = {}) => {
try {
const safeParticipants = Array.isArray(participants) ? participants : [];
const participantsByLid = buildParticipantsByLid(safeParticipants);
const rawTarget = m?.mentionedJid?.[0] || m?.quoted?.sender || m?.quoted?.participant || m?.quoted?.key?.participant || m?.sender || '';
const normalizedTarget = await normalizeIdentityJid(conn, rawTarget, participantsByLid);
const userId = normalizeGachaUserId(normalizedTarget || rawTarget || m?.sender || '');
const groupId = m?.chat;
if (!userId || !groupId) throw new Error(`Datos insuficientes en ginfo: userId=${userId || 'vacío'}, groupId=${groupId || 'vacío'}`);

let userName = userId;
try {
userName = await resolveIdentityName(conn, userId, { participantsByLid, fallback: userId });
} catch (error) {
console.error('[ginfo] No se pudo resolver el nombre del usuario:', error);
}

const now = Date.now();
const cooldownReport = await getGachaCooldownReport(userId);

pruneActiveRolls(now);
const rollWindows = listActiveRolls(groupId, now)
.map((roll) => ({ ...roll, ...evaluateRollWindow({ user: roll.user, time: roll.time }, userId, now) }))
.filter((roll) => roll.state !== 'expired' && roll.state !== 'none');
const windowLine = buildWindowLine(rollWindows);

const allCharactersRaw = await loadCharacters();
const allCharacters = Array.isArray(allCharactersRaw) ? allCharactersRaw : [];
const charactersById = new Map(allCharacters.map(character => [String(character?.id || '').trim(), character]).filter(([id]) => id));
const haremRaw = await loadHarem();
const harem = Array.isArray(haremRaw) ? haremRaw : [];
const userData = global.db?.getUser?.(userId) || {};
const pityPercent = normalizePity(userData?.gachaPity || 0);
const pityBar = renderPityBar(pityPercent);
const userCharacters = harem.filter(character => character?.groupId === groupId && isSameUserId(character?.userId, userId));
const claimedCount = userCharacters.length;
const totalCharacters = allCharacters.length;
const totalSeries = new Set(allCharacters.map(getSeriesName).filter(Boolean)).size;

const statusParts = [];
if (userData?.banned) statusParts.push('bᥲᥒᥱᥲძ᥆');
if (userData?.premium) statusParts.push('⍴rᥱmіᥙm');
statusParts.push(cooldownReport.rollwaifu.ready ? 'r᥆ᥣᥣ ძіs⍴᥆ᥒіbᥣᥱ' : 'r᥆ᥣᥣ ᥱᥒ ᥱs⍴ᥱrᥲ');
statusParts.push(cooldownReport.claim.ready ? 'ᥴᥣᥲіm ძіs⍴᥆ᥒіbᥣᥱ' : 'ᥴᥣᥲіm ᥱᥒ ᥱs⍴ᥱrᥲ');
const userStatus = statusParts.join(' · ');

const totalValue = userCharacters.reduce((sum, char) => {
const characterId = String(char?.characterId || '').trim();
const character = charactersById.get(characterId);
return sum + (Number(character?.value) || 0);
}, 0);

const response = '*❀ Usuario `<' + `${userName}` + '>`*\n\n' +
`ⴵ RollWaifu » *${cooldownReport.rollwaifu.label}*\n` +
`ⴵ Claim » *${cooldownReport.claim.label}*\n` +
`ⴵ Vote » *${cooldownReport.vote.label}*\n` +
`ⴵ Pity » *${pityBar} ${pityPercent}%*\n` +
`ⴵ Estado » *${userStatus}*\n\n` +
`⏳ Ventana de reclamo » *${windowLine}*\n` +
`🛡️ Protección » *${Math.round(ROLL_PROTECTION_MS / 1000)}s* · Expiración » *${Math.round(ROLL_EXPIRATION_MS / 1000)}s*\n\n` +
`♡ Personajes reclamados » *${claimedCount}*\n` +
`✰ Valor total » *${totalValue}*\n` +
`❏ Personajes totales » *${totalCharacters}*\n` +
`❏ Series totales » *${totalSeries}*`;

await replyWithFkontak(conn, m, response, { name: '❀ Rᥙby H᥆shіᥒ᥆ · Gᥲᥴhᥲ Iᥒ𝖿᥆' });
} catch (error) {
console.error('[ginfo] Error real al verificar estado:', error);
await replyWithFkontak(conn, m, '(,,•᷄‎ࡇ•᷅ ,,)? ᥒ᥆ sᥱ ⍴ᥙძ᥆ vᥱrі𝖿іᥴᥲr 𝗍ᥙ ᥱs𝗍ᥲძ᥆ ძᥱᥣ gᥲᥴhᥲ.', { name: '✘ Rᥙby H᥆shіᥒ᥆ · Err᥆r' });
return false;
}
};

handler.help = ['infogacha', 'ginfo', 'gachainfo', 'estado', 'status', 'cooldowns', 'cd'];
handler.tags = ['info'];
handler.command = ['infogacha', 'ginfo', 'gachainfo'];
handler.group = true;

export default handler;
