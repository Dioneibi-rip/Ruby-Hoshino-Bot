import { promises as fs } from 'fs';
const charactersFilePath = './src/database/characters.json';

async function loadCharacters() {
  const data = await fs.readFile(charactersFilePath, 'utf-8');
  return JSON.parse(data);
}

let handler = async (m) => {
  const characters = await loadCharacters();
  const top = characters
    .filter(c => c.favorites)
    .sort((a, b) => b.favorites - a.favorites)
    .slice(0, 11);

  if (top.length === 0) return m.reply('✿ Aún no hay personajes favoritos.');

  let txt = `✰ *Top de personajes favoritos:*\n\n`;
  top.forEach((c, i) => {
    txt += `#${i + 1} » *${c.name}*\n\t\t♡ ${c.favorites} favoritos.\n`;
  });

  m.reply(txt.trim());
};

handler.help = ['favtop'];
handler.tags = ['anime'];
handler.command = ['favtop', 'favoritetop'];
handler.group = true;
handler.register = true;

export default handler;
