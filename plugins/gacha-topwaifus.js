import { promises as fs } from 'fs';
import { loadGroupVotes, makeGroupCharacterKey } from '../lib/groupVotes.js';

const charactersFilePath = './src/database/characters.json';

async function loadCharacters() {
  try {
    const data = await fs.readFile(charactersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    throw new Error('《✧》No se pudo cargar el archivo characters.json.');
  }
}

let handler = async (m, { conn, args }) => {
  try {
    const groupId = m.chat;
    const characters = await loadCharacters();
    const groupVotes = await loadGroupVotes();

    const enriched = characters.map(character => {
      const gKey = makeGroupCharacterKey(groupId, character.id);
      const gData = groupVotes[gKey] || { valueBonus: 0, votes: 0 };
      const baseValue = Number(character.value || 0);
      const value = baseValue + Number(gData.valueBonus || 0);
      const votes = Number(gData.votes || 0);
      return { ...character, value, groupVotes: votes };
    });

    enriched.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return b.groupVotes - a.groupVotes;
    });

    const page = Math.max(1, parseInt(args[0]) || 1);
    const itemsPerPage = 10;
    const totalCharacters = enriched.length;
    const totalPages = Math.max(1, Math.ceil(totalCharacters / itemsPerPage));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const charactersToShow = enriched.slice(startIndex, endIndex);

    let message = '❀ *Top waifus por valor en este grupo:*\n';
    charactersToShow.forEach((character, index) => {
      message += `✰ ${startIndex + index + 1} » *${character.name}*\n`;
      message += `   → Valor grupo: *${character.value.toLocaleString('es-ES')}*\n`;
      message += `   → Votes grupo: *${character.groupVotes}*\n`;
    });

    message += `\n> • Página *${safePage}* de *${totalPages}*.`;

    await conn.reply(m.chat, message, m);
  } catch (error) {
    await conn.reply(m.chat, `✘ Error al cargar los personajes: ${error.message}`, m);
  }
};

handler.help = ['topwaifus [página]'];
handler.tags = ['anime'];
handler.command = ['topwaifus', 'waifustop', 'waifusboard'];
handler.group = true;
handler.register = true;

export default handler;
