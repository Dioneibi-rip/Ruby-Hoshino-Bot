import fetch from 'node-fetch';
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageContent, proto } = pkg;

const newsletterJid = '120363335626706839@newsletter';
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭';
const channelUrl = 'https://whatsapp.com/channel/0029Vag9VSI2ZjCocqa2lB1y';

const iconos = [
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%A4%8D%20(1).jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%8C%9FRuby%20Hoshino%F0%9F%8C%9F.jpeg",
    "https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%9D%A4.jpeg"
    // ... puedes añadir el resto de tus enlaces aquí
];

const handler = async (type, conn, m, comando) => {
    const imgUrl = iconos[Math.floor(Math.random() * iconos.length)];

    try {
        // 1. Obtenemos el buffer de la imagen
        const { data: thumb } = await conn.getFile(imgUrl);

        const frases = {
            rowner: '「🌺」 *Gomenasai~! Esta función solo la puede usar mi creador celestial...*',
            owner: '「🌸」 *¡Nyaa~! Solo mi creador y programadores pueden usar este comando~!*',
            premium: '「🍡」 *Ehh~? Esta función es exclusiva para usuarios Premium-desu~!*',
            group: '「🐾」 *¡Onii-chan~! Este comando solo puede usarse en grupos grupales~!*',
            admin: '「🧸」 *¡Kyah~! Solo los admin-senpai pueden usar esta habilidad~!*',
            unreg: `🍥 𝑶𝒉 𝒏𝒐~! *¡Aún no estás registrado~!*`
            // ... añade las demás que necesites
        };

        const msgText = frases[type] || `¡Ups! No tienes permiso para usar esto.`;

        // 2. GENERACIÓN DEL CONTENIDO DE IMAGEN (El truco para obtener los tokens de WhatsApp)
        const messageContent = await generateWAMessageContent(
            { image: { url: imgUrl } },
            { upload: conn.waUploadToServer }
        );

        const imageMsg = messageContent.imageMessage;

        // 3. CONSTRUCCIÓN DEL RELAY MESSAGE (Simulando una previsualización real de link)
        const content = {
            extendedTextMessage: {
                text: `${msgText}\n\n${channelUrl}`,
                matchedText: channelUrl, 
                description: "¡Únete a nuestro canal para actualizaciones! ✨",
                title: "⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·",
                previewType: 0, 
                jpegThumbnail: thumb,
                // Estos campos "engañan" a WhatsApp haciendo creer que la imagen ya está en sus servidores
                thumbnailDirectPath: imageMsg.directPath,
                thumbnailSha256: imageMsg.fileSha256,
                thumbnailEncSha256: imageMsg.fileEncSha256,
                mediaKey: imageMsg.mediaKey,
                mediaKeyTimestamp: imageMsg.mediaKeyTimestamp,
                thumbnailHeight: 720,
                thumbnailWidth: 1280,
                contextInfo: {
                    mentionedJid: [m.sender],
                    isForwarded: true,
                    forwardingScore: 1,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid,
                        newsletterName,
                        serverMessageId: -1
                    }
                }
            }
        };

        // 4. Enviamos mediante relayMessage (es más potente que reply)
        await conn.relayMessage(m.chat, content, { quoted: m });
        await m.react('✖️');

    } catch (e) {
        console.error('Error en el Bypass de Ruby:', e);
        // Si el bypass falla, enviamos un texto simple para no dejar al usuario sin respuesta
        return conn.reply(m.chat, "Hubo un error al mostrar la advertencia.", m);
    }
};

export default handler;
