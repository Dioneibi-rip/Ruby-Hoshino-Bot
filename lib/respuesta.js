const newsletterJid = '120363335626706839@newsletter';
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭';
const packname = '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥';

const iconos = [
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%A4%8D%20(1).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%9D%A4.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(15).jpeg"
];

const handler = async (type, conn, m, comando) => {
  const msg = {
    rowner: '「🌺」 *Gomenasai~! Esta función solo la puede usar mi creador celestial...*',
    owner: '「🌸」 *¡Nyaa~! Solo mi creador y programadores pueden usar este comando~!*',
    premium: '「🍡」 *Ehh~? Esta función es exclusiva para usuarios Premium-desu~!*',
    group: '「🐾」 *¡Onii-chan~! Este comando solo puede usarse en grupos grupales~!*',
    admin: '「🧸」 *¡Kyah~! Solo los admin-senpai pueden usar esta habilidad~!*',
    unreg: `🍥 𝑶𝒉 𝒏𝒐~! *¡Aún no estás registrado~!*`
  }[type];

  if (msg) {
    const urlAleatoria = iconos[Math.floor(Math.random() * iconos.length)];
    
    // 1. Obtenemos el buffer IGUAL que en el play
    let thumbBuffer = null;
    try {
      const res = await conn.getFile(urlAleatoria);
      thumbBuffer = res.data;
    } catch (e) {
      console.log("Error al obtener miniatura");
    }

    // 2. Usamos un link de YouTube real para "engañar" a la visibilidad
    // Si usas el link de tu canal aquí, WhatsApp Business lo verá bien, pero el Normal lo ocultará.
    // Por eso usamos este de YT que es "confiable".
    const youtubeTrick = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    await conn.reply(m.chat, msg, m, {
      contextInfo: {
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
          newsletterJid: newsletterJid,
          newsletterName: newsletterName,
          serverMessageId: -1
        },
        externalAdReply: {
          title: packname,
          body: 'I🎀 𓈒꒰ 𝐘𝐚𝐲~ 𝐇𝐨𝐥𝐚𝐚𝐚! (≧∇≦)/',
          mediaType: 1,
          thumbnail: thumbBuffer,
          renderLargerThumbnail: false, // Esto lo mantiene como "icono" cuadrado pequeño
          mediaUrl: youtubeTrick,
          sourceUrl: youtubeTrick 
        }
      }
    });
    
    return m.react('✖️');
  }
  return true;
};

export default handler;
