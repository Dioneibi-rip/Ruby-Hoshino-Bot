import fetch from "node-fetch";
import { download, detail, search } from "../../lib/anime.js";

const SESSION_TTL = 10 * 60 * 1000;

const formatLangs = (langs = []) => {
  if (!langs.length) return "SUB / DUB";
  return langs.map((l) => l.toUpperCase()).join(" & ");
};

async function detectEpisodeLangs(episodes = []) {
  const results = [];
  for (let i = 0; i < episodes.length; i += 4) {
    const chunk = episodes.slice(i, i + 4);
    const chunkResults = await Promise.all(chunk.map(async (ep) => {
      try {
        const info = await download(ep.link);
        const langs = Object.entries(info?.dl || {})
          .filter(([, link]) => Boolean(link))
          .map(([lang]) => lang);
        return { ...ep, lang: langs };
      } catch {
        return { ...ep, lang: [] };
      }
    }));
    results.push(...chunkResults);
  }
  return results;
}

let handler = async (m, { command, usedPrefix, conn, text, args }) => {
  if (!text) return m.reply(
    `🌸 *Uso correcto de AnimeDL*\n\n` +
    `• ${usedPrefix + command} Mushoku Tensei\n` +
    `• ${usedPrefix + command} https://animeav1.com/media/mushoku-tensei`
  );

  try {
    if (text.includes("animeav1.com/media/")) {
      m.react("⏳");
      const info = await detail(args[0]);
      if (info?.error) throw new Error(info.error);

      const episodes = await detectEpisodeLangs(info.episodes || []);
      const gen = (info.genres || []).join(", ") || "No disponible";

      const eps = episodes.map((e) => `• Episodio ${e.ep} (${formatLangs(e.lang)})`).join("\n");

      const caption = [
        "╭─「 🌸 *ANIME DOWNLOAD PRO* 」",
        `├ 🏷️ *Título:* ${info.title || "Sin título"}${info.altTitle ? ` - ${info.altTitle}` : ""}`,
        `├ ⭐ *Rating:* ${info.rating || "N/A"}`,
        `├ 🗳️ *Votos:* ${info.votes || "N/A"}`,
        `├ 🎭 *Géneros:* ${gen}`,
        `├ 📦 *Episodios totales:* ${info.total || episodes.length}`,
        "├────────────────",
        `├ 📜 *Descripción:* ${info.description || "Sin descripción"}`,
        "├────────────────",
        "├ 📺 *Episodios disponibles:*",
        eps || "• No se encontraron episodios",
        "╰─➤ Responde con: *número idioma*",
        "     Ejemplo: *1 sub*  |  *3 dub*",
      ].join("\n");

      const buffer = await (await fetch(info.cover)).arrayBuffer();
      const sent = await conn.sendMessage(m.chat, { image: Buffer.from(buffer), caption }, { quoted: m });

      conn.anime = conn.anime || {};
      if (conn.anime[m.sender]?.timeout) clearTimeout(conn.anime[m.sender].timeout);
      conn.anime[m.sender] = {
        title: info.title,
        episodes,
        key: sent.key,
        downloading: false,
        timeout: setTimeout(() => delete conn.anime[m.sender], SESSION_TTL),
      };
      return;
    }

    m.react("🔎");
    const results = await search(text);
    if (!results.length) return m.reply("❌ No se encontraron resultados para ese anime.");

    let cap = "╭─「 🔎 *RESULTADOS ANIME* 」\n";
    results.slice(0, 15).forEach((res, index) => {
      cap += `├ ${index + 1}. *${res.title}*\n`;
      cap += `│ 🔗 ${res.link}\n`;
    });
    cap += "╰─➤ Copia uno de los links y úsalo con animedl";

    await conn.sendMessage(m.chat, { text: cap }, { quoted: m });
    m.react("✅");
  } catch (e) {
    console.error("Error en handler anime:", e);
    m.reply("⚠️ Ocurrió un error al procesar AnimeDL: " + e.message);
  }
};

handler.before = async (m, { conn }) => {
  conn.anime = conn.anime || {};
  const session = conn.anime[m.sender];
  if (!session || !m.quoted || m.quoted.id !== session.key.id) return;
  if (session.downloading) return m.reply("⏳ Ya hay una descarga en progreso, espera a que termine.");

  const [epStr, langInput] = (m.text || "").trim().toLowerCase().split(/\s+/);
  const epi = Number.parseInt(epStr, 10);
  if (Number.isNaN(epi)) return m.reply("❌ Debes escribir un número de episodio válido. Ejemplo: *1 sub*");

  const episode = session.episodes.find((e) => e.ep === epi);
  if (!episode) return m.reply(`❌ El episodio ${epi} no existe en la lista.`);

  session.downloading = true;
  try {
    const inf = await download(episode.link);
    const availableLangs = Object.entries(inf?.dl || {})
      .filter(([, link]) => Boolean(link))
      .map(([lang]) => lang);

    if (!availableLangs.length) {
      throw new Error("No se detectaron enlaces de descarga en ese episodio");
    }

    let idioma = langInput;
    if (!idioma || !availableLangs.includes(idioma)) idioma = availableLangs[0];
    const idiomaLabel = idioma === "sub" ? "Sub Español" : "Español Latino";

    await m.reply(`📥 Descargando *${session.title}* - Episodio *${epi}* (${idiomaLabel})...`);

    await conn.sendFile(
      m.chat,
      inf.dl[idioma],
      `${session.title} - EP${epi} ${idiomaLabel}.mp4`,
      `✅ Descarga completada\n🎬 *${session.title}*\n📺 Episodio: *${epi}*\n🗣️ Audio: *${idiomaLabel}*`,
      m,
      false,
      { mimetype: "video/mp4", asDocument: true }
    );
    m.react("✅");
  } catch (err) {
    console.error("Error al descargar episodio:", err);
    await m.reply(`⚠️ Falló la descarga del episodio ${epi}: ${err.message}`);
    m.react("❌");
  } finally {
    session.downloading = false;
    if (session.timeout) clearTimeout(session.timeout);
    delete conn.anime[m.sender];
  }
};

handler.command = ["anime", "animedl", "animes"];
handler.tags = ["download"];
handler.help = ["animedl"];
handler.premium = true;

export default handler;
