import { getActiveBotProfile, getMenuBanner } from '../../core/menu-banner.js'

let handler = async (m, { conn, usedPrefix }) => {
const profile = await getActiveBotProfile(conn)
const used = profile.customPrefix || usedPrefix || '#'
const texto = `
📥⊹ 𝐌𝐄𝐍𝐔 𝐃𝐄 𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐒 ⊹📂

꒰☕꒱ *${used}play • ${used}playdoc • ${used}play2 • ${used}play2doc*
> ✦ Descarga música/video de YouTube por búsqueda.
꒰☕꒱ *${used}ytmp3 • ${used}ytmp4*
> ✦ Descarga audio/video de YouTube por enlace.
꒰☕꒱ *${used}tiktok • ${used}tt*
> ✦ Descarga videos de TikTok.
ㅤۚ𑁯ׂᰍ  ☕ ᳴   ׅ  ׄʚ   ̶ *${used}mediafire • ${used}mf*
> ✦ Descargar un archivo de MediaFire.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}tiktok • ${used}tt*
> ✦ Descarga videos de TikTok.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}mediafire • ${used}mf*
> ✦ Descargar archivos de MediaFire.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}mega • ${used}mg* + [enlace]
> ✦ Descargar archivos de MEGA.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}play • ${used}playdoc • ${used}play2 • ${used}play2doc*
> ✦ Descargar música/video de YouTube.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}ytmp3 • ${used}ytmp4*
> ✦ Descarga directa por url de YouTube.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}fb • ${used}facebook*
> ✦ Descargar videos de Facebook.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}twitter • ${used}x* + [link]
> ✦ Descargar videos de Twitter/X.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}ig • ${used}instagram*
> ✦ Descargar contenido de Instagram.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}tts • ${used}tiktoks* + [búsqueda]
> ✦ Buscar videos de TikTok.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}terabox • ${used}tb* + [enlace]
> ✦ Descargar archivos de Terabox.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}ttimg • ${used}tiktokimg • ${used}ttmp3* + <url>
> ✦ Descargar fotos/audios de TikTok.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}gitclone* + <url>
> ✦ Descargar repositorios desde GitHub.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}xvideosdl*
> ✦ Descargar videos de Xvideos.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}xnxxdl*
> ✦ Descargar videos de XNXX.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}apk • ${used}modapk*
> ✦ Descargar APKs (Aptoide).
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}tiktokrandom • ${used}ttrandom*
> ✦ Descargar video aleatorio de TikTok.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}npmdl • ${used}npmdownloader*
> ✦ Descargar paquetes desde NPMJs.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *${used}anime • ${used}animedl*
> ✦ Descargar enlaces disponibles de anime.
╰──── ੈ₊˚༅༴╰────︶.︶ ⸙ ͛ ͎ ͛ ︶.︶ ੈ₊˚༅
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: getMenuBanner(profile, 'descargas', 'https://files.catbox.moe/tw0g5u.png') },
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
