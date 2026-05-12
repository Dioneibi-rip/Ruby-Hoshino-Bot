import gis from 'g-i-s';
import { promisify } from 'util';

const googleImageSearch = promisify(gis);

const handler = async (m, {conn, text}) => {
if (!text) return conn.reply(m.chat, `${emoji} Por favor, ingresa un término de búsqueda.`, m);
await m.react(rwait)
conn.reply(m.chat, '🍭 Descargando su imagen, espere un momento...', m)
const results = await googleImageSearch(text).catch(() => [])
const images = results.map(result => result?.url).filter(Boolean).slice(0, 4)
if (!images.length) return conn.reply(m.chat, `${emoji2} No encontré imágenes para *${text}*.`, m)
const messages = images.map((image, index) => [`Imagen ${index + 1}`, dev, image, [[]], [[]], [[]], [[]]])
await conn.sendCarousel(m.chat, `${emoji} Resultado de ${text}`, '⪛✰ Imagen - Búsqueda ✰⪜', null, messages, m);
};
handler.help = ['imagen'];
handler.tags = ['buscador', 'tools', 'descargas'];
handler.command = ['image', 'imagen'];
handler.register = true

export default handler;
