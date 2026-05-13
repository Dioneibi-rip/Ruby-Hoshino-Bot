import pkg from '@whiskeysockets/baileys';
const { generateWAMessageContent } = pkg;

// --- VALORES NECESARIOS ---
const newsletterJid = '120363335626706839@newsletter';
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭';
const packname = '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥';
const defaultSourceUrl = 'https://whatsapp.com/channel/0029Vag9VSI2ZjCocqa2lB1y';

// Array de miniaturas
const iconos = [
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%A4%8D%20(1).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%8C%9FRuby%20Hoshino%F0%9F%8C%9F.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%97%8B%F0%9D%97%8E%F0%9D%96%BB%F0%9D%97%92%20%F0%9D%97%81%F0%9D%97%88%F0%9D%97%8C%F0%9D%97%81%F0%9D%97%82%F0%9D%97%87%F0%9D%97%88.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%93%A1%F0%9D%93%BE%F0%9D%93%AB%F0%9D%94%82%20%F0%9D%93%98%F0%9D%93%AC%F0%9D%93%B8%F0%9D%93%B7%F0%9D%93%BC%20%E2%AD%90%F0%9F%92%AB.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%91%B9%F0%9D%92%96%F0%9D%92%83%F0%9D%92%9A%20%F0%9D%91%AF%F0%9D%92%90%F0%9D%92%94%F0%9D%92%89%F0%9D%92%8A%F0%9D%92%8F%F0%9D%92%90.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%9D%A4.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%86Hoshino%20Ruby%E2%98%86.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%85%20!!%20(2).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%85%20!!%20(1).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%CB%9A%20%E0%BC%98%E2%99%A1%20%E2%8B%86%EF%BD%A1%CB%9A%20Hoshino%20Ruby.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/ruby%20hoshino%20(9).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/ruby%20hoshino%20(11).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(15).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(14).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(13).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20hoshino%20%F0%9F%A7%A1.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20_%20oshi%20no%20ko%20_.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20-%20%F0%9F%8C%9F%5BOshi%20no%20Ko%5D%F0%9F%8C%9F%20icons.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(10).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20%23oshinokk.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%23oshinoko%20%23%EC%B5%9C%EC%95%A0%EC%9D%98%EC%95%84%EC%9D%B4.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%99%8D%F0%9D%99%AA%F0%9D%99%97%F0%9D%99%AE%20%F0%9D%99%83%F0%9D%99%A4%F0%9D%99%A8%F0%9D%99%9D%F0%9D%99%9E%F0%9D%99%A3%F0%9D%99%A4.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%8E%80%20%E2%8B%AE%20%F0%9D%91%B9%F0%9D%92%96%F0%9D%92%83%F0%9D%92%9A%20%F0%9D%92%8A%F0%9D%92%84%F0%9D%92%90%F0%9D%92%8F.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%85%20!!%20(3).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%9D%A4%EF%B8%8F%F0%9D%91%AF%F0%9D%92%90%F0%9D%92%94%F0%9D%92%89%F0%9D%92%8A%F0%9D%92%8F%F0%9D%92%90%20%F0%9D%91%B9%F0%9D%92%96%F0%9D%92%83%F0%9D%92%9A%E2%9D%A4%EF%B8%8F.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E0%AD%A8%E0%A7%8E.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(19).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(18).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(17).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(16).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(16).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(15).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(14).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(13).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(12).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Hoshino%20Ruby%20%E2%99%A1.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Hoshino%20Ruby%20(4).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/(%F0%9F%8E%80)%20%20%E2%80%A6%20%20%E2%97%9E%20ruby%20%E2%97%9F%20%E2%98%86.jpeg"
];

// Función para obtener una aleatoria
const getRandomIcono = () => iconos[Math.floor(Math.random() * iconos.length)]
  .replace('https://github.com/Dioneibi-rip/imagenes/blob/main/', 'https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/');

const getSourceUrl = () => globalThis.redes || defaultSourceUrl;

/**
 * Plugin centralizado para manejar todos los mensajes de error de permisos.
 */
