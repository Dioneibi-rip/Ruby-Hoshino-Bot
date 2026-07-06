
let handler = async (m, { conn }) => {
const texto = `
🎌⊹ 𝐌𝐄𝐍𝐔 𝐀𝐍𝐈𝐌𝐄 / 𝐑𝐄𝐀𝐂𝐂𝐈𝐎𝐍𝐄𝐒 ⊹💢

꒰⛸️꒱ *#kiss • #besar* + <mención/respuesta>
> ✦ Besa al usuario elegido.
꒰⛸️꒱ *#hug • #abrazar* + <mención/respuesta>
> ✦ Abraza al usuario elegido.
꒰⛸️꒱ *#pat • #acariciar* + <mención/respuesta>
> ✦ Acaricia a alguien.
꒰⛸️꒱ *#slap • #bofetada* + <mención/respuesta>
> ✦ Da una bofetada.
꒰⛸️꒱ *#punch • #golpear* + <mención/respuesta>
> ✦ Golpea a alguien.
꒰⛸️꒱ *#run • #correr* + <mención/respuesta>
> ✦ Corre o huye de alguien.
꒰⛸️꒱ *#sad • #triste* / *#happy • #feliz*
> ✦ Expresa tristeza o felicidad.
꒰⛸️꒱ *#cry • #llorar* / *#think • #pensando*
> ✦ Llora o piensa.
꒰⛸️꒱ *#bite • #morder* / *#lick • #lamer*
> ✦ Muerde o lame a alguien.
꒰⛸️꒱ *#poke • #picar* / *#cuddle • #acurrucarse*
> ✦ Molesta o acurruca a alguien.
꒰⛸️꒱ *#dance • #bailar* / *#laugh • #reirse*
> ✦ Baila o se ríe.
꒰⛸️꒱ *#waifu*
> ✦ Envía una waifu aleatoria.
꒰⛸️꒱ *#ppcp • #ppcouple*
> ✦ Imágenes de perfil para parejas.
꒰⛸️꒱ *#fraseanime*
> ✦ Frase anime aleatoria.
꒰⛸️꒱ *#anime • #animedl*
> ✦ Busca enlaces/capítulos de anime.

╰──────✧ Ruby Anime ✧──────╯
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: 'https://files.catbox.moe/8iug4q.jpeg' },
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

handler.command = ['menuanime', 'reaccionesmenu'];
export default handler;
