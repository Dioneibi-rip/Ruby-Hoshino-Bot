let handler = async (m, { conn }) => {
  const texto = `
🖼️✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐩𝐚𝐫𝐚 𝐜𝐫𝐞𝐚𝐜𝐢𝐨𝐧𝐞𝐬 𝐝𝐞 𝐬𝐭𝐢𝐜𝐤𝐞𝐫𝐬, 𝐞𝐭𝐜. 🎨🔖

🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *#sticker • #s*
> ✦ Crea stickers de (imagen/video).
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *#setmeta*
> ✦ Establece un pack y autor para los stickers.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *#delmeta*
> ✦ Elimina tu pack de stickers.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *#pfp • #getpic*
> ✦ Obtén la foto de perfil de un usuario.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *#qc*
> ✦ Crea stickers con texto o de un usuario.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *#toimg • #img*
> ✦ Convierte stickers en imagen.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *#brat • #ttp • #attp*︎
> ✦ Crea stickers con texto.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *#emojimix*
> ✦ Funciona 2 emojis para crear un sticker.
🏮 ⃞ּㅤ ᰩ 𑂳  ▢꯭֟፝▢   ׅ ੭ *#wm*
> ✦ Cambia el nombre de los stickers.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅,
  `.trim();

  await conn.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/61219t.png' },
    caption: texto,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: '💫 Comandos de diferentes tipos generadores de stickers',
        body: 'Crea y personaliza tus propios stickers',
        thumbnailUrl: 'https://files.catbox.moe/hdr7oh.jpg',
        mediaType: 1,
        renderLargerThumbnail: false,
        showAdAttribution: true,
        mediaUrl: 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P',
        sourceUrl: 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P',
        newsletterJid: '120363335626706839@newsletter',
        newsletterName: '⏤͟͞ू⃪፝͜⁞⟡『 𝙍𝙪𝙗𝙮 𝙃𝙤𝙨𝙝𝙞𝙣𝙤 𝘽𝙤𝙩 』࿐⟡'
      }
    }
  }, { quoted: m });
};

handler.command = ['menusticker', 'stickersmenu'];
export default handler;