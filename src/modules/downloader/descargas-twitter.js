import axios from '../../infra/http.js';
import * as cheerio from 'cheerio';

let enviando = false;

// Función scraper integrada
async function scrapeTwitter(videoUrl) {
  const apiUrl = "https://snaptwitter.com/action.php";
  try {
    const { data: html } = await axios.get("https://snaptwitter.com/");
    const $tok = cheerio.load(html);
    const tokenValue = $tok('input[name="token"]').attr("value");

    const formData = new URLSearchParams();
    formData.append("url", videoUrl);
    formData.append("token", tokenValue || "");

    const config = {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    };
    const response = await axios.post(apiUrl, formData, config);
    const $ = cheerio.load(response.data.data);

    const result = {
      imgUrl: $(".videotikmate-left img").attr("src"),
      downloadLink: $(".abuttons a").attr("href"),
      videoTitle: $(".videotikmate-middle h1").text().trim(),
      videoDescription: $(".videotikmate-middle p span").text().trim(),
    };

    return result;
  } catch (error) {
    console.error("Error en el scraper de Twitter:", error);
    throw new Error("No se pudo obtener el video");
  }
}

const handler = async (m, { conn, text, usedPrefix, command, args }) => {
  if (!args || !args[0]) return conn.reply(m.chat, `⚠️ Te faltó el link de un video de twitter.`, m);
  if (enviando) return;
  enviando = true;

  try {
    // Llamamos al scraper con el enlace proporcionado por el usuario
    const res = await scrapeTwitter(args[0]);

    // Validamos que el scraper haya devuelto un link de descarga válido
    if (!res || !res.downloadLink) {
      enviando = false;
      return conn.reply(m.chat, `❌ No se pudo extraer el video. Verifica que el link sea válido y público.`, m);
    }

    // Armamos la descripción (caption) con el título y la descripción del tweet
    let caption = `✅ Aquí tienes tu video de Twitter :3`;
    if (res.videoTitle || res.videoDescription) {
      caption = `${res.videoTitle}\n${res.videoDescription}\n\n${caption}`.trim();
    }

    // Enviamos el video al chat
    await conn.sendMessage(m.chat, { video: { url: res.downloadLink }, caption: caption }, { quoted: m });

    enviando = false;
    return;

  } catch (error) {
    enviando = false;
    console.error(error);
    conn.reply(m.chat, `❌ Error al descargar su archivo`, m);
    return false;
  }
};

handler.help = ['twitter <url>'];
handler.tags = ['dl'];
handler.command = ['x', 'xdl', 'dlx', 'twdl', 'tw', 'twt', 'twitter'];
handler.group = true;
handler.register = true;

export default handler;