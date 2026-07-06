
let handler = async (m, { conn }) => {
const texto = `
📥⊹ 𝐌𝐄𝐍𝐔 𝐃𝐄 𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐒 ⊹📂

꒰☕꒱ *#play • #play2*
> ✦ Descarga música/video de YouTube por búsqueda.
꒰☕꒱ *#ytmp3 • #ytmp4*
> ✦ Descarga audio/video de YouTube por enlace.
꒰☕꒱ *#tiktok • #tt*
> ✦ Descarga videos de TikTok.
꒰☕꒱ *#ttimg • #tiktokimg*
> ✦ Descarga fotos de TikTok.
꒰☕꒱ *#ttmp3 • #tiktokmp3*
> ✦ Extrae audio de TikTok.
꒰☕꒱ *#instagram • #ig*
> ✦ Descarga contenido de Instagram.
꒰☕꒱ *#facebook • #fb*
> ✦ Descarga videos de Facebook.
꒰☕꒱ *#twitter • #x*
> ✦ Descarga videos de Twitter/X.
꒰☕꒱ *#mediafire • #mf*
> ✦ Descarga archivos de MediaFire.
꒰☕꒱ *#mega • #mg*
> ✦ Descarga archivos de MEGA.
꒰☕꒱ *#terabox • #tb*
> ✦ Descarga archivos de Terabox.
꒰☕꒱ *#gitclone*
> ✦ Descarga repositorios de GitHub.
꒰☕꒱ *#apk • #modapk*
> ✦ Busca/descarga APKs.
꒰☕꒱ *#spotify • #splay*
> ✦ Descarga música de Spotify.
꒰☕꒱ *#hentaimanga • #3hentai • #hentai*
> ✦ Busca y descarga manga hentai en PDF.
꒰🔞꒱ *#xnxxdl • #xvideosdl*
> ✦ Descarga videos adultos por enlace.

╰──────✧ Ruby Downloads ✧──────╯
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: 'https://files.catbox.moe/tw0g5u.png' },
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

handler.command = ['menudescargas', 'dlmenu', 'descargas'];
export default handler;
