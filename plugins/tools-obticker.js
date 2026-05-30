import axios from 'axios'

// 1. Incluimos la clase StickerLy
class StickerLy {
    async detail(url) {
        const match = url.match(/\/s\/([^\/\?#]+)/);
        if (!match) throw new Error('URL inválida. Usa un enlace de compartir de sticker.ly (ej: https://sticker.ly/s/XYZ123)');

        const { data } = await axios.get(`https://api.sticker.ly/v4/stickerPack/${match[1]}?needRelation=true`, {
            headers: {
                'user-agent': 'androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)',
                'content-type': 'application/json',
                'accept-encoding': 'gzip'
            }
        });

        return {
            name: data.result.name,
            author: data.result.user.displayName,
            stickers: data.result.stickers.map(stick => ({
                fileName: stick.fileName,
                isAnimated: stick.isAnimated,
                imageUrl: `${data.result.resourceUrlPrefix}${stick.fileName}`
            })),
            stickerCount: data.result.stickers.length
        };
    }
}

// 2. Creamos el handler del comando
let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Verificamos si el usuario envió un enlace
    if (!text) {
        return m.reply(`⚠️ Por favor, ingresa un enlace de Sticker.ly.\n*Ejemplo:* ${usedPrefix + command} https://sticker.ly/s/123456`);
    }

    if (!text.includes('sticker.ly/s/')) {
        return m.reply('⚠️ El enlace no parece ser válido. Asegúrate de que contenga "sticker.ly/s/".');
    }

    await m.react('⏳'); // Reacción de carga

    try {
        const api = new StickerLy();
        const packDetails = await api.detail(text);
        
        // Avisamos al usuario que empezó la descarga
        let infoMessage = `📦 *PAQUETE ENCONTRADO*\n\n`;
        infoMessage += `🏷️ *Nombre:* ${packDetails.name}\n`;
        infoMessage += `👤 *Autor:* ${packDetails.author}\n`;
        infoMessage += `📊 *Total de stickers:* ${packDetails.stickerCount}\n\n`;
        infoMessage += `⏳ *Descargando los primeros 10 stickers para evitar spam...*`;
        
        await m.reply(infoMessage);

        // Limitamos a 10 stickers por seguridad anti-ban de WhatsApp
        const maxStickers = Math.min(packDetails.stickers.length, 10);
        
        for (let i = 0; i < maxStickers; i++) {
            const stickerData = packDetails.stickers[i];
            
            try {
                // Descargamos el sticker como buffer
                const response = await axios.get(stickerData.imageUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data);
                
                // Lo enviamos al chat
                await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m });
                
                // Pausa de 1.5 segundos entre stickers para evitar que WhatsApp lo detecte como spam
                await new Promise(resolve => setTimeout(resolve, 1500));
                
            } catch (stickerError) {
                console.error(`Error al enviar el sticker ${i+1}:`, stickerError.message);
            }
        }
        
        await m.react('✅'); // Reacción de éxito al terminar

    } catch (e) {
        console.error(e);
        await m.react('❌');
        m.reply(`❌ Ocurrió un error al intentar descargar el paquete. Verifica que el enlace sea correcto y público.\n\n*Error:* ${e.message}`);
    }
}

// 3. Metadatos del comando
handler.help = ['stickerly <url>']
handler.tags = ['descargas', 'sticker']
handler.command = ['stickerly', 'sl', 'dlsticker']
handler.group = false // Ponlo en true si solo quieres que se use en grupos

export default handler
