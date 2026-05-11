// --- VALORES NECESARIOS ---
const newsletterJid = '120363335626706839@newsletter';
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭';
const packname = '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥';

const iconos = [
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%A4%8D%20(1).jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%8C%9FRuby%20Hoshino%F0%9F%8C%9F.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%97%8B%F0%9D%97%8E%F0%9D%96%BB%F0%9D%97%92%20%F0%9D%97%81%F0%9D%97%88%F0%9D%97%8C%F0%9D%97%81%F0%9D%97%82%F0%9D%97%87%F0%9D%97%88.jpeg",
  "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%93%A1%F0%9D%93%BE%F0%9D%93%AB%F0%9D%94%82%20%F0%9D%93%98%F0%9D%93%AC%F0%9D%93%B8%F0%9D%93%B7%F0%9D%93%BC%20%E2%AD%90%F0%9F%92%AB.jpeg"
  // ... (puedes dejar todos tus links aquí, recorté por espacio)
];

const getRandomIcono = () => iconos[Math.floor(Math.random() * iconos.length)];

const handler = async (type, conn, m, comando) => {
  const mensajes = {
    rowner: '「🌺」 *Gomenasai~! Esta función solo la puede usar mi creador celestial...* 🌌\n\n> *Dioneibi-sama.*',
    owner: '「🌸」 *¡Nyaa~! Solo mi creador y programadores pueden usar este comando~!* 💾💕',
    mods: '「🌟」 *Uguu~ Esto eso solo lo pueden usar mis desarrolladores mágicos~!* 🔮',
    premium: '「🍡」 *Ehh~? Esta función es exclusiva para usuarios Premium-desu~!* ✨\n\n💫 *¿No eres premium aún? Consíguelo ahora usando:*\n> ✨ *.comprarpremium 2 dias*',
    group: '「🐾」 *¡Onii-chan~! Este comando solo puede usarse en grupos grupales~!* 👥',
    private: '「🎀」 *Shh~ Este comando es solo para ti y para mí, en privado~* 💌',
    admin: '「🧸」 *¡Kyah~! Solo los admin-senpai pueden usar esta habilidad~!* 🛡️',
    botAdmin: '「🔧」 *¡Espera! Necesito ser admin para que este comando funcione correctamente.*',
    unreg: `🍥 𝑶𝒉 𝒏𝒐~! *¡Aún no estás registrado~!* 😿\n📝 Por favor regístrate con:\n */reg nombre.edad*`,
    restrict: '「📵」 *¡Ouh~! Esta función está dormida por ahora~* 💤'
  };

  const textoMensaje = mensajes[type];

  if (textoMensaje) {
    try {
      // 1. Obtenemos el buffer igual que en el play
      const imgUrl = getRandomIcono();
      let thumbBuffer = (await conn.getFile(imgUrl))?.data;

      // 2. Definimos el enlace (importante que sea un string válido)
      const linkParaMostrar = typeof redes !== 'undefined' ? redes : 'https://github.com/Dioneibi-rip';

      // 3. Enviamos el mensaje con la estructura de objeto (sendMessage) 
      // Esta forma es más robusta que conn.reply para externalAdReply
      await conn.sendMessage(m.chat, {
        text: textoMensaje,
        contextInfo: {
          mentionedJid: [m.sender],
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
            thumbnail: thumbBuffer, // Buffer directo
            sourceUrl: linkParaMostrar,
            mediaUrl: linkParaMostrar,
            renderLargerThumbnail: false,
            showAdAttribution: true // Añadimos esto para forzar que sea visto como "anuncio"
          }
        }
      }, { quoted: m });

      // 4. Reaccionamos después de enviar
      await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key }});
      
    } catch (error) {
      console.error("Error en el handler de permisos:", error);
      // Fallback simple por si falla lo anterior
      await conn.reply(m.chat, mensajes[type], m);
    }
    return false; // Detiene la ejecución del comando que activó el error
  }
  return true;
};

export default handler;
