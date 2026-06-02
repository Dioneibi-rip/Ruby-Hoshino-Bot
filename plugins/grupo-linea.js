import { prepareWAMessageMedia } from '@whiskeysockets/baileys';

let handler = async (m, { conn, args }) => {
  try {
    let id = args?.[0]?.match(/\d+\-\d+@g.us/) || m.chat;

    const participantesUnicos = Object.values(conn.chats[id]?.messages || {})
      .map((item) => item.key.participant)
      .filter((value, index, self) => self.indexOf(value) === index);

    const listaEnLinea =
      participantesUnicos
        .map((k) => `🌸 @${k.split("@")[0]}`)
        .join("\n") || "*✧ No hay usuarios en línea en este momento :c.*";

    // Si 'dev' no está definido globalmente, puedes usar algo como "Bot Kawaii ✨"
    const mensaje = `*♡ Lista de usuarios en línea:*\n\n${listaEnLinea}\n\n> ${typeof dev !== 'undefined' ? dev : 'Bot Kawaii ✨'}`;

    // --- SOLUCIÓN DE NEKOSMICO APLICADA ---
    
    // 1. Preparamos la imagen (Link funcional de prueba)
    const imgUrl = "https://github.com/github.png"; 
    const linkDestino = "https://github.com/WhiskeySockets/Baileys";

    const media = await prepareWAMessageMedia(
      { image: { url: imgUrl } }, 
      {
        upload: conn.waUploadToServer,
        mediaTypeOverride: 'thumbnail-link', // Esto es clave para que lo tome como miniatura
      }
    );

    const { imageMessage: thumb } = media;

    // 2. Construimos el mensaje extendido imitando el preview nativo
    const content = {
      extendedTextMessage: {
        text: mensaje,
        matchedText: linkDestino, // El link que desencadena el preview
        title: 'Usuarios Activos 💖',
        description: "¡Mira quién está conectado ahora mismo!",
        previewType: 0,
        jpegThumbnail: thumb.jpegThumbnail?.toString('base64') ?? '',
        thumbnailDirectPath: thumb.directPath,
        thumbnailSha256: thumb.fileSha256?.toString('base64') ?? '',
        thumbnailEncSha256: thumb.fileEncSha256?.toString('base64') ?? '',
        mediaKey: thumb.mediaKey?.toString('base64') ?? '',
        mediaKeyTimestamp: thumb.mediaKeyTimestamp,
        thumbnailHeight: thumb.height,
        thumbnailWidth: thumb.width,
        inviteLinkGroupTypeV2: 0,
        contextInfo: {
          mentionedJid: participantesUnicos // Mantenemos las menciones funcionando
        },
      },
    };

    // 3. Enviamos usando relayMessage para evitar que Baileys sobreescriba el formato
    await conn.relayMessage(m.chat, content, {});
    await m.react("✅");

  } catch (error) {
    console.error(error);
    await m.reply(`😿 Hubo un error al enviar la lista de usuarios.`);
  }
};

handler.help = ["listonline"];
handler.tags = ["grupo"];
handler.command = ["listonline", "online", "linea", "enlinea"];
handler.group = true;
handler.fail = null;

export default handler;
