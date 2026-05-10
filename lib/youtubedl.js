import axios from "axios";
const UA = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36";
function extractYouTubeId(input) {
const s = String(input || "").trim();
if (!s) return null;
const m1 = s.match(/(?:v=|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
if (m1?.[1]) return m1[1];
const m2 = s.match(/^[A-Za-z0-9_-]{11}$/);
if (m2?.[0]) return m2[0];
return null;
}
function pickQuality(type, quality) {
const t = String(type || "").toLowerCase();
const q = Number(quality);
if (t === "audio" || t === "mp3") {
const allowed = new Set([64, 96, 128, 160, 192, 256, 320]);
return allowed.has(q) ? q : 128;
}
const allowed = new Set([144, 240, 360, 480, 720, 1080, 1440, 2160]);
return allowed.has(q) ? q : 360;
}
function baseHeaders(ref) {
return {
"User-Agent": UA,
Accept: "application/json, text/plain, */*",
"Accept-Language": "es-US,es-419;q=0.9,es;q=0.8",
Origin: ref,
Referer: `${ref}/`,
"Sec-Fetch-Dest": "empty",
"Sec-Fetch-Mode": "cors",
"Sec-Fetch-Site": "cross-site",
"sec-ch-ua": '"Chromium";v="123", "Not(A:Brand";v="24", "Google Chrome";v="123"',
"sec-ch-ua-mobile": "?1",
"sec-ch-ua-platform": '"Android"'
};
}
async function getSanityKey(timeout = 20000) {
const ref = "https://frame.y2meta-uk.com";
try {
const res = await axios.get("https://cnv.cx/v2/sanity/key", {
timeout,
headers: { ...baseHeaders(ref), "Content-Type": "application/json" },
validateStatus: () => true
});
if (res.status !== 200) throw new Error(`SANITY_KEY_HTTP_${res.status}`);
const key = res?.data?.key;
if (!key) throw new Error("SANITY_KEY_MISSING");
return { key, ref };
} catch (e) {
throw e;
}
}
function toForm(data) {
const p = new URLSearchParams();
for (const [k, v] of Object.entries(data)) p.set(k, String(v));
return p;
}
function normalizeObj(data) {
if (data && typeof data === "object") return data;
if (typeof data === "string") {
try { return JSON.parse(data); } catch { return null; }
}
return null;
}
async function y2mateDirect(url, opts = {}) {
const videoId = extractYouTubeId(url);
if (!videoId) return { status: false, error: "INVALID_YOUTUBE_URL" };
const typeRaw = String(opts.type || "audio").toLowerCase();
const type = typeRaw === "video" || typeRaw === "mp4" ? "video" : "audio";
const format = type === "video" ? "mp4" : "mp3";
const quality = pickQuality(type, opts.quality);
const timeout = Number(opts.timeout || 45000);
try {
const { key, ref } = await getSanityKey(Math.min(timeout, 20000));
const payload = {
link: `https://youtu.be/${videoId}`,
format,
audioBitrate: type === "audio" ? quality : 128,
videoQuality: type === "video" ? quality : 720,
filenameStyle: "pretty",
vCodec: "h264"
};
const res = await axios.post("https://cnv.cx/v2/converter", toForm(payload), {
timeout,
headers: {
...baseHeaders(ref),
Accept: "*/*",
"Content-Type": "application/x-www-form-urlencoded",
key
},
validateStatus: () => true
});
if (res.status !== 200) return { status: false, error: `CONVERTER_HTTP_${res.status}` };
const obj = normalizeObj(res.data);
const direct = obj?.url;
if (!direct) return { status: false, error: "NO_URL_IN_RESPONSE", raw: obj ?? res.data };
return { status: true, videoId, type, format, quality, url: direct };
} catch (error) {
return { status: false, error: error.message };
}
}
export async function ytmp3(link, titleOverride = null) {
const result = await y2mateDirect(link, { type: 'audio', quality: 128 });
if (!result.status) {
return { 
status: false, 
message: result.error || "Error al obtener enlace de audio" 
};
}
const title = titleOverride || "audio_music";
return {
status: true,
metadata: { title: title },
download: { 
url: result.url 
}
};
}
export async function ytmp4(link, titleOverride = null) {
const result = await y2mateDirect(link, { type: 'video', quality: 360 });
if (!result.status) {
return { 
status: false, 
message: result.error || "Error al obtener enlace de video" 
};
}
const title = titleOverride || "video_mp4";
return {
status: true,
metadata: { title: title },
download: { 
url: result.url 
}
};
}
