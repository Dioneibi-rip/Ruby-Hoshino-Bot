import { loadCharacters, findCharacterByName } from '../../lib/gacha-characters.js';

let handler = async (m, { args }) => {
  if (!args[0]) return m.reply('✿ Debes escribir el nombre del personaje que deseas establecer como favorito.');

  const characters = await loadCharacters();
  const characterName = args.join(' ').toLowerCase().trim();
  const userId = m.sender;
  const character = findCharacterByName(characters, characterName);
  if (!character) return m.reply('✿ Personaje no encontrado.');

  const favId = String(character.id || character.name);
  const current = global.db.sqlite.prepare('SELECT character_id FROM character_favorites WHERE user_id = ?').get(userId);
  if (current?.character_id === favId) return m.reply(`✿ *${character.name}* ya es tu personaje favorito.`);

  global.db.sqlite.prepare('INSERT INTO character_favorites(user_id, character_id, updated_at) VALUES(?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET character_id = excluded.character_id, updated_at = excluded.updated_at').run(userId, favId, Date.now());

  await m.reply(`✐ Ahora *${character.name}* es tu personaje favorito!`);
};

handler.help = ['setfav <nombre>'];
handler.tags = ['anime'];
handler.command = ['setfav', 'setfavorito'];
handler.group = true;
handler.register = true;

export default handler;
