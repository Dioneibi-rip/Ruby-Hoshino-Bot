import { loadGroupVotes, saveGroupVotes, makeGroupCharacterKey } from '../../lib/groupVotes.js';
import { loadCharacters, findCharacterByName } from '../../lib/gacha-characters.js';

const voteCooldownTime = 60 * 60 * 1000;
let handler = async (m, { conn, args }) => {
try {
const userId = m.sender;
const groupId = m.chat;
const now = Date.now();
const user = global.db.getUser(userId);
const voteCooldowns = user.cooldowns_vote && typeof user.cooldowns_vote === 'object' && !Array.isArray(user.cooldowns_vote) ? user.cooldowns_vote : {};
const userExpiration = Number(voteCooldowns[groupId] || user.lastvote || 0);
if (userExpiration > now) {
const timeLeft = userExpiration - now;
const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
const seconds = Math.floor((timeLeft / 1000) % 60);
await conn.reply(m.chat, `Debes esperar *${minutes} minutos ${seconds} segundos* para usar *#vote* de nuevo en este grupo.`, m);
return;
}
const characters = await loadCharacters();
const characterName = args.join(' ').trim();
if (!characterName) {
await conn.reply(m.chat, 'Debes especificar un personaje para votarlo. Ej: #vote Aika Sano', m);
return;
}
const character = findCharacterByName(characters, characterName);
if (!character) {
await conn.reply(m.chat, 'Personaje no encontrado. Asegúrate del nombre correcto.', m);
return;
}
const groupVotes = await loadGroupVotes();
const groupCharacterKey = makeGroupCharacterKey(groupId, character.id);
const currentGroupData = groupVotes[groupCharacterKey] || {
groupId,
characterId: character.id,
valueBonus: 0,
votes: 0,
characterCooldownUntil: 0,
};
const charExpiration = Number(currentGroupData.characterCooldownUntil || 0);
if (charExpiration > now) {
const timeLeft = charExpiration - now;
const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
const seconds = Math.floor((timeLeft / 1000) % 60);
await conn.reply(m.chat, `El personaje *${character.name}* ya fue votado recientemente en este grupo. Espera *${minutes} minutos ${seconds} segundos* para volver a votarlo aquí.`, m);
return;
}
const incrementValue = Math.floor(Math.random() * 8) + 1;
const baseValue = Number(character.value || 0);
currentGroupData.valueBonus += incrementValue;
currentGroupData.votes += 1;
currentGroupData.groupId = groupId;
currentGroupData.characterId = character.id;
const nextVoteAt = now + voteCooldownTime;
currentGroupData.characterCooldownUntil = nextVoteAt;
groupVotes[groupCharacterKey] = currentGroupData;
await saveGroupVotes(groupVotes);
voteCooldowns[groupId] = nextVoteAt;
global.db.updateUser(userId, { lastvote: nextVoteAt, cooldowns_vote: voteCooldowns });
const groupValue = baseValue + currentGroupData.valueBonus;
await conn.reply(m.chat, `✰ Votaste por el personaje *${character.name}*\n› Valor en este grupo: *${groupValue}* (incrementado en *${incrementValue}*)\n› Votos en este grupo: *${currentGroupData.votes}*`, m);
} catch (e) {
await conn.reply(m.chat, `✘ Error al procesar el voto: ${e.message}`, m);
}
};

handler.help = ['vote <nombre>'];
handler.tags = ['anime'];
handler.command = ['vote', 'votar'];
handler.group = true;
handler.register = true;

export default handler;
