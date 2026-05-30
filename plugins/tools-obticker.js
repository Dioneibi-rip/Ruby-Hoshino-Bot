import axios from 'axios';
import sharp from 'sharp';
import webp from 'node-webpmux';
import fs from 'fs';

class StickerLy {
    async search(query) {
        if (!query) throw new Error('Query requerida');
        const { data } = await axios.post(
            'https://api.sticker.ly/v4/stickerPack/smartSearch',
            {
                keyword: query,
                enabledKeywordSearch: true,
                filter: { extendSearchResult: false, sortBy: 'RECOMMENDED', languages: ['ALL'], minStickerCount: 3, searchBy: 'ALL', stickerType: 'ALL' }
            },
            {
                headers: {
                    'user-agent': 'androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)',
                    'content-type': 'application/json',
                    'accept-encoding': 'gzip'
                }
            }
        );
        if (!data.result || !data.result.stickerPacks || !data.result.stickerPacks.length) return [];
        const normalizedQuery = query.toLowerCase().trim();
        return data.result.stickerPacks
            .map(pack => ({
                name: pack.name || 'Sin nombre',
                author: pack.authorName || 'Desconocido',
                url: pack.shareUrl,
                stickerCount: pack.resourceFiles?.length || pack.stickerCount || 0
            }))
            .filter(pack => pack.url && pack.stickerCount >= 3)
            .sort((a, b) => b.stickerCount - a.stickerCount);
    }

    async detail(url) {
        const match = url.match(/\/s\/([^\/\?#]+)/);
        if (!match) throw new Error('URL inválida');
        const { data } = await axios.get(
            `https://api.sticker.ly/v4/stickerPack/${match[1]}?needRelation=true`,
            { headers: { 'user-agent': 'androidapp.stickerly/3.17.0' } }
        );
        if (!data.result) throw new Error('Paquete no encontrado');
        return {
            name: data.result.name || 'Sin nombre',
            author: data.result.user?.displayName || 'Desconocido',
            stickers: data.result.stickers.map(s => ({
                imageUrl: s.resourceUrl || `${data.result.resourceUrlPrefix}${s.fileName}`
            }))
        };
    }
}

// Función auxiliar para inyectar metadatos EXIF (crítico para que WhatsApp los reconozca)
async function addExif(buffer, packName, authorName) {
    const img = new webp.Image();
    await img.load(buffer);
    const json = { 'sticker-pack-id': 'https://sticker.ly', 'sticker-pack-name': packName, 'sticker-pack-publisher': authorName, emojis: ['🎀'] };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    img.exif = exif;
    return await img.save(null);
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply('𐔌 ࣪ ̟ Por favor, ingresa un nombre o link de Sticker.ly.');
    await m.react('⏳');

    try {
        const api = new StickerLy();
        let packDetails;

        if (text.includes('sticker.ly/s/')) {
            packDetails = await api.detail(text);
        } else {
            const results = await api.search(text);
            if (!results.length) return m.reply('❌ No encontré paquetes.');
            packDetails = await api.detail(results[0].url);
        }

        await m.reply(`📦 *Procesando "${packDetails.name}", espere un momento...*`);

        const max = Math.min(packDetails.stickers.length, 20);
        let stickersArray = [];
        let coverBuffer = null;

        for (let i = 0; i < max; i++) {
            try {
                const response = await axios.get(packDetails.stickers[i].imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
                // Redimensionar a 512x512 y convertir a webp estricto
                const webpBuffer = await sharp(Buffer.from(response.data))
                    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .webp()
                    .toBuffer();

                const finalBuffer = await addExif(webpBuffer, packDetails.name, packDetails.author);
                
                if (i === 0) coverBuffer = finalBuffer;

                stickersArray.push({
                    sticker: finalBuffer,
                    emojis: ['🎀']
                });
            } catch (err) {
                console.log(`Error en sticker ${i + 1}:`, err.message);
            }
        }

        await conn.sendMessage(m.chat, {
            stickerPack: {
                name: packDetails.name,
                publisher: packDetails.author,
                description: 'Descargado por tu Bot Kawaii ✨',
                cover: coverBuffer,
                stickers: stickersArray
            }
        }, { quoted: m });

        await m.react('🎀');
    } catch (e) {
        console.error(e);
        await m.react('🥀');
        m.reply(`❌ Ocurrió un error: ${e.message}`);
    }
}

handler.command = ['stickerly', 'sl', 'dlsticker'];
export default handler;
