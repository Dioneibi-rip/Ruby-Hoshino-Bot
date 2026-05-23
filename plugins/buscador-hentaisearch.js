import fetch from "node-fetch";
import cheerio from "cheerio";
import { JSDOM } from "jsdom";

let handler = async (m, { conn, text, args, setting }) => {
  try {
    if (!text) {
      return conn.reply(m.chat, `🌱 Ejemplo de uso: hent Boku ni Harem Sexfriend`, m);
    }

    m.react('🕒');

    if (text.includes('https://veohentai.com/ver/')) {
      const videoInfo = await getInfo(text);
      if (!videoInfo) {
        return conn.reply(m.chat, 'No se encontró información del video.', m);
      }

      const videoUrl = videoInfo.videoUrl;
      let peso = await size(videoInfo.videoUrl);

      let cap = `
◜ Hentai - Download ◞

≡ 🌴 \`Title :\` ${videoInfo.title}
≡ 🌿 \`Views :\` ${videoInfo.views}
≡ 🌾 \`Likes :\` ${videoInfo.likes}
≡ 🌲 \`Peso :\` ${peso}
≡ 🍄 \`Dislikes :\` ${videoInfo.dislikes}
≡ 🌷 \`Link :\` ${text}
`;
      m.reply(cap)

      await conn.sendFile(m.chat, videoUrl, `${videoInfo.title}.mp4`, '', m, null, {
        asDocument: true, mimetype: "video/mp4"
      });
      m.react('☑️');
    } else {
      const results = await searchHentai(text);
      if (results.length === 0) {
        return conn.reply(m.chat, 'No se encontraron resultados.', m);
      }

      let cap = `◜ Hentai - Search ◞\n`;

      results.slice(0, 15).forEach((res, index) => {
        cap += `\n\`${index + 1}\`\n≡ 🌴 \`Title :\` ${res.titulo}\n≡ 🌱 \`Link :\` ${res.url}\n`;
      });
      m.reply(cap)
      m.react("🔞");
    }
  } catch (err) {
    return conn.reply(m.chat, 'Error en la ejecución.\n\n' + err, m);
  }
};

handler.help = ["hentai"];
handler.command = ["hentai", "hent"];
handler.tags = ["download"];
export default handler;

async function searchHentai(text) {
  let base = `https://veohentai.com/?s=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(base);
    if (!response.ok) throw new Error(`Error en la petición: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    let resultados = [];

    $(".grid a").each((i, el) => {
      let url = $(el).attr("href");
      let titulo = $(el).find("h2").text().trim();

      if (url && titulo) {
        resultados.push({ titulo, url });
      }
    });

    return resultados;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

async function getInfo(url) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const data = await response.text();
    const dom = new JSDOM(data);
    const document = dom.window.document;

    const iframe = document.querySelector(".aspect-w-16.aspect-h-9 iframe");

    if (iframe) {
      const iframeSrc = iframe.src;
      const videoResponse = await fetch(iframeSrc);
      const videoHtml = await videoResponse.text();
      const match = videoHtml.match(/data-id="\/player\.php\?u=([^&]*)/);

      if (!match) throw new Error("No se encontró la URL del video");

      const videoUrl = atob(match[1]);

      const title = document.querySelector("h1.text-whitegray.text-lg").textContent.trim();
      const views = document.querySelector("h4.text-whitelite.text-sm").textContent.trim();
      const likes = document.querySelector("#num-like").textContent.trim();
      const dislikes = document.querySelector("#num-dislike").textContent.trim();

      return {
        videoUrl,
        title,
        views,
        likes,
        dislikes
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function size(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const size = parseInt(res.headers.get('content-length'), 10);

    if (!size) throw new Error('Size not available');

    if (size >= 1e9) return (size / 1e9).toFixed(2) + ' GB';
    if (size >= 1e6) return (size / 1e6).toFixed(2) + ' MB';
    if (size >= 1e3) return (size / 1e3).toFixed(2) + ' KB';
    return size + ' Bytes';
  } catch (err) {
    return 'Error: ' + err.message;
  }
}