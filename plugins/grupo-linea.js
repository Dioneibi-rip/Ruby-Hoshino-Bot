import { prepareWAMessageMedia } from '@whiskeysockets/baileys';

let handler = async (m, { conn, args }) => {
  try {
    let id = args?.[0]?.match(/\d+\-\d+@g.us/) || m.chat;

    // Obtener participantes únicos
    const participantesUnicos = Object.values(conn.chats[id]?.messages || {})
      .map((item) => item.key.participant)
      .filter((value, index, self) => self.indexOf(value) === index);

    const listaEnLinea =
      participantesUnicos
        .map((k) => `@${k.split("@")[0]}`)
        .join("\n") || "*✧ No hay usuarios en línea en este momento :c.*";

    const mensaje = `*Lista de usuarios en línea:*\n\n${listaEnLinea}\n\n> ${dev}`;

    // 1. Preparar la media simulando un enlace de miniatura 🍃
    const media = await prepareWAMessageMedia(
      { image: { url: "https://i.pinimg.com/736x/40/5a/17/405a170d05df4de50e01e8c5cd2a7250.jpg" } }, // URL de la imagen a mostrar
      {
        upload: conn.waUploadToServer,
        mediaTypeOverride: 'thumbnail-link',
      }
    );

    const { imageMessage: thumb } = media;

    // 2. Construir el contenido con extendedTextMessage
    const content = {
      extendedTextMessage: {
        text: mensaje,
        matchedText: 'https://github.com', // Texto que fuerza la validación del preview
        title: 'Usuarios Activos 🪴',
        description: "Revisa quién está en línea",
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

    // 3. Enviar mediante relayMessage
    await conn.relayMessage(m.chat, content, { messageId: m.key.id });
    await m.react("✅");

  } catch (error) {
    console.error(error);
    await m.reply(`${msm} Hubo un error al enviar la lista de usuarios. 🍂`);
  }
};

handler.help = ["listonline"];
handler.tags = ["grupo"];
handler.command = ["listonline", "online", "linea", "enlinea"];
handler.group = true;
handler.fail = null;

export default handler;
