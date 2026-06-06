
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


await conn.sendMessage(
m.chat,
{
image: { url: 'https://files.catbox.moe/wel1hf.jpeg' },
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

handler.command = ['menuherramientas', 'herramientasmenu'];
export default handler;
