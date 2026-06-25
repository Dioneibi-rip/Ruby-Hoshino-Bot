import { loadHarem, isSameUserId } from '../../lib/gacha-group.js';
import { loadCharacters } from '../../lib/gacha-characters.js';
import { getCooldownKey, isRedisReady, redis } from '../../lib/redis.js';

const cooldownAliases = {
rollwaifu: ['rw', 'rollwaifu'],
claim: ['claim', 'reclamar', 'c'],
vote: ['vote', 'votar'],
robwaifu: ['robwaifu', 'stealwaifu', 'robarwaifu']
};

function formatTime(ms) {
if (!ms || ms <= 0) return 'Ahora.';
const totalSeconds = Math.ceil(ms / 1000);
const minutes = Math.floor(totalSeconds / 60);
const seconds = totalSeconds % 60;
if (minutes <= 0) return `${seconds} segundos`;
return `${minutes} minutos ${seconds} segundos`;
}

async function getCooldownStatus(commands, userId) {
if (!isRedisReady()) return 'Ahora.';
const ttls = [];
for (const command of commands) {
const key = getCooldownKey(command, userId);
const value = await redis.get(key);
if (!value) continue;
const ttl = await redis.pttl(key);
if (ttl > 0) ttls.push(ttl);
}
if (!ttls.length) return 'Ahora.';
return formatTime(Math.max(...ttls));
}

function normalizeUserId(userId) {
if (!userId) return userId;
if (userId.endsWith('@lid')) return `${userId.split('@')[0]}@s.whatsapp.net`;
return userId;
}

let handler = async (m, { conn }) => {
const userId = normalizeUserId(m.sender);
const groupId = m.chat;
let userName;

try {
userName = await conn.getName(userId);
} catch (e) {
userName = userId;
  return false;
}

try {
const rwStatus = await getCooldownStatus(cooldownAliases.rollwaifu, userId);
const claimStatus = await getCooldownStatus(cooldownAliases.claim, userId);
const voteStatus = await getCooldownStatus(cooldownAliases.vote, userId);
const robStatus = await getCooldownStatus(cooldownAliases.robwaifu, userId);

const allCharacters = await loadCharacters();
const charactersById = new Map(allCharacters.map(character => [character.id, character]));
const harem = await loadHarem();
const userCharacters = harem.filter(c => c.groupId === groupId && isSameUserId(c.userId, userId));
const claimedCount = userCharacters.length;
const totalCharacters = allCharacters.length;

const totalValue = userCharacters.reduce((sum, char) => {
const ch = charactersById.get(char.characterId);
return sum + (Number(ch?.value) || 0);
}, 0);

let response = `*❀ Usuario \`<${userName}>\`*\n\n`;
response += `ⴵ RollWaifu » *${rwStatus}*\n`;
response += `ⴵ Claim » *${claimStatus}*\n`;
response += `ⴵ Vote » *${voteStatus}*\n`;
response += `ⴵ RobWaifu » *${robStatus}*\n\n`;
response += `♡ Personajes reclamados en este grupo » *${claimedCount} / ${totalCharacters}*\n`;
response += `✰ Valor total (est.) » *${totalValue.toLocaleString('es-ES')}*`;

await conn.reply(m.chat, response, m);
} catch (e) {
console.error('Error en handler ginfo:', e);
await conn.reply(m.chat, '✘ Ocurrió un error al verificar tu estado.', m);
  return false;
}
};

handler.help = ['infogacha', 'ginfo', 'gachainfo', 'estado', 'status', 'cooldowns', 'cd'];
handler.tags = ['info'];
handler.command = ['infogacha', 'ginfo', 'gachainfo'];
handler.group = true;

export default handler;
