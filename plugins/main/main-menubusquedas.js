
let handler = async (m, { conn }) => {
const texto = `
🔍⊹ 𝐌𝐄𝐍𝐔 𝐃𝐄 𝐁𝐔́𝐒𝐐𝐔𝐄𝐃𝐀𝐒 ⊹🔎

⌈ ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#tiktoksearch • #tiktoks*
> ✦ Buscador de videos de TikTok.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#ytsearch • #yts*
> ✦ Realiza búsquedas en YouTube.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#githubsearch*
> ✦ Buscador de usuarios de GitHub.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#pin • #pinterest*
> ✦ Buscador de imágenes de Pinterest.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#imagen • #image*
> ✦ Buscador de imágenes en Google.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#animesearch • #animess*
> ✦ Buscador de animes en TioAnime.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#animei • #animeinfo*
> ✦ Buscador de capítulos de #animesearch.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#infoanime*
> ✦ Buscador de información de anime/manga.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#hentaimanga • #3hentai*
> ✦ Busca mangas hentai y permite descargarlos en PDF.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#xnxxsearch • #xnxxs*
> ✦ Buscador de videos de XNXX.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#xvsearch • #xvideossearch*
> ✦ Buscador de videos de Xvideos.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#pornhubsearch • #phsearch*
> ✦ Buscador de videos de Pornhub.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *#npmjs*
> ✦ Buscador de paquetes en npmjs.
᷼︶۪۪۪۪፝֟᷼︶᷼╰──────✧──────╯᷼︶᷼
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: 'https://files.catbox.moe/jau272.jpeg' },
caption: texto,
contextInfo: {
mentionedJid: [m.sender],
isForwarded: true,
forwardedNewsletterMessageInfo: {
newsletterJid: '120363335626706839@newsletter',
newsletterName: '..⃗. 💌 ⌇ ¡Noticias y más de tu idol favorita! ⊹ ִ ּ',
serverMessageId: -1,
},
},
},
{ quoted: fkontak }
);
};

handler.command = ['menubusquedas', 'busquedamenu'];
export default handler;
