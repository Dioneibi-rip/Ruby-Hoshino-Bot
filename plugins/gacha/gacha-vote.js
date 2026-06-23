import { loadGroupVotes, saveGroupVotes, makeGroupCharacterKey } from '../../lib/groupVotes.js';
import { loadCharacters, findCharacterByName } from '../../lib/gacha-characters.js';

let handler = async (m, { conn, args }) => {
try {
const userId = m.sender;
const groupId = m.chat;
const now = Date.now();
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
const incrementValue = Math.floor(Math.random() * 8) + 1;
const baseValue = Number(character.value || 0);
currentGroupData.valueBonus += incrementValue;
currentGroupData.votes += 1;
currentGroupData.groupId = groupId;
currentGroupData.characterId = character.id;
groupVotes[groupCharacterKey] = currentGroupData;
await saveGroupVotes(groupVotes);
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
handler.cooldown = 3600000;

export default handler;
