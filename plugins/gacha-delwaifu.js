import { loadHarem, saveHarem } from '../lib/gacha-group.js';
import { loadCharacters, findCharacterByName } from '../lib/gacha-characters.js';

let handler = async (m, { conn, text }) => {
  const userId = m.sender;
  const groupId = m.chat;

  if (!text) {
    return m.reply(`Debes especificar un personaje para eliminar.\n\n> Ejemplo » *#delwaifu Aika Sano*`);
  }

  try {
    const characters = await loadCharacters();
    const keyword = text.trim();

    const character = findCharacterByName(characters, keyword);
    if (!character) return m.reply(`El personaje *${text}* no existe.`);

    const harem = await loadHarem();
    const idx = harem.findIndex(c => c.groupId === groupId && c.userId === userId && c.characterId === character.id);
    if (idx === -1) {
      return m.reply(`El personaje *${character.name}* no ha sido reclamado por ti en este grupo.`);
    }

    harem.splice(idx, 1);
    await saveHarem(harem);

    m.reply(`✦ *${character.name}* ha sido eliminado de tus reclamados en este grupo.`);
  } catch (e) {
    console.error(e);
    m.reply(`✘ Ocurrió un error al intentar eliminar el personaje: ${e.message}`);
  }
};

handler.help = ['delwaifu <nombre>'];
handler.tags = ['waifus'];
handler.command = ['delwaifu', 'deletewaifu', 'delchar'];
handler.group = true;

export default handler;