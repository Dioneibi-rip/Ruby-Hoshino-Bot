import { loadHarem, isSameUserId } from '../../library/gacha-group.js';
import { normalizeIdentityJid, buildParticipantsByLid, resolveIdentityName } from '../../core/identity-utils.js';
import { loadCharacters } from '../../library/gacha-characters.js';
import { getCooldownKey, isRedisReady, redis } from '../../library/redis.js';

const cooldownAliases = {
rollwaifu: ['rw', 'rollwaifu'],
claim: ['claim', 'reclamar', 'c'],
vote: ['vote', 'votar']
};

function formatTime(ms) {
if (!Number.isFinite(ms) || ms <= 0) return 'Ahora.';
const totalSeconds = Math.ceil(ms / 1000);
const minutes = Math.floor(totalSeconds / 60);
const seconds = totalSeconds % 60;
if (minutes <= 0) return `${seconds} segundos`;
if (seconds <= 0) return `${minutes} minutos`;
return `${minutes} minutos ${seconds} segundos`;
}

async function getCooldownStatus(commands = [], userId = '') {
if (!userId || !isRedisReady()) return 'Ahora.';
const ttls = [];
for (const command of commands) {
if (!command) continue;
const key = getCooldownKey(command, userId);
try {
const value = await redis.get(key);
if (!value) continue;
const ttlSeconds = await redis.ttl(key);
if (Number.isFinite(ttlSeconds) && ttlSeconds > 0) ttls.push(ttlSeconds * 1000);
} catch (error) {
console.error('[ginfo] No se pudo consultar cooldown:', error);
return 'Ahora.';
}
}
return ttls.length ? formatTime(Math.max(...ttls)) : 'Ahora.';
}

function normalizeUserId(userId = '') {
if (!userId) return '';
return String(userId).trim();
}

function getSeriesName(character = {}) {
return String(character.source || character.series || character.anime || character.origin || character.game || '').trim();
}

let handler = async (m, { conn, participants = [] } = {}) => {
try {
const safeParticipants = Array.isArray(participants) ? participants : [];
const participantsByLid = buildParticipantsByLid(safeParticipants);
const rawTarget = m?.mentionedJid?.[0] || m?.quoted?.sender || m?.quoted?.participant || m?.quoted?.key?.participant || m?.sender || '';
const normalizedTarget = await normalizeIdentityJid(conn, rawTarget, participantsByLid);
const userId = normalizeUserId(normalizedTarget || rawTarget || m?.sender || '');
const groupId = m?.chat;
if (!userId || !groupId) throw new Error(`Datos insuficientes en ginfo: userId=${userId || 'vacío'}, groupId=${groupId || 'vacío'}`);

let userName = userId;
try {
userName = await resolveIdentityName(conn, userId, { participantsByLid, fallback: userId });
} catch (error) {
console.error('[ginfo] No se pudo resolver el nombre del usuario:', error);
}

const rwStatus = await getCooldownStatus(cooldownAliases.rollwaifu, userId);
const claimStatus = await getCooldownStatus(cooldownAliases.claim, userId);
const voteStatus = await getCooldownStatus(cooldownAliases.vote, userId);

const allCharactersRaw = await loadCharacters();
const allCharacters = Array.isArray(allCharactersRaw) ? allCharactersRaw : [];
const charactersById = new Map(allCharacters.map(character => [String(character?.id || '').trim(), character]).filter(([id]) => id));
const haremRaw = await loadHarem();
const harem = Array.isArray(haremRaw) ? haremRaw : [];
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
