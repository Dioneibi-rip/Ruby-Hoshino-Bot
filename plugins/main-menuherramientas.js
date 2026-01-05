let handler = async (m, { conn }) => {
  const texto = `
🛠️✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐡𝐞𝐫𝐫𝐚𝐦𝐢𝐞𝐧𝐭𝐚𝐬 𝐜𝐨𝐧 𝐦𝐮𝐜𝐡𝐚𝐬 𝐟𝐮𝐧𝐜𝐢𝐨𝐧𝐞𝐬 ⚙️

⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *#calcular • #calcular • #cal*  
> ✦ Calcular todo tipo de ecuaciones.
⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *#horario*  
> ✦ Ver el horario global de los países.
⢷ ꉹᩙ  ִ ▒🎡ᩬ᷒ᰰ⃞  ˄᪲ *#fake • #fakereply*  
> ✦ Crea un mensaje falso de un usuario.
⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *#enhance • #remini • #hd*  
> ✦ Mejora la calidad de una imagen.
⢷ ꉹᩙ  ִ ▒🎡ᩬ᷒ᰰ⃞  ˄᪲ *#letra*  
> ✦ Cambia la fuente de las letras.
⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *#read • #readviewonce • #ver*  
> ✦ Ver imágenes de una sola vista.
⢷ ꉹᩙ  ִ ▒🎡ᩬ᷒ᰰ⃞  ˄᪲ *#whatmusic • #shazam*  
> ✦ Descubre el nombre de canciones o vídeos.
⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *#spamwa • #spam*  
> ✦ Envía spam a un usuario.
⢷ ꉹᩙ  ִ ▒🎡ᩬ᷒ᰰ⃞  ˄᪲ *#ss • #ssweb*  
> ✦ Ver el estado de una página web.
⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *#length • #tamaño*  
> ✦ Cambia el tamaño de imágenes y vídeos.
⢷ ꉹᩙ  ִ ▒🎡ᩬ᷒ᰰ⃞  ˄᪲ *#say • #decir* + [texto]  
> ✦ Repetir un mensaje.
⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *#todoc • #toducument*  
> ✦ Crea documentos de (audio, imágenes y vídeos).
⢷ ꉹᩙ  ִ ▒🎡ᩬ᷒ᰰ⃞  ˄᪲ *#translate • #traducir • #trad*  
> ✦ Traduce palabras en otros idiomas.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅,
  `.trim();

  await conn.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/wel1hf.jpeg' },
    caption: texto,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: '🛠️ Herramientas Útiles',
        body: 'Funciones variadas para el día a día',
        thumbnail: icons,
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

handler.command = ['menuherramientas', 'herramientasmenu'];
export default handler;
