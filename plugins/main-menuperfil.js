
let handler = async (m, { conn }) => {
const texto = `
🆔✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐩𝐞𝐫𝐟𝐢𝐥 𝐩𝐚𝐫𝐚 𝐯𝐞𝐫, 𝐜𝐨𝐧𝐟𝐢𝐠𝐮𝐫𝐚𝐫 𝐲 𝐜𝐨𝐦𝐩𝐫𝐨𝐛𝐚𝐫 𝐞𝐬𝐭𝐚𝐝𝐨𝐬 𝐝𝐞 𝐭𝐮 𝐩𝐞𝐫𝐟𝐢𝐥 📇🔍

░ ⃝🌀ᩧ᳕ᬵ *#setname*
> ✦ Establece un nombre personalizado para tu perfil.
░ ⃝🌀ᩧ᳕ᬵ *#setage • #edad*
> ✦ Agrega o actualiza tu edad en el bot.
░ ⃝🌀ᩧ᳕ᬵ *#unreg • #quitaregistro*
> ✦ Resetea tu cuenta y elimina tus datos guardados.
░ ⃝🌀ᩧ᳕ᬵ *#profile • #perfil*
> ✦ Muestra tu perfil de usuario.
░ ⃝🌀ᩧ᳕ᬵ *#marry* [mension / etiquetar]
> ✦ Propón matrimonio a otro usuario.
░ ⃝🌀ᩧ᳕ᬵ *#divorce*
> ✦ Divorciarte de tu pareja.
░ ⃝🌀ᩧ᳕ᬵ *#setgenre • #setgenero*
> ✦ Establece tu género en el perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *#delgenre • #delgenero*
> ✦ Elimina tu género del perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *#setbirth • #setnacimiento*
> ✦ Establece tu fecha de nacimiento en el perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *#delbirth • #delnacimiento*
> ✦ Elimina tu fecha de nacimiento del perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *#setdescription • #setdesc*
> ✦ Establece una descripción en tu perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *#deldescription • #deldesc*
> ✦ Elimina la descripción de tu perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *#lb • #lboard* + <Paginá>
> ✦ Top de usuarios con más (experiencia y nivel).
░ ⃝🌀ᩧ᳕ᬵ *#level • #lvl* + <@Mencion>
> ✦ Ver tu nivel y experiencia actual.
░ ⃝🌀ᩧ᳕ᬵ *#comprarpremium • #premium*
> ✦ Compra un pase premium para usar el bot sin límites.
░ ⃝🌀ᩧ᳕ᬵ *#confesiones • #confesar*
> ✦ Confiesa tus sentimientos a alguien de manera anonima.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅
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
