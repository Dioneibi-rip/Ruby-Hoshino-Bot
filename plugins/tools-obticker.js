import axios from 'axios'

class StickerLy {
async detail(urlOrId) {
const match = urlOrId.match(/\/s\/([^\/\?#]+)/);
const packId = match ? match[1] : urlOrId;
const { data } = await axios.get(`https://api.sticker.ly/v4/stickerPack/${packId}?needRelation=true`, {
headers: {
'user-agent': 'androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)',
'content-type': 'application/json',
'accept-encoding': 'gzip'
}
});
if (!data.result) throw new Error('No se encontraron detalles del paquete.');
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

async search(query) {
const { data } = await axios.get(`https://api.sticker.ly/v4/search/stickerPack?keyword=${encodeURIComponent(query)}&page=0&size=20`, {
headers: {
'user-agent': 'androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)',
'content-type': 'application/json',
'accept-encoding': 'gzip'
}
});
if (!data.result || !data.result.stickerPacks || data.result.stickerPacks.length === 0) return null;
return data.result.stickerPacks;
}
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!text) {
return m.reply(`⚠️ Por favor, ingresa un enlace de Sticker.ly o un texto para buscar.\n*Ejemplo:* ${usedPrefix + command} Goku\n*Ejemplo:* ${usedPrefix + command} https://sticker.ly/s/123456`);
}

await m.react('⏳');

try {
const api = new StickerLy();
let packDetails;

if (text.includes('sticker.ly/s/')) {
packDetails = await api.detail(text);
} else {
const searchResults = await api.search(text);
if (!searchResults) {
await m.react('❌');
return m.reply(`❌ No se encontraron paquetes de stickers para la búsqueda: "${text}"`);
}
const randomPack = searchResults[Math.floor(Math.random() * searchResults.length)];
const id = randomPack.packId || randomPack.id;
packDetails = await api.detail(id);
}

let infoMessage = `📦 *PAQUETE ENCONTRADO*\n\n`;
infoMessage += `🏷️ *Nombre:* ${packDetails.name}\n`;
infoMessage += `👤 *Autor:* ${packDetails.author}\n`;
infoMessage += `📊 *Total de stickers:* ${packDetails.stickerCount}\n\n`;
infoMessage += `⏳ *Descargando los primeros 10 stickers para evitar spam...*`;

await m.reply(infoMessage);

const maxStickers = Math.min(packDetails.stickers.length, 10);

for (let i = 0; i < maxStickers; i++) {
const stickerData = packDetails.stickers[i];

try {
const response = await axios.get(stickerData.imageUrl, { responseType: 'arraybuffer' });
const buffer = Buffer.from(response.data);

await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m });

await new Promise(resolve => setTimeout(resolve, 1500));

} catch (stickerError) {
console.error(`Error al enviar el sticker ${i+1}:`, stickerError.message);
}
}

await m.react('✅');

} catch (e) {
console.error(e);
await m.react('❌');
m.reply(`❌ Ocurrió un error al intentar procesar tu solicitud.\n\n*Error:* ${e.message}`);
}
}

handler.help = ['stickerly <url/busqueda>']
handler.tags = ['descargas', 'sticker']
handler.command = ['stickerly', 'sl', 'dlsticker']
handler.group = false

export default handler
