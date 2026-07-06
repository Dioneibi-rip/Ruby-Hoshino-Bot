
let handler = async (m, { conn }) => {
const texto = `
🔍⊹ 𝐌𝐄𝐍𝐔 𝐃𝐄 𝐁𝐔́𝐒𝐐𝐔𝐄𝐃𝐀𝐒 ⊹🔎

꒰🌸꒱ *#tiktoksearch • #tiktoks*
> ✦ Busca videos en TikTok.
꒰🌸꒱ *#ytsearch • #yts*
> ✦ Busca videos en YouTube.
꒰🌸꒱ *#githubsearch*
> ✦ Busca perfiles/repositorios de GitHub.
꒰🌸꒱ *#pin • #pinterest*
> ✦ Busca imágenes en Pinterest.
꒰🌸꒱ *#imagen • #image*
> ✦ Busca imágenes en la web.
꒰🌸꒱ *#animesearch • #animess*
> ✦ Busca animes en TioAnime.
꒰🌸꒱ *#animeinfo • #animei*
> ✦ Muestra información de un anime.
꒰🌸꒱ *#infoanime*
> ✦ Consulta datos de anime/manga.
꒰🌸꒱ *#npmjs*
> ✦ Busca paquetes de NPM.
꒰🔞꒱ *#xnxxsearch • #xnxxs*
> ✦ Busca videos en XNXX.
꒰🔞꒱ *#xvsearch • #xvideossearch*
> ✦ Busca videos en Xvideos.
꒰🔞꒱ *#pornhubsearch • #phsearch*
> ✦ Busca videos en Pornhub.

╰──────✧ Ruby Search ✧──────╯
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
