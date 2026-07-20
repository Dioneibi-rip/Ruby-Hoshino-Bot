// Ya no necesitas importar googlethis ni axios
// Usaremos el fetch nativo de Node.js

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const rwait = '⏳';
  
  if (!text) {
    return conn.reply(m.chat, ` ׄ᱉᱉ Por favor, ingresa un término. ✧ 𝗘j𝗲m𝗽l𝗼: ${usedPrefix + command} paisajes naturales`, m);
  }
  
  await m.react(rwait);
  await conn.reply(m.chat, ' 🌿 ׄ ⢟ 𝗕𝘂𝘀𝗰𝗮𝗻𝗱𝗼 𝗹𝗮𝘀 𝗳𝗼𝘁𝗶𝘁𝗼𝘀 𝗺á𝘀 𝗹𝗶𝗻𝗱𝗮𝘀, 𝗲𝘀𝗽𝗲𝗿𝗲 𝘂𝗻 𝗺𝗼𝗺𝗲𝗻𝘁𝗼... 𞋬 🌱', m);
  
  try {
    // 1. Hacemos una petición ligera a Bing Images
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const html = await response.text();
    
    // 2. Extraemos los enlaces originales de las imágenes usando Regex (cero librerías de scraping)
    const regex = /murl":"(.*?)"/g;
    let match;
    const images = [];
    
    // 3. Filtramos hasta obtener 4 imágenes válidas
    while ((match = regex.exec(html)) !== null && images.length < 4) {
      images.push(match[1]);
    }
    
    if (!images.length) {
      await m.react('❌');
      return conn.reply(m.chat, `*🍂 No logré encontrar imágenes para:* ${text}`, m);
    }
    
    // 4. Armamos el carrusel tal cual lo tenías
    const messages = images.map((image, index) => [
      `🪴 Imagen ${index + 1}`,
      dev, // Asegúrate de que esta variable 'dev' esté definida en el entorno de tu bot
      image,
      [[]], [[]], [[]], [[]]
    ]);
    
    await conn.sendCarousel(
      m.chat,
      `*🌿 Resultado de:* ${text}`,
      '⪛✰ ɪᴍᴀɢᴇɴ - ʙᴜsǫᴜᴇᴅᴀ ✰⪜',
      null,
      messages,
      m
    );
    
    await m.react('✅');
    
  } catch (error) {
    console.error(error);
    await m.react('✖️');
    conn.reply(m.chat, '*🥀 Ocurrió un error de conexión al buscar las imágenes. Intenta con otra palabra.*', m);
    return false;
  }
};

handler.help = ['imagen <texto>'];
handler.tags = ['buscador', 'tools', 'descargas'];
handler.command = ['image', 'imagen', 'img'];
handler.register = true;

export default handler;