
let handler = async (m, { conn }) => {
const texto = `
👥✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐠𝐫𝐮𝐩𝐨𝐬 𝐩𝐚𝐫𝐚 𝐮𝐧𝐚 𝐦𝐞𝐣𝐨𝐫 𝐠𝐞𝐬𝐭𝐢𝐨́𝐧 𝐝𝐞 𝐞𝐥𝐥𝐨𝐬 🔧📢⊹

᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#config • #on*
> ✦ Ver opciones de configuración de grupos.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#hidetag*
> ✦ Envía un mensaje mencionando a todos los usuarios.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#gp • #infogrupo*
> ✦ Ver la información del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#linea • #listonline*
> ✦ Ver la lista de los usuarios en línea.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#setwelcome*
> ✦ Establecer un mensaje de bienvenida personalizado.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#setbye*
> ✦ Establecer un mensaje de despedida personalizado.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#link*
> ✦ El Bot envía el link del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#admins • #admin*
> ✦ Mencionar a los admins para solicitar ayuda.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#restablecer • #revoke*
> ✦ Restablecer el enlace del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#grupo • #group* [open / abrir]
> ✦ Cambia ajustes del grupo para que todos los usuarios envíen mensaje.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#grupo • #gruop* [close / cerrar]
> ✦ Cambia ajustes del grupo para que solo los administradores envíen mensaje.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#kick* [número / mención]
> ✦ Elimina un usuario de un grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#add • #añadir • #agregar* [número]
> ✦ Invita a un usuario a tu grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#promote* [mención / etiquetar]
> ✦ El Bot dará administrador al usuario mencionado.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#demote* [mención / etiquetar]
> ✦ El Bot quitará el rol de administrador al usuario mencionado.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#gpbanner • #groupimg*
> ✦ Cambiar la imagen del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#gpname • #groupname*
> ✦ Cambiar el nombre del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#gpdesc • #groupdesc*
> ✦ Cambiar la descripción del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#advertir • #warn • #warning*
> ✦ Dar una advertencia a un usuario.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#unwarn • #delwarn*
> ✦ Quitar advertencias.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#advlist • #listadv*
> ✦ Ver lista de usuarios advertidos.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#banchat*
> ✦ Banear al Bot en un chat o grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#unbanchat*
> ✦ Desbanear al Bot del chat o grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#mute* [mención / etiquetar]
> ✦ El Bot elimina los mensajes del usuario.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#unmute* [mención / etiquetar]
> ✦ El Bot deja de eliminar los mensajes del usuario.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#encuesta • #poll*
> ✦ Crea una encuesta.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#delete • #del*
> ✦ Elimina mensajes de otros usuarios.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#fantasmas*
> ✦ Ver lista de inactivos del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#topmensajes • #topmsg • #topactividad* [página]
> ✦ Ver el ranking de mensajes y comandos de los últimos 30 días.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#kickfantasmas*
> ✦ Elimina a los inactivos del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#invocar • #tagall • #todos*
> ✦ Invoca a todos los usuarios del grupo.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#setemoji • #setemo*
> ✦ Cambia el emoji que se usa en la invitación de usuarios.
᪄🧛🏼‍♀️᮫ᮣᮭᮡᩪᩬᩧᩦᩥ᪃ ؉ ᩡᩡ *#listnum • #kicknum*
> ✦ Elimina a usuarios por el prefijo de país.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: 'https://files.catbox.moe/bi19e7.png' },
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
