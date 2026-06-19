import { loadCharacters, findCharacterById } from '../../lib/gacha-characters.js';

let handler = async (m) => {
  const characters = await loadCharacters();
  const rows = global.db.sqlite.prepare('SELECT character_id, COUNT(*) AS total FROM character_favorites GROUP BY character_id ORDER BY total DESC LIMIT 11').all();
  if (!rows.length) return m.reply('✿ Aún no hay personajes favoritos.');

  let txt = `✰ *Top de personajes favoritos:*\n\n`;
  rows.forEach((row, i) => {
    const c = findCharacterById(characters, row.character_id) || characters.find(ch => ch.name === row.character_id);
    txt += `#${i + 1} » *${c?.name || row.character_id}*\n\t\t♡ ${row.total} favoritos.\n`;
  });

  m.reply(txt.trim());
};

handler.help = ['favtop'];
handler.tags = ['anime'];
handler.command = ['favtop', 'favoritetop', 'topfav'];
handler.group = true;
handler.register = true;

export default handler;
