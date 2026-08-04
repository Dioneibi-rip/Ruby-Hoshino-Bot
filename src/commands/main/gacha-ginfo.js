import { loadHarem, isSameUserId } from '../../library/gacha-group.js';
import { normalizeIdentityJid, buildParticipantsByLid, resolveIdentityName } from '../../core/identity-utils.js';
import { loadCharacters } from '../../library/gacha-characters.js';
import { GACHA_COOLDOWN_COMMANDS, getGachaCooldownStatus, normalizeGachaUserId } from '../../helpers/gacha-cooldowns.js';
import { normalizePity, renderPityBar } from '../../library/gacha-pity.js';

function getSeriesName(character = {}) {
return String(character.source || character.series || character.anime || character.origin || character.game || '').trim();
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

const rwStatus = await getGachaCooldownStatus(GACHA_COOLDOWN_COMMANDS.rollwaifu, userId);
const claimStatus = await getGachaCooldownStatus(GACHA_COOLDOWN_COMMANDS.claim, userId);
const voteStatus = await getGachaCooldownStatus(GACHA_COOLDOWN_COMMANDS.vote, userId);

const allCharactersRaw = await loadCharacters();
const allCharacters = Array.isArray(allCharactersRaw) ? allCharactersRaw : [];
const charactersById = new Map(allCharacters.map(character => [String(character?.id || '').trim(), character]).filter(([id]) => id));
const haremRaw = await loadHarem();
const harem = Array.isArray(haremRaw) ? haremRaw : [];
const userData = global.db.getUser(userId);
const pityPercent = normalizePity(userData?.gachaPity || 0);
const pityBar = renderPityBar(pityPercent);
const userCharacters = harem.filter(character => character?.groupId === groupId && isSameUserId(character?.userId, userId));
const claimedCount = userCharacters.length;
const totalCharacters = allCharacters.length;
const totalSeries = new Set(allCharacters.map(getSeriesName).filter(Boolean)).size;

const totalValue = userCharacters.reduce((sum, char) => {
const characterId = String(char?.characterId || '').trim();
const character = charactersById.get(characterId);
return sum + (Number(character?.value) || 0);
}, 0);

const response = '*❀ Usuario `<' + `${userName}` + '>`*\n\n' +
`ⴵ RollWaifu » *${rwStatus || 'Ahora.'}*\n` +
`ⴵ Claim » *${claimStatus || 'Ahora.'}*\n` +
`ⴵ Pity » *${pityBar} ${pityPercent}%*\n` +
`ⴵ Vote » *${voteStatus || 'Ahora.'}*\n\n` +
`♡ Personajes reclamados » *${claimedCount}*\n` +
`✰ Valor total » *${totalValue}*\n` +
`❏ Personajes totales » *${totalCharacters}*\n` +
`❏ Series totales » *${totalSeries}*`;

await conn.reply(m.chat, response, m);
} catch (error) {
console.error('[ginfo] Error real al verificar estado:', error);
await conn.reply(m.chat, '✘ Ocurrió un error al verificar tu estado.', m);
return false;
}
};

handler.help = ['infogacha', 'ginfo', 'gachainfo', 'estado', 'status', 'cooldowns', 'cd'];
handler.tags = ['info'];
handler.command = ['infogacha', 'ginfo', 'gachainfo'];
handler.group = true;

export default handler;
