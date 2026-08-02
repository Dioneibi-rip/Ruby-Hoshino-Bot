import { getActiveBotProfile, getMenuBanner } from '../../core/menu-banner.js'

let handler = async (m, { conn, usedPrefix }) => {
const profile = await getActiveBotProfile(conn)
const used = profile.customPrefix || usedPrefix || '#'
const texto = `
👥✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐠𝐫𝐮𝐩𝐨𝐬 𝐩𝐚𝐫𝐚 𝐮𝐧𝐚 𝐦𝐞𝐣𝐨𝐫 𝐠𝐞𝐬𝐭𝐢𝐨́𝐧 𝐝𝐞 𝐞𝐥𝐥𝐨𝐬 🔧📢⊹

᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}config • ${used}on*
> ✦ Ver opciones de configuración de grupos.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}hidetag*
> ✦ Envía un mensaje mencionando a todos los usuarios.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}gp • ${used}infogrupo*
> ✦ Ver la información del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}linea • ${used}listonline*
> ✦ Ver la lista de los usuarios en línea.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}setwelcome*
> ✦ Establecer un mensaje de bienvenida personalizado.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}setbye*
> ✦ Establecer un mensaje de despedida personalizado.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}link*
> ✦ El Bot envía el link del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}admins • ${used}admin*
> ✦ Mencionar a los admins para solicitar ayuda.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}restablecer • ${used}revoke*
> ✦ Restablecer el enlace del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}grupo • ${used}group* [open / abrir]
> ✦ Cambia ajustes del grupo para que todos los usuarios envíen mensaje.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}grupo • ${used}gruop* [close / cerrar]
> ✦ Cambia ajustes del grupo para que solo los administradores envíen mensaje.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}kick* [número / mención]
> ✦ Elimina un usuario de un grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}add • ${used}añadir • ${used}agregar* [número]
> ✦ Invita a un usuario a tu grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}promote* [mención / etiquetar]
> ✦ El Bot dará administrador al usuario mencionado.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}demote* [mención / etiquetar]
> ✦ El Bot quitará el rol de administrador al usuario mencionado.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}gpbanner • ${used}groupimg*
> ✦ Cambiar la imagen del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}gpname • ${used}groupname*
> ✦ Cambiar el nombre del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}gpdesc • ${used}groupdesc*
> ✦ Cambiar la descripción del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}advertir • ${used}warn • ${used}warning*
> ✦ Dar una advertencia a un usuario.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}unwarn • ${used}delwarn*
> ✦ Quitar advertencias.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}advlist • ${used}listadv*
> ✦ Ver lista de usuarios advertidos.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}banchat*
> ✦ Banear al Bot en un chat o grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}unbanchat*
> ✦ Desbanear al Bot del chat o grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}mute* [mención / etiquetar]
> ✦ El Bot elimina los mensajes del usuario.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}unmute* [mención / etiquetar]
> ✦ El Bot deja de eliminar los mensajes del usuario.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}encuesta • ${used}poll*
> ✦ Crea una encuesta.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}delete • ${used}del*
> ✦ Elimina mensajes de otros usuarios.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}fantasmas*
> ✦ Ver lista de inactivos del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}topmensajes • ${used}topmsg • ${used}topactividad* [página]
> ✦ Ver el ranking de mensajes y comandos de los últimos 30 días.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}kickfantasmas*
> ✦ Elimina a los inactivos del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}invocar • ${used}tagall • ${used}todos*
> ✦ Invoca a todos los usuarios del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}setemoji • ${used}setemo*
> ✦ Cambia el emoji que se usa en la invitación de usuarios.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *${used}listnum • ${used}kicknum*
> ✦ Elimina a usuarios por el prefijo de país.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: getMenuBanner(profile, 'grupos', 'https://files.catbox.moe/bi19e7.png') },
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
{ quoted: global.fkontak || m }
);
};

handler.command = ['menugrupo', 'gruposmenu'];
export default handler;
