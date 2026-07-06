
let handler = async (m, { conn }) => {
const texto = `
🛠️⊹ 𝐌𝐄𝐍𝐔 𝐃𝐄 𝐇𝐄𝐑𝐑𝐀𝐌𝐈𝐄𝐍𝐓𝐀𝐒 ⊹⚙️

꒰🎠꒱ *#sticker • #s*
> ✦ Convierte imagen/video a sticker.
꒰🎠꒱ *#qc*
> ✦ Crea un sticker estilo Quotly con texto.
꒰🎠꒱ *#brat*
> ✦ Genera sticker de texto estilo brat.
꒰🎠꒱ *#take • #wm*
> ✦ Cambia el pack/autor de un sticker.
꒰🎠꒱ *#toimg • #jpg*
> ✦ Convierte sticker a imagen.
꒰🎠꒱ *#tomp3 • #toaudio*
> ✦ Convierte video a audio.
꒰🎠꒱ *#tourl • #upload*
> ✦ Sube un archivo y devuelve enlace.
꒰🎠꒱ *#catbox • #ibb*
> ✦ Sube archivos a hosts alternos.
꒰🎠꒱ *#hd • #remini • #enhance*
> ✦ Mejora imágenes.
꒰🎠꒱ *#pfp • #getpic*
> ✦ Obtiene la foto de perfil del usuario mencionado.
꒰🎠꒱ *#read • #ver*
> ✦ Revela mensajes de una sola vista.
꒰🎠꒱ *#shazam • #whatmusic*
> ✦ Identifica canciones.
꒰🎠꒱ *#ssweb • #ss*
> ✦ Captura una página web.
꒰🎠꒱ *#qrcode*
> ✦ Genera un código QR.
꒰🎠꒱ *#tts • #tts2*
> ✦ Convierte texto en voz.
꒰🎠꒱ *#wiki • #wikipedia*
> ✦ Consulta Wikipedia.

╰──────✧ Ruby Tools ✧──────╯
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
