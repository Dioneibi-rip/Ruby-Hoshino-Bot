// Créditos: Dioneibi
import axios from 'axios';

let handler = async (m, { conn, command }) => {
  if (!global.db.getChat(m.chat).nsfw && m.isGroup) {
    return conn.reply(m.chat, '🚫 El contenido *NSFW* está desactivado en este grupo.\nUn administrador puede activarlo con *#nsfw on*.', m);
  }

  try {
    const res = await axios.get('https://delirius-apiofc.vercel.app/anime/hentaivid');
    const data = res.data;

    if (!Array.isArray(data) || data.length === 0) {
      return conn.reply(m.chat, '⚠️ No se pudo obtener el video. Intenta nuevamente más tarde.\n🔧 *Razón:* Lista vacía o formato inesperado de la API.', m);
    }

    const random = data[Math.floor(Math.random() * data.length)];
    const caption = `🔞 *HENTAI RANDOM VIDEO* 🔥

🎬 *Título:* ${random.title}
📁 *Categoría:* ${random.category}
📊 *Vistas:* ${random.views_count}
📤 *Compartido:* ${random.share_count}
🌐 *Link:* ${random.link}

🔗 *Descargar video:* ${random.video_1}`;

    await conn.sendFile(m.chat, random.video_1, 'video.mp4', caption, m);
  } catch (err) {
    console.error('[❌ ERROR API]', err);
    let reason = err.response?.status
      ? `Código HTTP: ${err.response.status} (${err.response.statusText})`
      : err.message;

    return conn.reply(m.chat, `❌ Ocurrió un error al obtener el video.\n🔧 *Razón:* ${reason}`, m);
  }
};

handler.command = ['hentaivideo', 'hentaivid'];
handler.tags = ['nsfw'];
handler.help = ['hentaivideo'];
handler.register = true;
handler.nsfw = true;
export default handler;