const BASE_URL = "https://animeav1.com";
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
};

const decodeHtml = (text = "") => String(text)
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\s+/g, " ")
  .trim();

const stripTags = (html = "") => decodeHtml(String(html).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
const getAttr = (tag = "", name = "") => decodeHtml(String(tag).match(new RegExp(`${name}=["']([^"']*)["']`, "i"))?.[1] || "");

const normalizeUrl = (url = "") => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const toPixelDrainApi = (url = "") => {
  if (!url) return null;
  const match = url.match(/pixeldrain\.com\/(?:u|l)\/([a-zA-Z0-9]+)/i);
  return match ? `https://pixeldrain.com/api/file/${match[1]}` : url;
};

async function fetchHtml(url) {
  const response = await fetch(normalizeUrl(url), { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function parseDownloadLinks(html = "") {
  const links = { sub: null, dub: null };
  const scriptMatches = [...html.matchAll(/downloads\s*:\s*\{([\s\S]*?)\}\s*[},]/gi)];
  const body = scriptMatches.length ? scriptMatches.map((m) => m[1]).join("\n") : html;
  const blockRegex = /(SUB|DUB)[\s\S]{0,700}?(https:\/\/pixeldrain\.com\/(?:u|l)\/[a-zA-Z0-9]+)/gi;
  for (const match of body.matchAll(blockRegex)) {
    const lang = match[1].toLowerCase();
    if (!links[lang]) links[lang] = toPixelDrainApi(match[2]);
  }
  const fallback = [...body.matchAll(/https:\/\/pixeldrain\.com\/(?:u|l)\/[a-zA-Z0-9]+/gi)].map((m) => toPixelDrainApi(m[0]));
  if (!links.sub && fallback[0]) links.sub = fallback[0];
  if (!links.dub && fallback[1]) links.dub = fallback[1];
  return links;
}

function firstText(html = "", regex) {
  return stripTags(html.match(regex)?.[1] || "");
}

async function download(url) {
  try {
    const normalized = normalizeUrl(url);
    const html = await fetchHtml(normalized);
    const title = firstText(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i) || firstText(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    return { title, dl: parseDownloadLinks(html), source: normalized };
  } catch (err) {
    return { error: "Failed to fetch or parse page", details: err.message, dl: {} };
  }
}

async function detail(url) {
  try {
    const normalized = normalizeUrl(url);
    const html = await fetchHtml(normalized);
    const title = firstText(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    const altTitle = firstText(html, /<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
    const description = firstText(html, /<div\b[^>]*class=["'][^"']*entry[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) || firstText(html, /<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
    const posterTag = imageTags.find((tag) => /Poster/i.test(getAttr(tag, "alt"))) || imageTags[0] || "";
    const cover = normalizeUrl(getAttr(posterTag, "src"));
    const genres = [...html.matchAll(/<a\b[^>]*href=["'][^"']*catalogo\?genre=[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => stripTags(m[1])).filter(Boolean);
    const episodes = [];
    for (const match of html.matchAll(/<article\b[\s\S]*?<\/article>/gi)) {
      const article = match[0];
      const href = getAttr(article.match(/<a\b[^>]*href=["'][^"']*\/media\/[^"']*["'][^>]*>/i)?.[0] || article.match(/<a\b[^>]*>/i)?.[0] || "", "href");
      const text = stripTags(article);
      const epNum = Number.parseInt(text.match(/episodio\s*(\d+)/i)?.[1] || text.match(/\b(\d+)\b/)?.[1] || "", 10);
      const img = normalizeUrl(getAttr(article.match(/<img\b[^>]*>/i)?.[0] || "", "src"));
      if (!Number.isNaN(epNum) && href) episodes.push({ ep: epNum, img, link: normalizeUrl(href) });
    }
    episodes.sort((a, b) => a.ep - b.ep);
    return { title, altTitle, description, rating: firstText(html, /ic-star-solid[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i), votes: "", cover, backdrop: "", genres, episodes, total: episodes.length };
  } catch (err) {
    return { error: err.message };
  }
}

async function search(query) {
  const html = await fetchHtml(`${BASE_URL}/catalogo?search=${encodeURIComponent(query)}`);
  const results = [];
  for (const match of html.matchAll(/<article\b[\s\S]*?<\/article>/gi)) {
    const article = match[0];
    const link = normalizeUrl(getAttr(article.match(/<a\b[^>]*>/i)?.[0] || "", "href"));
    const title = firstText(article, /<h3\b[^>]*>([\s\S]*?)<\/h3>/i) || stripTags(article.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)?.[1] || "");
    const img = normalizeUrl(getAttr(article.match(/<img\b[^>]*>/i)?.[0] || "", "src"));
    if (title && link) results.push({ title, link, img });
  }
  return results;
}

export { download, detail, search };
