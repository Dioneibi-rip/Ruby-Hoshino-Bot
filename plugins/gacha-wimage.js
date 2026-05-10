import { loadCharacters, findCharacterByName } from '../lib/gacha-characters.js';

function formatUrl(url) {
  if (!url) return url;
  const clean = String(url).trim();

  if (clean.includes('github.com') && clean.includes('/blob/')) {
    return clean.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }

  if (clean.includes('github.com') && clean.includes('?raw=true')) {
    return clean.replace('github.com', 'raw.githubusercontent.com').replace('?raw=true', '');
  }

  if (clean.includes('raw.github.com')) {
    return clean.replace('raw.github.com', 'raw.githubusercontent.com');
  }

  return clean;
}

let handler = async (m, { conn, args }) => {
  if (!args.length) {
    return conn.reply(m.chat, '《✧》Por favor, proporciona el nombre de un personaje.', m);
  }

  const query = args.join(' ').trim();

  try {
    const characters = await loadCharacters();
    const character = findCharacterByName(characters, query);

    if (!character) {
      return conn.reply(m.chat, `《✧》No se ha encontrado el personaje *${query}*.`, m);
    }

    const imageList = Array.isArray(character.img) ? character.img : [];
    let randomImage = imageList[Math.floor(Math.random() * imageList.length)];

    if (!randomImage) {
      return conn.reply(m.chat, `《✧》No se encontró una imagen para *${character.name}*.`, m);
    }

    randomImage = formatUrl(randomImage);
    if (randomImage.match(/\.webp($|\?)/i)) {
      randomImage = `https://wsrv.nl/?url=${encodeURIComponent(randomImage)}&output=png`;
    }

    const message = `❀ Nombre » *${character.name}*\n⚥ Género » *${character.gender}*\n❖ Fuente » *${character.source}*`;

    await conn.sendMessage(m.chat, {
      image: { url: randomImage },
      mimetype: 'image/jpeg',
      caption: message
    }, { quoted: m });
  } catch (error) {
    await conn.reply(m.chat, `✘ Error al cargar la imagen del personaje: ${error.message}`, m);
  }
};

handler.help = ['wimage <nombre del personaje>'];
handler.tags = ['anime'];
handler.command = ['charimage', 'wimage', 'waifuimage'];
handler.group = true;

export default handler;
