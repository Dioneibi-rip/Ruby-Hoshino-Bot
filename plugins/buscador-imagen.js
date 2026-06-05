import google from 'googlethis';

const handler = async (m, { conn, text, usedPrefix, command }) => {
    // Variables de entorno para la decoración y el estado
    const rwait = '⏳';
    const dev = '🪴 ᴏᴛᴀᴋᴜ ɴᴏ ᴋᴏ 🌿'; 
    
    if (!text) {
        return conn.reply(m.chat, `*🌿 ╰┈➤ Por favor, ingresa un término de búsqueda.*\n*✧ Ejemplo:* ${usedPrefix + command} paisajes naturales`, m);
    }

    await m.react(rwait);
    await conn.reply(m.chat, '*🌱 Descargando las imágenes, espere un momento...*', m);

    try {
        // Búsqueda usando googlethis (sin el guion)
        const results = await google.image(text, { safe: false });

        // Validar que la librería devolvió resultados
        if (!results || results.length === 0) {
            await m.react('❌');
            return conn.reply(m.chat, `*🍂 No logré encontrar imágenes para:* ${text}`, m);
        }

        // Extraer solo las URLs de los resultados y limitar a 4 imágenes
        const images = results.map(res => res.url).filter(Boolean).slice(0, 4);

        if (!images.length) {
            await m.react('❌');
            return conn.reply(m.chat, `*🍂 Los enlaces de las imágenes están rotos para:* ${text}`, m);
        }

        // Estructurar el carrusel
        const messages = images.map((image, index) => [
            `🪴 Imagen ${index + 1}`, 
            dev, 
            image, 
            [[]], [[]], [[]], [[]]
        ]);

        await conn.sendCarousel(
            m.chat, 
            `*🌿 Resultado de:* ${text}`, 
            '⪛✰ ɪᴍᴀɢᴇɴ - ʙᴜsǫᴜᴇᴅᴀ ✰⪜', 
            null, 
            messages, 
            m
        );
        
        await m.react('✅');

    } catch (error) {
        console.error('Error en búsqueda de imágenes:', error);
        await m.react('✖️');
        conn.reply(m.chat, '*🥀 Ocurrió un error de conexión al buscar las imágenes. Intenta con otra palabra.*', m);
    }
};

handler.help = ['imagen <texto>'];
handler.tags = ['buscador', 'tools', 'descargas'];
handler.command = ['image', 'imagen', 'img'];
handler.register = true;

export default handler;
