import { getActiveBotProfile, getMenuBanner } from '../../core/menu-banner.js'

let handler = async (m, { conn, usedPrefix }) => {
const profile = await getActiveBotProfile(conn)
const used = profile.customPrefix || usedPrefix || '#'
const texto = `
🔍⊹ 𝐌𝐄𝐍𝐔 𝐃𝐄 𝐁𝐔́𝐒𝐐𝐔𝐄𝐃𝐀𝐒 ⊹🔎

⌈ ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}tiktoksearch • ${used}tiktoks*
> ✦ Buscador de videos de TikTok.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}ytsearch • ${used}yts*
> ✦ Realiza búsquedas en YouTube.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}githubsearch*
> ✦ Buscador de usuarios de GitHub.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}pin • ${used}pinterest*
> ✦ Buscador de imágenes de Pinterest.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}imagen • ${used}image*
> ✦ Buscador de imágenes en Google.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}animesearch • ${used}animess*
> ✦ Buscador de animes en TioAnime.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}animei • ${used}animeinfo*
> ✦ Buscador de capítulos de ${used}animesearch.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}infoanime*
> ✦ Buscador de información de anime/manga.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}hentaimanga • ${used}3hentai*
> ✦ Busca mangas hentai y permite descargarlos en PDF.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}xnxxsearch • ${used}xnxxs*
> ✦ Buscador de videos de XNXX.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}xvsearch • ${used}xvideossearch*
> ✦ Buscador de videos de Xvideos.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}pornhubsearch • ${used}phsearch*
> ✦ Buscador de videos de Pornhub.
| ׄ 𝅄ׁ֢◯⃟▒ ꕀ▿⃟⃞🪴 ◯⃝◦・ׄ. *${used}npmjs*
> ✦ Buscador de paquetes en npmjs.
᷼︶۪۪۪۪፝֟᷼︶᷼╰──────✧──────╯᷼︶᷼
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: getMenuBanner(profile, 'busquedas', 'https://files.catbox.moe/jau272.jpeg') },
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
