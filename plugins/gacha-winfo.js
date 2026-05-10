import { loadHarem, findClaim } from '../lib/gacha-group.js';
import { loadCharacters, findCharacterByName } from '../lib/gacha-characters.js';

let handler = async (m, { conn, args }) => {
  if (args.length === 0) {
    await conn.reply(m.chat, 'Debes especificar un personaje para ver su información.\n> Ejemplo » *#winfo Aika Sano*', m);
    return;
  }

  const characterName = args.join(' ').toLowerCase().trim();
  const groupId = m.chat;

  try {
    const characters = await loadCharacters();
    const character = findCharacterByName(characters, characterName);

    if (!character) {
      await conn.reply(m.chat, `No se encontró el personaje *${characterName}*.`, m);
      return;
    }

    const harem = await loadHarem();
    const claim = findClaim(harem, groupId, character.id);

    const statusMessage = claim
      ? `Reclamado por @${claim.userId.split('@')[0]}`
      : 'Libre';

    const mentions = claim ? [claim.userId] : [];

    const message = `❀ Nombre » *${character.name}*\n⚥ Género » *${character.gender}*\n✰ Valor » *${character.value}*\n♡ Estado » ${statusMessage}\n❖ Fuente » *${character.source}*`;

    await conn.reply(m.chat, message, m, { mentions });

  } catch (error) {
    await conn.reply(m.chat, `✘ Error al cargar la información del personaje: ${error.message}`, m);
  }
};

handler.help = ['charinfo <nombre del personaje>', 'winfo <nombre del personaje>', 'waifuinfo <nombre del personaje>'];
handler.tags = ['anime'];
handler.command = ['charinfo', 'winfo', 'waifuinfo'];
handler.group = true;
handler.register = true;

export default handler;