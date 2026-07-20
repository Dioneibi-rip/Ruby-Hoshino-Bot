import axios from '../../library/http.js';

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const rwait = '⏳';
  
  if (!text) {
    return conn.reply(m.chat, ` ׄ᱉᱉ Por favor, ingresa un término. ✧ 𝗘j𝗲m𝗽l𝗼: ${usedPrefix + command} goku`, m);
  }
  
  await m.react(rwait);
  await conn.reply(m.chat, ' 🌿 ׄ ⢟ 𝗕𝘂𝘀𝗰𝗮𝗻𝗱𝗼 𝗹𝗮𝘀 𝗳𝗼𝘁𝗶𝘁𝗼𝘀 𝗺á𝘀 𝗹𝗶𝗻𝗱𝗮𝘀, 𝗲𝘀𝗽𝗲𝗿𝗲 𝘂𝗻 𝗺𝗼𝗺𝗲𝗻𝘁𝗼... 𞋬 🌱', m);
  
  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(text)}`;
    
    // Usamos tu librería personalizada pasándole las cabeceras y el tipo de respuesta
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9'
      },
      responseType: 'text' // Esto le dice a tu wrapper que asigne el HTML directamente a data
    });
    
    // Tu wrapper guarda el contenido en data
    const html = response.data;
    const images = [];
    
    const regexList = [
      /"murl":"([^"]+)"/g,
      /murl&quot;:&quot;([^&]+)&quot;/g,
      /"(https?:\/\/[^"]+?\.(?:jpe?g|png))"/gi
    ];

    for (const regex of regexList) {
      let match;
      while ((match = regex.exec(html)) !== null && images.length < 4) {
        if (!images.includes(match[1])) {
          images.push(match[1]);
        }
      }
      if (images.length >= 4) break; 
    }
    
    if (!images.length) {
      await m.react('❌');
      return conn.reply(m.chat, `*🍂 No logré encontrar imágenes para:* ${text}`, m);
    }
    
    const messages = images.map((image, index) => [
      `🪴 Imagen ${index + 1}`,
      'dev', // Recuerda verificar que 'dev' esté definido
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