import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://animeav1.com";
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
};

const normalizeUrl = (url = "") => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const toPixelDrainApi = (url = "") => {
  if (!url) return null;
  const match = url.match(/pixeldrain\.com\/(?:u|l)\/([a-zA-Z0-9]+)/i);
  if (!match) return url;
  return `https://pixeldrain.com/api/file/${match[1]}`;
};

function parseDownloadLinks(html = "") {
  const links = { sub: null, dub: null };

  const scriptMatches = [...html.matchAll(/downloads\s*:\s*\{([\s\S]*?)\}\s*[},]/gi)];
  if (!scriptMatches.length) return links;

  const body = scriptMatches.map((m) => m[1]).join("\n");

  const blockRegex = /(SUB|DUB)[\s\S]{0,500}?(https:\/\/pixeldrain\.com\/(?:u|l)\/[a-zA-Z0-9]+)/gi;
  for (const match of body.matchAll(blockRegex)) {
    const lang = match[1].toLowerCase();
    if (!links[lang]) links[lang] = toPixelDrainApi(match[2]);
  }

  if (!links.sub || !links.dub) {
    const fallback = [...body.matchAll(/https:\/\/pixeldrain\.com\/(?:u|l)\/[a-zA-Z0-9]+/gi)].map((m) => toPixelDrainApi(m[0]));
    if (!links.sub && fallback[0]) links.sub = fallback[0];
    if (!links.dub && fallback[1]) links.dub = fallback[1];
  }

  return links;
}

async function download(url) {
  try {
    const normalized = normalizeUrl(url);
    const { data: html } = await axios.get(normalized, { headers: DEFAULT_HEADERS, timeout: 30000 });
    const $ = cheerio.load(html);
    const title = $("title").text().trim() || $("h1").first().text().trim();
    const dl = parseDownloadLinks(html);
    return { title, dl, source: normalized };
  } catch (err) {
    return { error: "Failed to fetch or parse page", details: err.message, dl: {} };
  }
}

async function detail(url) {
  try {
    const normalized = normalizeUrl(url);
    const { data: html } = await axios.get(normalized, { headers: DEFAULT_HEADERS, timeout: 30000 });
    const $ = cheerio.load(html);

    const title = $("h1").first().text().trim();
    const altTitle = $("h2").first().text().trim();
    const description = $(".entry p").text().trim();
    const rating = $(".ic-star-solid .text-2xl").first().text().trim();
    const votes = $(".ic-star-solid .text-xs span").first().text().trim();
    const cover = normalizeUrl($("figure img[alt$='Poster']").attr("src"));
    const backdrop = normalizeUrl($("figure img[alt$='Backdrop']").attr("src"));

    const genres = [];
    $("a.btn[href*='catalogo?genre=']").each((_, el) => genres.push($(el).text().trim()));

    const episodes = [];
    $("article.group\\/item").each((_, el) => {
      const epNum = Number.parseInt($(el).find(".text-lead").first().text().trim(), 10);
      const link = normalizeUrl($(el).find("a").attr("href"));
      const img = normalizeUrl($(el).find("img").attr("src"));
      if (!Number.isNaN(epNum) && link) episodes.push({ ep: epNum, img, link });
    });

    episodes.sort((a, b) => a.ep - b.ep);

    return { title, altTitle, description, rating, votes, cover, backdrop, genres, episodes, total: episodes.length };
  } catch (err) {
    return { error: err.message };
  }
}

async function search(query) {
  const { data: html } = await axios.get(`${BASE_URL}/catalogo?search=${encodeURIComponent(query)}`, {
    headers: DEFAULT_HEADERS,
    timeout: 30000,
  });

  const $ = cheerio.load(html);
  const results = [];

  $("article").each((_, el) => {
    const title = $(el).find("h3").text().trim();
    const link = normalizeUrl($(el).find("a").attr("href"));
    const img = normalizeUrl($(el).find("img").attr("src"));
    if (title && link) results.push({ title, link, img });
  });

  return results;
}

export { download, detail, search };
