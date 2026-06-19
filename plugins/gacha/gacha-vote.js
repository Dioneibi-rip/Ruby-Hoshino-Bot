import { loadGroupVotes, saveGroupVotes, makeGroupCharacterKey } from '../../lib/groupVotes.js';
import { loadCharacters, saveCharacters, findCharacterByName } from '../../lib/gacha-characters.js';



let handler = async (m, { conn, args }) => {
  try {
    const userId = m.sender;
    const groupId = m.chat;
    const userKey = `${groupId}:${userId}`;
    const now = Date.now();

    const userExpiration = Number(cooldowns[userKey] || 0);
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

    const charVoteKey = `${groupId}:${character.id}`;
    const charExpiration = Number(characterVotes[charVoteKey] || 0);
    if (charExpiration > now) {
      const timeLeft = charExpiration - now;
      const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
      const seconds = Math.floor((timeLeft / 1000) % 60);
      await conn.reply(m.chat, `El personaje *${character.name}* ya fue votado recientemente en este grupo. Espera *${minutes} minutos ${seconds} segundos* para volver a votarlo aquí.`, m);
      return;
    }

    const incrementValue = Math.floor(Math.random() * 8) + 1;
    const groupVotes = await loadGroupVotes();
    const groupCharacterKey = makeGroupCharacterKey(groupId, character.id);

    const baseValue = Number(character.value || 0);
    const currentGroupData = groupVotes[groupCharacterKey] || {
      groupId,
      characterId: character.id,
      valueBonus: 0,
      votes: 0,
    };

    currentGroupData.valueBonus += incrementValue;
    currentGroupData.votes += 1;
    currentGroupData.groupId = groupId;
    currentGroupData.characterId = character.id;

    groupVotes[groupCharacterKey] = currentGroupData;
    await saveGroupVotes(groupVotes);

    character.votes = (character.votes || 0) + 1;
    await saveCharacters(characters);

    cooldowns[userKey] = now + voteCooldownTime;
    characterVotes[charVoteKey] = now + voteCooldownTime;

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
