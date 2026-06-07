
let handler = async (m, { conn }) => {
  const texto = `
📥⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐝𝐞𝐬𝐜𝐚𝐫𝐠𝐚𝐬 𝐩𝐚𝐫𝐚 𝐯𝐚𝐫𝐢𝐨𝐬 𝐚𝐫𝐜𝐡𝐢𝐯𝐨𝐬  📂⊹

ㅤۚ𑁯ׂᰍ  ☕ ᳴   ׅ  ׄʚ   ̶ *#tiktok • #tt*
> ✦ Descarga videos de TikTok.
ㅤۚ𑁯ׂᰍ  ☕ ᳴   ׅ  ׄʚ   ̶ *#mediafire • #mf*
> ✦ Descargar un archivo de MediaFire.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#tiktok • #tt*
> ✦ Descarga videos de TikTok.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#mediafire • #mf*
> ✦ Descargar archivos de MediaFire.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#mega • #mg* + [enlace]
> ✦ Descargar archivos de MEGA.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#play • #play2*
> ✦ Descargar música/video de YouTube.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#ytmp3 • #ytmp4*
> ✦ Descarga directa por url de YouTube.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#fb • #facebook*
> ✦ Descargar videos de Facebook.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#twitter • #x* + [link]
> ✦ Descargar videos de Twitter/X.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#ig • #instagram*
> ✦ Descargar contenido de Instagram.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#tts • #tiktoks* + [búsqueda]
> ✦ Buscar videos de TikTok.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#terabox • #tb* + [enlace]
> ✦ Descargar archivos de Terabox.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#gdrive • #drive* + [enlace]
> ✦ Descargar archivos desde Google Drive.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#ttimg • #ttmp3* + <url>
> ✦ Descargar fotos/audios de TikTok.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#gitclone* + <url>
> ✦ Descargar repositorios desde GitHub.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#xvideosdl*
> ✦ Descargar videos de Xvideos.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#xnxxdl*
> ✦ Descargar videos de XNXX.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#apk • #modapk*
> ✦ Descargar APKs (Aptoide).
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#tiktokrandom • #ttrandom*
> ✦ Descargar video aleatorio de TikTok.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#npmdl • #npmdownloader*
> ✦ Descargar paquetes desde NPMJs.
ㅤۚ𑁯ׂᰍ ☕ ᳴ ׅ ׄʚ ̶ *#animelinks • #animedl*
> ✦ Descargar enlaces disponibles de anime.
╰──── ੈ₊˚༅༴╰────︶.︶ ⸙ ͛ ͎ ͛ ︶.︶ ੈ₊˚༅
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
