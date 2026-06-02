import { prepareWAMessageMedia } from '@whiskeysockets/baileys';

let handler = async (m, { conn, args }) => {
  try {
    let id = args?.[0]?.match(/\d+\-\d+@g.us/) || m.chat;

    const participantesUnicos = Object.values(conn.chats[id]?.messages || {})
      .map((item) => item.key.participant)
      .filter((value, index, self) => self.indexOf(value) === index);

    const listaEnLinea =
      participantesUnicos
        .map((k) => `@${k.split("@")[0]}`)
        .join("\n") || "*✧ No hay usuarios en línea en este momento :c.*";

    const urlPreview = 'https://github.com';
    const mensaje = `*Lista de usuarios en línea:*\n\n${listaEnLinea}\n\n> ${dev}\n\n${urlPreview}`;

    // 1. Descargar la imagen como Buffer para asegurar que Baileys procese el icono 🪴
    const response = await fetch("https://avatars.githubusercontent.com/u/9919?s=280&v=4");
    const buffer = Buffer.from(await response.arrayBuffer());

    // 2. Pasamos el Buffer directamente en lugar de la URL
    const media = await prepareWAMessageMedia(
      { image: buffer },
      {
        upload: conn.waUploadToServer,
        mediaTypeOverride: 'thumbnail-link',
      }
    );

    const { imageMessage: thumb } = media;

    // 3. Verificamos opcionalmente las propiedades con "?." por seguridad
    const content = {
      extendedTextMessage: {
        text: mensaje,
        matchedText: urlPreview,
        title: 'Usuarios Activos 🪴',
        description: "Revisa quién está en línea",
        previewType: 0,
        jpegThumbnail: thumb?.jpegThumbnail?.toString('base64') ?? '',
        thumbnailDirectPath: thumb?.directPath,
        thumbnailSha256: thumb?.fileSha256?.toString('base64') ?? '',
        thumbnailEncSha256: thumb?.fileEncSha256?.toString('base64') ?? '',
        mediaKey: thumb?.mediaKey?.toString('base64') ?? '',
        mediaKeyTimestamp: thumb?.mediaKeyTimestamp,
        thumbnailHeight: thumb?.height,
        thumbnailWidth: thumb?.width,
        inviteLinkGroupTypeV2: 0,
        contextInfo: {
          mentionedJid: participantesUnicos
        },
      },
    };

    await conn.relayMessage(m.chat, content, { messageId: m.key.id });
    await m.react("✅");

  } catch (error) {
    console.error(error);
    await m.reply(`Hubo un error al enviar la lista de usuarios. 🍂`);
  }
};

handler.help = ["listonline"];
handler.tags = ["grupo"];
handler.command = ["listonline", "online", "linea", "enlinea"];
handler.group = true;
handler.fail = null;

export default handler;
