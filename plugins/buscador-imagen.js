import google from 'googlethis';

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const rwait = '⏳';
  
  if (!text) {
    return conn.reply(m.chat, ` ׄ᱉᱉ Por favor, ingresa un término. ✧ 𝗘j𝗲m𝗽l𝗼: ${usedPrefix + command} paisajes naturales`, m);
  }
  
  await m.react(rwait);
  await conn.reply(m.chat, ' 🌿 ׄ ⢟ 𝗕𝘂𝘀𝗰𝗮𝗻𝗱𝗼 𝗹𝗮𝘀 𝗳𝗼𝘁𝗶𝘁𝗼𝘀 𝗺á𝘀 𝗹𝗶𝗻𝗱𝗮𝘀, 𝗲𝘀𝗽𝗲𝗿𝗲 𝘂𝗻 𝗺𝗼𝗺𝗲𝗻𝘁𝗼... 𞋬 🌱', m);
  
  try {
    const results = await google.image(text, { safe: false });
    
    if (!results || results.length === 0) {
      await m.react('❌');
      return conn.reply(m.chat, `*🍂 No logré encontrar imágenes para:* ${text}`, m);
    }
    
    const images = results.map(res => res.url).filter(Boolean).slice(0, 4);
    
    if (!images.length) {
      await m.react('❌');
      return conn.reply(m.chat, `*🍂 Los enlaces de las imágenes están rotos para:* ${text}`, m);
    }
    
    const cards = images.map((image, index) => ({
      image: { url: image },
      title: `🌱 ɪᴍᴀɢᴇɴ ${index + 1}`,
      body: `✨ ʙúsǫᴜᴇᴅᴀ: ${text}`,
      footer: 'ᴏᴛᴀᴋᴜ ɴᴏ ᴋᴏ ʙᴏᴛ',
      buttons: [
        {
          name: 'cta_url',
          buttonParamsJson: JSON.stringify({
            display_text: '🔎 ᴠᴇʀ ᴇɴ ғᴜᴇɴᴛᴇ',
            url: image,
            merchant_url: image
          })
        }
      ]
    }));
    
    await conn.sendMessage(m.chat, {
      text: `*🌿 ʀᴇsᴜʟᴛᴀᴅᴏs ᴅᴇ:* ${text}`,
      subtitle: '⪛✰ ɪᴍᴀɢᴇɴ - ʙᴜsǫᴜᴇᴅᴀ ✰⪜',
      footer: 'ᴀᴇsᴛʜᴇᴛɪᴄ sᴇᴀʀᴄʜ',
      cards: cards
    });
    
    await m.react('✅');
    
  } catch (error) {
    console.error(error);
    await m.react('✖️');
    conn.reply(m.chat, '*🥀 Ocurrió un error de conexión al buscar las imágenes. Intenta con otra palabra.*', m);
  }
};

handler.help = ['imagen <texto>'];
handler.tags = ['buscador', 'tools', 'descargas'];
handler.command = ['image', 'imagen', 'img'];
handler.register = true;

export default handler;
