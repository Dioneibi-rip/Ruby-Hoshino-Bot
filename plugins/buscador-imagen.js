import google from 'googlethis';

// Mapa de fuentes estéticas para títulos principales (puedes reutilizar tu toFancyText si lo prefieres global)
const aestheticFont = (text) => {
  const fonts = {
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
    'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗦', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇'
  };
  return text.split('').map(char => fonts[char] || char).join('');
};

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(m.chat, ` ׄ 𓆇 𝗣𝗼𝗿 𝗳𝗮𝘃𝗼𝗿, 𝗶𝗻𝗴𝗿𝗲𝘀𝗮 𝘂𝗻 𝘁é𝗿𝗺𝗶𝗻𝗼.\n🌿 ✧ 𝗘𝗷𝗲𝗺𝗽𝗹𝗼: *${usedPrefix + command} paisajes naturales*`, m);
  }

  // Indicadores de estado visuales y limpios (Uso de presencia y reacciones de Baileys)
  await m.react('⏳');
  await conn.sendPresenceUpdate('composing', m.chat); // Indica que el bot está "escribiendo" en el chat[span_3](start_span)[span_3](end_span)

  try {
    const results = await google.image(text, { safe: false });
    
    if (!results || results.length === 0) {
      await m.react('❌');
      return conn.reply(m.chat, `*🍂 No logré encontrar imágenes para:* _${text}_`, m);
    }

    // Tomamos las primeras 4 imágenes válidas
    const images = results.map(res => res.url).filter(Boolean).slice(0, 4);

    if (!images.length) {
      await m.react('❌');
      return conn.reply(m.chat, `*🥀 Los enlaces de las imágenes están rotos para:* _${text}_`, m);
    }

    // --- DECORACIÓN INTERACTIVA CON CARDS (BAILEYS MULTI-DEVICE) ---
    // Creamos un diseño interactivo usando la estructura de tarjetas de la documentación[span_4](start_span)[span_4](end_span)
    const cards = images.map((url, index) => ({
      image: { url: url }, // Baileys descarga y encripta el stream automáticamente[span_5](start_span)[span_5](end_span)
      title: aestheticFont(`Imagen `) + `✨ 0${index + 1}`,
      body: `🌿 Busqueda: ${text}`,
      footer: `🌟 otaku no ko bot`,
      buttons: [
        {
          name: 'cta_url',
          buttonParamsJson: JSON.stringify({
            display_text: '🌐 Ver en HD',
            url: url,
            merchant_url: url
          })
        }
      ]
    }));

    // Enviamos el mensaje interactivo con formato de carrusel de tarjetas[span_6](start_span)[span_6](end_span)
    await conn.sendMessage(m.chat, {
      text: `*🌿 ${aestheticFont('Resultados para')}:* _${text}_`,
      subtitle: `✨ sᴇᴀʀᴄʜ sʏsᴛᴇᴍ ✨`,
      footer: `🎨 ¡Disfruta tus fotitos!`,
      cards: cards
    }, { quoted: m });

    await m.react('✅');

  } catch (error) {
    console.error(error);
    await m.react('✖️');
    conn.reply(m.chat, '*🥀 Ocurrió un error de conexión al buscar las imágenes. Intenta de nuevo más tarde.*', m);
  }
};

handler.help = ['imagen <texto>'];
handler.tags = ['buscador', 'tools'];
handler.command = ['image', 'imagen', 'img'];
handler.register = true;

export default handler;
