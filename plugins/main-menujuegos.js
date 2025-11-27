let handler = async (m, { conn }) => {
  const texto = `
🎮✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐣𝐮𝐞𝐠𝐨𝐬 𝐩𝐚𝐫𝐚 𝐣𝐮𝐠𝐚𝐫 𝐜𝐨𝐧 𝐭𝐮𝐬 𝐚𝐦𝐢𝐠𝐨𝐬 🕹️🎲⊹

ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#amistad • #amigorandom* 
> ✦ Hacer amigos con un juego.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#chaqueta • #jalamela*  
> ✦ Hacerte una chaqueta.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#chiste*  
> ✦ La bot te cuenta un chiste.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#consejo*  
> ✦ La bot te da un consejo.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#doxeo • #doxear* + <mención>  
> ✦ Simular un doxeo falso.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#facto*  
> ✦ La bot te lanza un facto.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#formarpareja*  
> ✦ Forma una pareja.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#formarpareja5*  
> ✦ Forma 5 parejas diferentes.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#frase*  
> ✦ La bot te da una frase.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#huevo*  
> ✦ Agárrale el huevo a alguien.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#chupalo* + <mención>  
> ✦ Hacer que un usuario te la chupe.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#aplauso* + <mención>  
> ✦ Aplaudirle a alguien.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#marron* + <mención>  
> ✦ Burlarte del color de piel de un usuario.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#suicidar*  
> ✦ Suicídate.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#iq • #iqtest* + <mención>  
> ✦ Calcular el IQ de alguna persona.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#meme*  
> ✦ La bot te envía un meme aleatorio.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#morse*  
> ✦ Convierte un texto a código morse.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#nombreninja*  
> ✦ Busca un nombre ninja aleatorio.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#paja • #pajeame*  
> ✦ La bot te hace una paja.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#personalidad* + <mención>  
> ✦ La bot busca tu personalidad.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#piropo*  
> ✦ Lanza un piropo.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#pregunta*  
> ✦ Hazle una pregunta a la bot.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#ship • #pareja*  
> ✦ La bot te da la probabilidad de enamorarte de una persona.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#sorteo*  
> ✦ Empieza un sorteo.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#top*  
> ✦ Empieza un top de personas.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#formartrio* + <mención>  
> ✦ Forma un trío.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#ahorcado*  
> ✦ Diviértete jugando al ahorcado con la bot.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#genio*  
> ✦ Comienza una ronda de preguntas con el genio.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#mates • #matematicas*  
> ✦ Responde preguntas de matemáticas para ganar recompensas.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#ppt*  
> ✦ Juega piedra, papel o tijeras con la bot.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#sopa • #buscarpalabra*  
> ✦ Juega al famoso juego de sopa de letras.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#pvp • #suit* + <mención>  
> ✦ Juega un PVP contra otro usuario.  
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *#ttt*  
> ✦ Crea una sala de juego.  
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅,
  `.trim();

  await conn.sendMessage(m.chat, {
    image: { url: 'https://files.catbox.moe/pmyirp.jpeg' },
    caption: texto,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: '🎮 Zona de Juegos y Diversión',
        body: 'Diviértete con tus amigos',
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

handler.command = ['menujuegos', 'juegosmenu'];
export default handler;