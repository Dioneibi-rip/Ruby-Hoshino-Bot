import { nsfwWarning } from '../../library/respuesta.js';
import baileys from '@whiskeysockets/baileys';
import { enqueueMediaJob, getMediaQueueConnection } from '../../library/queue.js';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function sendAlbumMessage(conn, jid, medias, options = {}) {
if (typeof jid !== "string") throw new TypeError(`jid debe ser string, se recibió: ${jid}`);
if (medias.length < 2) throw new RangeError("Se necesitan al menos 2 imágenes para un álbum");
const caption = options.text || options.caption || "";
const delayMs = !isNaN(options.delay) ? options.delay : 500;
const quoted = options.quoted || null;
delete options.text;
delete options.caption;
delete options.delay;
delete options.quoted;
const album = baileys.generateWAMessageFromContent(
jid,
{ messageContextInfo: {}, albumMessage: { expectedImageCount: medias.length } },
quoted ? { quoted } : {}
);
await conn.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id });
for (let i = 0; i < medias.length; i++) {
const { type, data } = medias[i];
const img = await baileys.generateWAMessage(
album.key.remoteJid,
{ [type]: data, ...(i === 0 ? { caption } : {}) },
{ upload: conn.waUploadToServer }
);
img.message.messageContextInfo = {
messageAssociation: { associationType: 1, parentMessageKey: album.key }
};
await conn.relayMessage(img.key.remoteJid, img.message, { messageId: img.key.id });
await delay(delayMs);
}
return album;
}
function registerRule34QueueHandler() {
global.queueHandlers ||= new Map();
if (global.queueHandlers.has("rule34:album")) return;
global.queueHandlers.set("rule34:album", async ({ jid, medias, options = {} }) => {
const activeConn = getMediaQueueConnection();
if (!activeConn) throw new Error("No hay conexión activa para la cola multimedia");
await sendAlbumMessage(activeConn, jid, medias, options);
});
}

const handler = async (m, { conn, args, command, usedPrefix }) => {
const rwait = global.rwait || "⏳";
const done = global.done || "✅";
const error = global.error || "❌";
if (m.isGroup && !global.db.getChat(m.chat).nsfw) {
return m.reply(nsfwWarning());
}
if (!args[0]) {
return conn.reply(m.chat, `> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖣𝖾𝖻𝖾𝗌 𝖾𝗌𝖼𝗋𝗂𝖻𝗂𝗋 𝗎𝗇 𝗍⍺𝗀 𝗉⍺𝗋⍺ 𝖻𝗎𝗌𝖼⍺𝗋... ⍺𝗌𝗂́:\n> 💌 \`${usedPrefix}${command} yor_forger\``, m);
}
const query = args.join(" ").trim().split(/\s+/).map(tag => tag.replace(/\s+/g, '_')).join(" ");
try {
await m.react(rwait);
const apiUrl = "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=" + encodeURIComponent(query) + "&limit=100&user_id=5405830&api_key=2b11e512aee1a0f952dd9cda56da50c441957c087278bc59a948fd2e7c9fdc21263580f4ee7a7927c36788ddedeaf64bfa79092750969aca4667966c4018992c";
const res = await fetch(apiUrl);
const text = await res.text();
let json;
try {
json = JSON.parse(text);
} catch {
await m.react(error);
return conn.reply(m.chat, "> (｡•́︿•̀｡) 𝖱𝖾𝗌𝗉𝗎𝖾𝗌𝗍⍺ 𝗂𝗇𝗏⍺́𝗅𝗂𝖽⍺ 𝖽𝖾 𝗅⍺ ⍺𝗉𝗂... 💔", m);
}
if (!Array.isArray(json) || json.length === 0) {
await m.react(error);
return conn.reply(m.chat, `> (っ- ‸ - ς) 𝖭𝗈 𝖾𝗇𝖼𝗈𝗇𝗍𝗋𝖾́ 𝗂𝗆⍺́𝗀𝖾𝗇𝖾𝗌 𝗉⍺𝗋⍺ \`${query}\`... 𝗂𝗇𝗍𝖾𝗇𝗍⍺ 𝖼𝗈𝗇 𝗈𝗍𝗋𝗈 𝗍𝖾́𝗋𝗆𝗂𝗇𝗈. 💙`, m);
}
const imageUrls = [];
const limit = Math.min(json.length, 5);
for (let i = 0; i < limit; i++) {
const randomItem = json[Math.floor(Math.random() * json.length)];
if (!imageUrls.includes(randomItem.file_url)) {
imageUrls.push(randomItem.file_url);
}
}
if (imageUrls.length < 2) {
await m.react(error);
return conn.reply(m.chat, "> (˶˃ ᵕ ˂˶) 𝖭𝗈 𝗌𝖾 𝖾𝗇𝖼𝗈𝗇𝗍𝗋⍺𝗋𝗈𝗇 𝗌𝗎𝖿𝗂𝖼𝗂𝖾𝗇𝗍𝖾𝗌 𝗂𝗆⍺́𝗀𝖾𝗇𝖾𝗌 𝗉⍺𝗋⍺ 𝖼𝗋𝖾⍺𝗋 𝗎𝗇 ⍺́𝗅𝖻𝗎𝗆... 🌸", m);
}
const albumImages = imageUrls.map(url => ({
type: "image",
data: { url: url }
}));
const aestheticCaption = `ㅤㅤㅤ
𝗥𝗎𝗅𝖾𝟥𝟦 ㅤㅤ❚❚❚ㅤㅤ🔞ㅤ⎯🌸ㅤ.   
𝗥𝖾𝗌𝗎𝗅𝗍⍺𝖽𝗈𝗌ㅤ࣪ㅤ 𝗉⍺𝗋⍺   \`${query}\`
࣮𝖽𝗂𝗌𝖿𝗋𝗎𝗍⍺"     𝗅⍺𝗌ㅤ࣫     𝗂𝗆⍺́𝗀𝖾𝗇𝖾𝗌 ㅤ
⎯⎯⵿⎯̸⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯⵿⎯⵿ؗ⎯⵿⎯⵿⎯̸⵿⎯⎯`;
registerRule34QueueHandler();
await enqueueMediaJob("rule34:album", {
jid: m.chat,
medias: albumImages,
options: {
caption: aestheticCaption,
quoted: m
}
}, { conn });
await m.react(done);
} catch (e) {
console.error(e);
await m.react(error);
return conn.reply(m.chat, `> 💔 (´；ω；\`) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 ⍺𝗅 𝗂𝗇𝗍𝖾𝗇𝗍⍺𝗋 𝖻𝗎𝗌𝖼⍺𝗋... 𝗍⍺𝗅 𝗏𝖾𝗓 𝗉𝗎𝖾𝖽𝗈 𝗂𝗇𝗍𝖾𝗇𝗍⍺𝗋𝗅𝗈 𝗆⍺́𝗌 𝗍⍺𝗋𝖽𝖾... ✨`, m);
}
};
handler.help = ["r34 <tag>", "rule34 <tag>"];
handler.command = ['r34', "rule34"];
handler.tags = ['nsfw'];
export default handler;