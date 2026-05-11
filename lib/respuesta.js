// --- VALORES NECESARIOS PARA LA NUEVA FUNCIONALIDAD ---
const newsletterJid = '120363335626706839@newsletter';
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭';
const packname = '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥';

// Array de miniaturas
const iconos = [
      "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%A4%8D%20(1).jpeg",
      "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%8C%9FRuby%20Hoshino%F0%9F%8C%9F.jpeg",
      // ... (asume que aquí están todos tus demás links, no los quité, solo los abrevio por lectura)
      "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/(%F0%9F%8E%80)%20%20%E2%80%A6%20%20%E2%97%9E%20ruby%20%E2%97%9F%20%E2%98%86.jpeg"
];

// Función para obtener una aleatoria
const getRandomIcono = () => iconos[Math.floor(Math.random() * iconos.length)];

/**
 * Plugin centralizado para manejar todos los mensajes de error de permisos.
 */
// ⚠️ IMPORTANTE: Transformamos la función a 'async' para poder descargar la imagen
const handler = async (type, conn, m, comando) => {
  const msg = {
    rowner: '「🌺」 *Gomenasai~! Esta función solo la puede usar mi creador celestial...* 🌌\n\n> *Dioneibi-sama.*',
    owner: '「🌸」 *¡Nyaa~! Solo mi creador y programadores pueden usar este comando~!* 💾💕',
    mods: '「🌟」 *Uguu~ Esto eso solo lo pueden usar mis desarrolladores mágicos~!* 🔮',
    premium: '「🍡」 *Ehh~? Esta función es exclusiva para usuarios Premium-desu~!* ✨\n\n💫 *¿No eres premium aún? Consíguelo ahora usando:*\n> ✨ *.comprarpremium 2 dias* (o reemplaza "2 dias" por la cantidad que desees).',
    group: '「🐾」 *¡Onii-chan~! Este comando solo puede usarse en grupos grupales~!* 👥',
    private: '「🎀」 *Shh~ Este comando es solo para ti y para mí, en privado~* 💌',
    admin: '「🧸」 *¡Kyah~! Solo los admin-senpai pueden usar esta habilidad~!* 🛡️',
    botAdmin: '「🔧」 *¡Espera! Necesito ser admin para que este comando funcione correctamente.*\n\n🔧 *Hazme admin y desataré todo mi poder~*',
    unreg: `🍥 𝑶𝒉 𝒏𝒐~! *¡Aún no estás registrado~!* 😿\nNecesito conocerte para que uses mis comandos~ ✨\n\n📝 Por favor regístrate con:\n */reg nombre.edad*\n\n🎶 Ejemplo encantado:\n */reg Dioneibi-kun.15*\n\n💖 ¡Así podré reconocerte~! (⁎˃ᴗ˂⁎)`,
    restrict: '「📵」 *¡Ouh~! Esta función está dormida por ahora~* 💤'
  }[type];

  if (msg) {
    // 1. Preparamos la imagen convirtiéndola en Buffer (Igual que en tu comando play)
    let thumbBuffer = null;
    try {
      const urlImagen = getRandomIcono();
      thumbBuffer = (await conn.getFile(urlImagen))?.data;
    } catch (e) {
      console.log("Error al descargar el thumbnail para el mensaje de permisos.");
    }

    // 2. Armamos el contexto asegurándonos de usar 'thumbnail' y no 'thumbnailUrl'
    const contextInfo = {
      mentionedJid: [m.sender],
      isForwarded: true,
      forwardingScore: 999,
      forwardedNewsletterMessageInfo: {
        newsletterJid: newsletterJid, // Usamos la variable ya definida arriba
        newsletterName: newsletterName, // Usamos la variable ya definida arriba
        serverMessageId: -1
      },
      externalAdReply: {
        title: packname,
        body: 'I🎀 𓈒꒰ 𝐘𝐚𝐲~ 𝐇𝐨𝐥𝐚𝐚𝐚! (≧∇≦)/',
        thumbnail: thumbBuffer, // <-- AQUÍ ESTÁ LA MAGIA: Pasamos el Buffer directamente
        // Aseguramos que si 'redes' no existe, ponga un link por defecto para que no se crashee.
        sourceUrl: typeof redes !== 'undefined' ? redes : 'https://github.com/Dioneibi-rip',
        mediaType: 1,
        renderLargerThumbnail: false
      }
    };

    // 3. Enviamos el mensaje y reaccionamos
    await conn.reply(m.chat, msg, m, { contextInfo });
    return m.react('✖️');
  }

  return true;
};

export default handler;
