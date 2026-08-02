import { getActiveBotProfile, getMenuBanner } from '../../core/menu-banner.js'

let handler = async (m, { conn, usedPrefix }) => {
const profile = await getActiveBotProfile(conn)
const used = profile.customPrefix || usedPrefix || '#'
const texto = `
🆔⊹ 𝐌𝐄𝐍𝐔 𝐏𝐄𝐑𝐅𝐈𝐋 ⊹📇

░ ⃝🌀ᩧ᳕ᬵ *${used}setname*
> ✦ Establece un nombre personalizado para tu perfil.
░ ⃝🌀ᩧ᳕ᬵ *${used}setage • ${used}edad*
> ✦ Agrega o actualiza tu edad en el bot.
░ ⃝🌀ᩧ᳕ᬵ *${used}unreg • ${used}quitaregistro*
> ✦ Resetea tu cuenta y elimina tus datos guardados.
░ ⃝🌀ᩧ᳕ᬵ *${used}profile • ${used}perfil*
> ✦ Muestra tu perfil de usuario.
░ ⃝🌀ᩧ᳕ᬵ *${used}marry* [mension / etiquetar]
> ✦ Propón matrimonio a otro usuario.
░ ⃝🌀ᩧ᳕ᬵ *${used}divorce*
> ✦ Divorciarte de tu pareja.
░ ⃝🌀ᩧ᳕ᬵ *${used}setgenre • ${used}setgenero*
> ✦ Establece tu género en el perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *${used}delgenre • ${used}delgenero*
> ✦ Elimina tu género del perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *${used}setbirth • ${used}setcumpleaños*
> ✦ Establece tu fecha de nacimiento en el perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *${used}delbirth*
> ✦ Elimina tu fecha de nacimiento del perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *${used}setdescription • ${used}setdesc*
> ✦ Establece una descripción en tu perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *${used}deldescription • ${used}deldesc*
> ✦ Elimina la descripción de tu perfil del bot.
░ ⃝🌀ᩧ᳕ᬵ *${used}lb • ${used}lboard* + <Paginá>
> ✦ Top de usuarios con más (experiencia y nivel).
░ ⃝🌀ᩧ᳕ᬵ *${used}level • ${used}lvl* + <@Mencion>
> ✦ Ver tu nivel y experiencia actual.
░ ⃝🌀ᩧ᳕ᬵ *${used}comprarpremium • ${used}premium*
> ✦ Compra un pase premium para usar el bot sin límites.
░ ⃝🌀ᩧ᳕ᬵ *${used}confesiones • ${used}confesar*
> ✦ Confiesa tus sentimientos a alguien de manera anonima.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: getMenuBanner(profile, 'perfil', 'https://files.catbox.moe/a2cyzt.jpeg') },
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
