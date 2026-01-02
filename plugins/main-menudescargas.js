let handler = async (m, { conn }) => {
  const texto = `
📥⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐝𝐞𝐬𝐜𝐚𝐫𝐠𝐚𝐬 𝐩𝐚𝐫𝐚 𝐯𝐚𝐫𝐢𝐨𝐬 𝐚𝐫𝐜𝐡𝐢𝐯𝐨𝐬 📂⊹

☕ *#tiktok • #tt*
> ✦ Descarga videos de TikTok.

☕ *#mediafire • #mf*
> ✦ Descargar archivos de MediaFire.

☕ *#pinvid • #pinvideo* + [link]
> ✦ Descargar videos de Pinterest.

☕ *#mega • #mg* + [link]
> ✦ Descargar archivos de MEGA.

☕ *#play • #play2*
> ✦ Descargar música o video de YouTube.

☕ *#ytmp3 • #ytmp4*
> ✦ Descarga directa desde YouTube.

☕ *#fb • #facebook*
> ✦ Descargar videos de Facebook.

☕ *#twitter • #x* + [link]
> ✦ Descargar videos de Twitter/X.

☕ *#ig • #instagram*
> ✦ Descargar contenido de Instagram.

☕ *#terabox • #tb* + [link]
> ✦ Descargar archivos de Terabox.

☕ *#gdrive • #drive* + [link]
> ✦ Descargar archivos de Google Drive.
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
          newsletterJid: canalIdM,
          newsletterName: namechannel,
          serverMessageId: -1,
        },
      },
    },
    { quoted: fcontact }
  );
};

handler.command = ['menudescargas', 'dlmenu', 'descargas'];
export default handler;
