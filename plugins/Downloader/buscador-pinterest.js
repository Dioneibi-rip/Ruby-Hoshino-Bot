import axios from 'axios';
async function pinterestScraper(query, limit = 25) {
const url = 'https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D' + encodeURIComponent(query) + '%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22query%22%3A%22' + encodeURIComponent(query) + '%22%2C%22scope%22%3A%22pins%22%2C%22rs%22%3A%22typed%22%7D%2C%22context%22%3A%7B%7D%7D';
const headers = {
'accept': 'application/json, text/javascript, */*; q=0.01',
'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
'referer': 'https://id.pinterest.com/',
'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
'x-app-version': 'c056fb7',
'x-pinterest-appstate': 'active',
'x-pinterest-pws-handler': 'www/index.js',
'x-pinterest-source-url': '/',
'x-requested-with': 'XMLHttpRequest'
};
const response = await axios.get(url, { headers: headers });
if (!response.data?.resource_response?.data?.results) return [];
const results = response.data.resource_response.data.results.map(item => {
if (!item.images) return null;
const keys = Object.keys(item.images);
const bestKey = keys.find(key => /4\d{2}x|5\d{2}x|6\d{2}x/.test(key)) || keys[0];
const image_medium_url = item.images[bestKey]?.url || null;
return {
title: item.grid_title || item.title || 'Sin título',
image_large_url: item.images.orig?.url || null,
image_medium_url: image_medium_url,
image_small_url: item.images['236x']?.url || null
};
}).filter(Boolean);
return results.slice(0, limit);
}
let handler = async (m, { conn, text, usedPrefix }) => {
if (!text) return m.reply('(*∩_∩*) ⍴᥆r 𝖿ᥲ᥎᥆r, іᥒgrᥱsᥲ ᥣ᥆ 𝗊ᥙᥱ ძᥱsᥱᥲs ᑲᥙsᥴᥲr ⍴᥆r ⍴іᥒ𝗍ᥱrᥱs𝗍 🌸');
try {
await m.react('🕒');
const results = await pinterestScraper(text, 25);
if (!results.length) return conn.reply(m.chat, '❀ ✧ No se encontraron resultados para «' + text + '»\n» ❧ ❀', m);
const randomResult = results[Math.floor(Math.random() * results.length)];
const imageUrl = randomResult.image_large_url || randomResult.image_medium_url || randomResult.image_small_url;
await conn.sendMessage(m.chat, {
image: { url: imageUrl },
caption: '(*ˊᗜˋ*) ᑲᥙ́s𝗊ᥙᥱძᥲ ᥊ ⍴іᥒ𝗍ᥱrᥱs𝗍\n\n✧ 📌 𝗍і𝗍ᥙᥣ᥆ » «' + text + '»\n✐ 💎 rᥱsᥙᥣ𝗍ᥲძ᥆s » ' + results.length + ' іmᥲ́gᥱᥒᥱs ᥱᥒᥴ᥆ᥒ𝗍rᥲძᥲs\n✧ ' + (randomResult.title || 'Sin título')
}, { quoted: m });
await m.react('✔️');
} catch (e) {
await m.react('✖️');
conn.reply(m.chat, '⚠︎ ❀ Se ha producido un error ❀\n> Usa *' + usedPrefix + 'report* para informarlo.\n\n' + e, m);
}
};
handler.help = ['pinterest <texto>'];
handler.tags = ['descargas', 'pinterest'];
handler.command = ['pinterest', 'pin'];
handler.group = true;
export default handler;