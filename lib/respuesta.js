import fetch from 'node-fetch';
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageContent, proto } = pkg;

const newsletterJid = '120363335626706839@newsletter';
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭';

const handler = async (type, conn, m, comando) => {
    // Usamos el "Truco de YouTube" que hace que el Play se vea bien
    const youtubeTrickUrl = "https://www.youtube.com/watch?v=TUx1pAioh1Y"; 
    const channelUrl = 'https://whatsapp.com/channel/0029Vag9VSI2ZjCocqa2lB1y';

    const frases = {
        rowner: '「🌺」 *Gomenasai~! Esta función solo la puede usar mi creador celestial...*',
        owner: '「🌸」 *¡Nyaa~! Solo mi creador y programadores pueden usar este comando~!*',
        admin: '「🧸」 *¡Kyah~! Solo los admin-senpai pueden usar esta habilidad~!*',
        unreg: '🍥 𝑶𝒉 𝒏𝒐~! *¡Aún no estás registrado~!*'
    };

    const msgText = frases[type] || `¡Ups! No tienes permiso.`;

    try {
        // Elegimos una imagen aleatoria de tus iconos
        const imgUrl = iconos[Math.floor(Math.random() * iconos.length)];
        const { data: thumb } = await conn.getFile(imgUrl);

        // GENERAMOS EL CONTENIDO (Bypass de visibilidad)
        const messageContent = await generateWAMessageContent(
            { image: { url: imgUrl } },
            { upload: conn.waUploadToServer }
        );
        const imageMsg = messageContent.imageMessage;

        const content = {
            extendedTextMessage: {
                // Para ocultar el link lo más posible, lo ponemos al final con muchos espacios
                text: `${msgText}\n\n\n\n${channelUrl}`,
                matchedText: channelUrl,
                previewType: 0,
                jpegThumbnail: thumb,
                // DATOS CLAVE PARA QUE NO SEA CIRCULAR:
                thumbnailDirectPath: imageMsg.directPath,
                thumbnailSha256: imageMsg.fileSha256,
                thumbnailEncSha256: imageMsg.fileEncSha256,
                mediaKey: imageMsg.mediaKey,
                mediaKeyTimestamp: imageMsg.mediaKeyTimestamp,
                thumbnailHeight: 800, // Forzamos un tamaño mayor
                thumbnailWidth: 800,  // Proporción 1:1 para que sea cuadrado como el Play
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid,
                        newsletterName,
                        serverMessageId: -1
                    },
                    externalAdReply: {
                        title: '⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·',
                        body: 'I🎀 𓈒꒰ 𝐘𝐚𝐲~ 𝐇𝐨𝐥𝐚𝐚𝐚! (≧∇≦)/',
                        mediaType: 2, // <--- CAMBIAMOS A 2 (Video). Esto quita lo circular.
                        thumbnail: thumb,
                        sourceUrl: channelUrl,
                        mediaUrl: youtubeTrickUrl, // El truco de YouTube para la visibilidad
                        renderLargerThumbnail: true // <--- CAMBIAMOS A TRUE. Esto la hace grande y no pequeña.
                    }
                }
            }
        };

        await conn.relayMessage(m.chat, content, { quoted: m });
        await m.react('✖️');

    } catch (e) {
        console.error(e);
    }
};
