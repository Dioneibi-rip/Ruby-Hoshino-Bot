import axios from 'axios'

class StickerLy {
async search(query) {
if (!query) throw new Error('Query is required');
const { data } = await axios.post('https://api.sticker.ly/v4/stickerPack/smartSearch', {
keyword: query,
enabledKeywordSearch: true,
filter: {
extendSearchResult: false,
sortBy: 'RECOMMENDED',
languages: ['ALL'],
minStickerCount: 5,
searchBy: 'ALL',
stickerType: 'ALL'
}
}, {
headers: {
'user-agent': 'androidapp.stickerly/3.17.0 (Redmi Note 4; U; Android 29; in-ID; id;)',
'content-type': 'application/json',
'accept-encoding': 'gzip'
}
});

if (!data.result || !data.result.stickerPacks || data.result.stickerPacks.length === 0) return null;

return data.result.stickerPacks.map(pack => ({
name: pack.name,
author: pack.authorName,
url: pack.shareUrl
}));
}

async detail(url) {
const match = url.match(/\/s\/([^\/\?#]+)/);
if (!match) throw new Error('Invalid URL. Use sticker.ly share URL');

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
packDetails = await api.detail(randomPack.url);
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
