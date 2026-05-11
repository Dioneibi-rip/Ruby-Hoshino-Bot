import { join } from "path" // Para manejar rutas como en el play
import fs from "fs" // Por si necesitas guardar algo temporal

// --- VALORES NECESARIOS ---
const newsletterJid = '120363335626706839@newsletter';
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭';
const packname = '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥';

const iconos = [
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%A4%8D%20(1).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%8C%9FRuby%20Hoshino%F0%9F%8C%9F.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20hoshino%20%F0%9F%A7%A1.jpeg"
    // ... el resto de tus links
];

const getRandomIcono = () => iconos[Math.floor(Math.random() * iconos.length)];

const handler = async (type, conn, m, comando) => {
  const mensajes = {
    rowner: '「🌺」 *Gomenasai~! Esta función solo la puede usar mi creador celestial...*',
    owner: '「🌸」 *¡Nyaa~! Solo mi creador y programadores pueden usar este comando~!*',
    mods: '「🌟」 *Uguu~ Esto eso solo lo pueden usar mis desarrolladores mágicos~!*',
    premium: '「🍡」 *Ehh~? Esta función es exclusiva para usuarios Premium-desu~!*',
    group: '「🐾」 *¡Onii-chan~! Este comando solo puede usarse en grupos grupales~!*',
    private: '「🎀」 *Shh~ Este comando es solo para ti y para mí, en privado~*',
    admin: '「🧸」 *¡Kyah~! Solo los admin-senpai pueden usar esta habilidad~!*',
    botAdmin: '「🔧」 *¡Espera! Necesito ser admin para que este comando funcione correctamente.*',
    unreg: `🍥 𝑶𝒉 𝒏𝒐~! *¡Aún no estás registrado~!*`,
    restrict: '「📵」 *¡Ouh~! Esta función está dormida por ahora~*'
  };

  const texto = mensajes[type];
  if (!texto) return true;

  try {
    // 1. Obtenemos el icono aleatorio
    const iconoUrl = getRandomIcono();
    
    // 2. IMITANDO AL PLAY: Descargamos el archivo físicamente
    // Usamos conn.getFile pero forzamos que sea un buffer real
    let response = await conn.getFile(iconoUrl);
    let thumb = response.data;

    // 3. El link de respaldo (sourceUrl) debe ser un link que WhatsApp "respete"
    // Si 'redes' no existe, usamos un link de YT o GitHub directo como en el play
    const linkEstiloPlay = (typeof redes !== 'undefined' && redes) ? redes : iconoUrl;

    // 4. Enviamos usando la estructura exacta que le funciona al play
    await conn.reply(m.chat, texto, m, {
      contextInfo: {
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
          newsletterJid,
          newsletterName,
          serverMessageId: -1
        },
        externalAdReply: {
          title: packname,
          body: '🌸 ʀᴜʙʏ ʜᴏsʜɪɴᴏ sʏsᴛᴇᴍ',
          mediaType: 1,
          thumbnail: thumb, // El buffer que acabamos de descargar
          renderLargerThumbnail: false,
          sourceUrl: linkEstiloPlay,
          mediaUrl: linkEstiloPlay
        }
      }
    });

    // Reacción como en tu código original
    await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key }});

  } catch (e) {
    console.error("Error en el sistema de avisos:", e);
    // Si todo falla, enviamos texto simple para no dejar al usuario colgado
    await conn.reply(m.chat, texto, m);
  }

  return false; 
};

export default handler;
