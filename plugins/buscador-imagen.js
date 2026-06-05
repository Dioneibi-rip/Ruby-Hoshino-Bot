import google from 'googlethis';
const handler = async (m, { conn, text, usedPrefix, command }) => {
const rwait = '⏳';
if (!text) {
return conn.reply(m.chat, `ᜊ ׄ ׅ🌿ැ ׄ 𝗕ús𝗾u𝗲d𝗮 ᱉᱉ Por favor, ingresa un término. ✧ 𝗘j𝗲m𝗽l𝗼: ${usedPrefix + command} Ai Hoshino`, m);
}
await m.react(rwait);
await conn.reply(m.chat, ' 🌿 ׄ ⢟ 𝗕𝘂𝘀𝗰𝗮𝗻𝗱𝗼 𝗹𝗮𝘀 𝗳𝗼𝘁𝗶𝘁𝗼𝘀 𝗺á𝘀 𝗹𝗶𝗻𝗱𝗮𝘀, 𝗲𝘀𝗽𝗲𝗿𝗲 𝘂𝗻 𝗺𝗼𝗺𝗲𝗻𝘁𝗼... 𞋬 🌱', m);
try {
const results = await google.image(text, { safe: false });
if (!results || results.length === 0) {
await m.react('❌');
return conn.reply(m.chat, `𐔌 🥀 ׄ ⢟ No logré encontrar imágenes para: *${text}*`, m);
}
const images = results.map(res => res.url).filter(Boolean).slice(0, 4);
if (!images.length) {
await m.react('❌');
return conn.reply(m.chat, `𐔌 🍂 ׄ ⢟ Los enlaces de las imágenes están rotos para: *${text}*`, m);
}
const messages = images.map((image, index) => [
`⿻ 𝖨𝗆𝖺𝗀𝖾𝗇 ${index + 1} 𖹭`, 
dev, 
image, 
[[]], [[]], [[]], [[]]
]);
await conn.sendCarousel(
m.chat, 
`෭ ׄ ׅ🍃ැ ׅ 𝗥𝗲𝘀𝘂𝗹𝘁𝗮𝗱𝗼 𝗲𝘀𝘁é𝘁𝗶𝗰𝗼 𝗱𝗲: *${text}*`, 
`⪛✰ 𝕮нαηηєℓ 𝕾ρα¢є ✰⪜`, 
null, 
messages, 
m
);
await m.react('✅');
} catch (error) {
console.error(error);
await m.react('✖️');
conn.reply(m.chat, `𐔌 🥀 ׄ𝗅 ⢟ Ocurrió un error de conexión. Intente con otra palabra.`, m);
}
};
handler.help = ['imagen <texto>'];
handler.tags = ['buscador', 'tools', 'descargas'];
handler.command = ['image', 'imagen', 'img'];
handler.register = true;
export default handler;