const handler = async (type, conn, m, comando) => {
  const msgText = {
    rowner: '「🌺」 *Gomenasai~! Esta función solo la puede usar mi creador celestial...* 🌌\n\n> *Dioneibi-sama.*',
    owner: '「🌸」 *¡Nyaa~! Solo mi creador y programadores pueden usar este comando~!* 💾💕',
    mods: '「🌟」 *Uguu~ Esto eso solo lo pueden usar mis desarrolladores mágicos~!* 🔮',
    premium: '「🍡」 *Ehh~? Esta función es exclusiva para usuarios Premium-desu~!* ✨\n\n💫 *¿No eres premium aún? Consíguelo ahora usando:*\n> ✨ *.comprarpremium 2 dias*  (o reemplaza "2 dias" por la cantidad que desees).',
    group: '「🐾」 *¡Onii-chan~! Este comando solo puede usarse en grupos grupales~!* 👥',
    private: '「🎀」 *Shh~ Este comando es solo para ti y para mí, en privado~* 💌',
    admin: '「🧸」 *¡Kyah~! Solo los admin-senpai pueden usar esta habilidad~!* 🛡️',
    botAdmin: '「🔧」 *¡Espera! Necesito ser admin para que este comando funcione correctamente.*\n\n🔧 *Hazme admin y desataré todo mi poder~*',
    unreg: `🍥 𝑶𝒉 𝒏𝒐~! *¡Aún no estás registrado~!* 😿\nNecesito conocerte para que uses mis comandos~ ✨\n\n📝 Por favor regístrate con:\n */reg nombre.edad*\n\n🎶 Ejemplo encantado:\n */reg Dioneibi-kun.15*\n\n💖 ¡Así podré reconocerte~! (⁎˃ᴗ˂⁎)`,
    restrict: '「📵」 *¡Ouh~! Esta función está dormida por ahora~* 💤'
  }[type];

  if (!msgText) return true;

  try {
    const imgUrl = getRandomIcono();
    const urlCanal = getSourceUrl();
    
    // Obtenemos el buffer de la imagen
    const file = await conn.getFile(imgUrl);
    const thumb = file?.data;

    // MAGIA DE BAILEYS: Subimos la imagen al servidor de WhatsApp simulando un mensaje real
    const messageContent = await generateWAMessageContent(
        { image: { url: imgUrl } },
        { upload: conn.waUploadToServer }
    );

    // Extraemos la data de la imagen ya subida
    const imageMsg = messageContent.imageMessage;

    // Construimos el mensaje de enlace enriquecido manualmente
    const content = {
        extendedTextMessage: {
            text: `${msgText}`, // Puedes añadir la URL del canal aquí abajo si quieres que sea clickeable en el texto
            matchedText: urlCanal,
            canonicalUrl: urlCanal,
            description: "I🎀 𓈒꒰ 𝐘𝐚𝐲~ 𝐇𝐨𝐥𝐚𝐚𝐚! (≧∇≦)/",
            title: packname,
            previewType: 0,
            jpegThumbnail: thumb,
            
            // Inyectamos las llaves nativas (Bypass real)
            thumbnailDirectPath: imageMsg.directPath,
            thumbnailSha256: imageMsg.fileSha256,
            thumbnailEncSha256: imageMsg.fileEncSha256,
            mediaKey: imageMsg.mediaKey,
            mediaKeyTimestamp: imageMsg.mediaKeyTimestamp,
            
            // Opcional: Forzar renderizado grande si las dimensiones lo permiten
            thumbnailHeight: 720,
            thumbnailWidth: 1280,
            
            contextInfo: {
                mentionedJid: [m.sender],
                isForwarded: true,
                forwardingScore: 999,
                forwardedNewsletterMessageInfo: {
                    newsletterJid,
                    newsletterName,
                    serverMessageId: -1
                }
            }
        }
    };

    // Enviamos el mensaje interceptado usando relayMessage
    await conn.relayMessage(m.chat, content, { quoted: m });
    await m.react('✖️');

  } catch (error) {
    console.error('Error enviando advertencia avanzada Ruby:', error);
    // Si algo falla, enviamos el mensaje normal sin el adReply para que no se quede mudo
    return conn.reply(m.chat, msgText, m).then(_ => m.react('✖️'));
  }
};

export default handler;
