import gis from 'g-i-s';

// Método seguro: Creamos una promesa manual para evitar que promisify rompa el código si g-i-s devuelve undefined
const googleImageSearch = (query) => {
    return new Promise((resolve, reject) => {
        gis(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results || []);
            }
        });
    });
};

const handler = async (m, { conn, text, usedPrefix, command }) => {
    // Declaramos las variables locales aquí para evitar errores de referencia
    const rwait = '⏳';
    const dev = '✨ ᴏᴛᴀᴋᴜ ɴᴏ ᴋᴏ ✨';
    
    if (!text) {
        return conn.reply(m.chat, `*₊˚.🎀 ╰┈➤ ¡Hola! Por favor, ingresa lo que deseas buscar.*\n*✧ Ejemplo:* ${usedPrefix + command} Ai Hoshino`, m);
    }

    await m.react(rwait);
    await conn.reply(m.chat, '*🍭 ⋆˚✿˖° Buscando las imágenes más lindas para ti, espere un momento...*', m);

    try {
        const results = await googleImageSearch(text);
        
        // Validamos que results sea un arreglo válido antes de mapear
        if (!results || results.length === 0) {
            await m.react('❌');
            return conn.reply(m.chat, `*😿 ᰔᩚ Ay no... No encontré fotitos para:* ${text}`, m);
        }

        const images = results.map(result => result?.url).filter(Boolean).slice(0, 4);

        if (!images.length) {
            await m.react('❌');
            return conn.reply(m.chat, `*😿 ᰔᩚ Los links de las imágenes están rotos para:* ${text}`, m);
        }

        const messages = images.map((image, index) => [
            `🎀 Imagen ${index + 1} 🎀`, 
            dev, 
            image, 
            [[]], [[]], [[]], [[]]
        ]);

        await conn.sendCarousel(
            m.chat, 
            `*🌸 Resultado lindo de:* ${text}`, 
            '⪛✰ ɪᴍᴀɢᴇɴ - ʙᴜsǫᴜᴇᴅᴀ ✰⪜', 
            null, 
            messages, 
            m
        );
        
        await m.react('✅');

    } catch (error) {
        console.error('Error en búsqueda de imágenes:', error);
        await m.react('✖️');
        conn.reply(m.chat, '*🥀 Ocurrió un error inesperado en el servidor al intentar buscar las imágenes. Intenta de nuevo más tarde.*', m);
    }
};

handler.help = ['imagen <texto>'];
handler.tags = ['buscador', 'tools', 'descargas'];
handler.command = ['image', 'imagen', 'img'];
handler.register = true;

export default handler;
