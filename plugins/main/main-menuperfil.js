
let handler = async (m, { conn }) => {
const texto = `
🆔⊹ 𝐌𝐄𝐍𝐔 𝐏𝐄𝐑𝐅𝐈𝐋 ⊹📇

꒰🌀꒱ *#perfil • #profile*
> ✦ Muestra tu perfil o el de un usuario.
꒰🌀꒱ *#level • #lvl • #nivel*
> ✦ Consulta nivel y experiencia.
꒰🌀꒱ *#lb • #lboard*
> ✦ Ranking de usuarios.
꒰🌀꒱ *#setname • #setnombre*
> ✦ Cambia tu nombre guardado.
꒰🌀꒱ *#setage • #edad*
> ✦ Guarda tu edad.
꒰🌀꒱ *#setgenre • #setgenero* / *#delgenre*
> ✦ Configura o elimina género.
꒰🌀꒱ *#setbirth • #setcumpleaños* / *#delbirth*
> ✦ Configura o elimina cumpleaños.
꒰🌀꒱ *#setdescription • #setdesc* / *#deldesc*
> ✦ Configura o elimina descripción.
꒰🌀꒱ *#marry • #divorce*
> ✦ Matrimonio y divorcio.
꒰🌀꒱ *#confesar • #confesiones*
> ✦ Confesiones anónimas.
꒰🌀꒱ *#premium • #comprarpremium*
> ✦ Compra premium.
꒰🌀꒱ *#unreg • #quitaregistro*
> ✦ Borra tu registro.

╰──────✧ Ruby Profile ✧──────╯
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: 'https://files.catbox.moe/a2cyzt.jpeg' },
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

handler.command = ['menuperfil', 'perfilmenu'];
export default handler;
