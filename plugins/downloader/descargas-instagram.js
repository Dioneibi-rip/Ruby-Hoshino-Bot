import { igdl } from 'ruhend-scraper'

var handler = async (m, { conn, args, command, usedPrefix, text }) => {

const isCmd = /^(ig|instagram|instadl|igdl)$/i.test(command);

async function reportError(e){
await conn.reply(m.chat, `⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁`, m, rcanal);
console.log(e);
}

if (!isCmd) return;
if (!text && !args[0]) return conn.reply(m.chat, `🚩 *Ingrese un enlace de Instagram*\n\nEjemplo: !ig https://www.instagram.com/reel/xxxx`, m, rcanal);
const url = args[0] || text;

if (!url.match(/instagram.com|instagr.am|ig.me/)) return conn.reply(m.chat, '🚩 *Enlace no válido*', m, rcanal);

await conn.reply(m.chat, '⁖❤️꙰  *Descargando su video de Instagram*', m, {
contextInfo: { 
forwardingScore: 2022, 
isForwarded: true}
});

m.react && m.react(rwait).catch(()=>{});

try {
const res = await igdl(url);
const data = res.data || res;

if (!data || (Array.isArray(data) && data.length === 0)) throw new Error('No se encontró contenido');

for (let i = 0; i < data.length; i++) {
const media = data[i];
const mediaUrl = media.url || media;
const isVideo = /(\.mp4|video)/i.test(mediaUrl);
const ext = isVideo ? 'mp4' : 'jpg';
const prettyCaption = `🌹̫ᩙ᮫〫𝆬  𝙘𝙤𝙣𝙩𝙚𝙣𝙞𝙙𝙤 𝙙𝙚 𝙞𝙣𝙨𝙩𝙖𝙜𝙧𝙖𝙢 𝙡𝙞𝙨𝙩𝙤`;

await conn.sendFile(m.chat, mediaUrl, `instagram.${ext}`, prettyCaption, m);
await new Promise(r => setTimeout(r, 800));
}

} catch (e) {
reportError(e);
}

};

handler.help = ['ig'];
handler.tags = ['descargas'];
handler.command = ['ig','instagram','igdl','instadl'];
handler.register = true;
handler.estrellas = 1;

export default handler;
