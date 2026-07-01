import moment from 'moment-timezone';

let handler = async (m, { conn, args }) => {
let owner = `
һ᥆ᥣᥲ! s᥆ᥡ  *${botname}*  ٩(˘◡˘)۶
ᥲ𝗊ᥙí 𝗍іᥱᥒᥱs ᥣᥲ ᥣіs𝗍ᥲ ძᥱ ᥴ᥆mᥲᥒძ᥆s ძᥱ m᥆ძs ᥡ ᥆ᥕᥒᥱrs

»  ⊹˚• \`OWNERS\` •˚⊹

❀ ᥴ᥆mᥲᥒძ᥆s ძᥱ m᥆ძᥱrᥲᥴіóᥒ ᥡ ᥴ᥆ᥒ𝗍r᥆ᥣ ᥲ᥎ᥲᥒzᥲძ᥆ ⍴ᥲrᥲ ᥆ᥕᥒᥱrs.
ᰔᩚ *#dev • #owners*
> ✦ Abrir este menú de comandos de owner/mod.
ᰔᩚ *#addowner • #delowner*
> ✦ Agrega o elimina un número de la lista de owners.
ᰔᩚ *#codigo*
> ✦ Crea un token o código de canjeó de códigos.
ᰔᩚ *#backup • #copia*
> ✦ Crear un respaldo de seguridad de la *db* del Bot.
ᰔᩚ *#bcgc*
> ✦ Envia un mensaje a todos los grupos donde este el Bot.
ᰔᩚ *#cleanfiles*
> ✦ Elimina archivos temporales.
ᰔᩚ *#addcoins • #añadircoin*
> ✦ Añade coins a un usuario.
ᰔᩚ *#userpremium • #addprem*
> ✦ Otorgar premium a un usuario.
ᰔᩚ *#delprem #remove*
> ✦ Quitar premium a un usuario.
ᰔᩚ *#addexp • #añadirxp*
> ✦ Añade XP a un usuario.
ᰔᩚ *#autoadmin*
> ✦ El Bot dara admin automáticamente solo si el Bot es admin.
ᰔᩚ *#listban • #banlist*
> ✦ Lista de usuarios y chats baneados.
ᰔᩚ *#banuser*
> ✦ Banear a un usuario.
ᰔᩚ *#unbanuser*
> ✦ Desbanear a un usuario.
ᰔᩚ *#dsowner • #delai*
> ✦ Elimina archivos innecesarios de sesión.
ᰔᩚ *#cleartmp • #vaciartmp*
> ✦ Elimina archivo innecesarios de la carpeta tmp.
ᰔᩚ *#block • #unblock*
> ✦ Bloquear o desbloquear a un usuario del número del Bot.
ᰔᩚ *#listblock • #blocklist*
> ✦ Ver listado de usuarios bloqueados.
ᰔᩚ *#removecoin • #quitarcoin*
> ✦ Quitar coins a un usuario.
ᰔᩚ *#deletedatauser • #resetuser*
> ✦ Restablecer los datos de un usuario.
ᰔᩚ *#removexp • #quitarxp*
> ✦ Quitar XP a un usuario.
ᰔᩚ *#newgc #creargc*
> ✦ Crea un nuevo grupo desde el número del Bot.
ᰔᩚ *#deletefile*
> ✦ Elimina archivos del Bot
ᰔᩚ *#get • #fetch*
> ✦ Ver el estado de una página web.
ᰔᩚ *#plugin • #getplugin*
> ✦ Extraer un plugin de los archivos del Bot.
ᰔᩚ *#grouplist • #listgroup*
> ✦ Ver listado de grupos en los que está unido el Bot.
ᰔᩚ *#join • #invite*
> ✦ Agregar el Bot a un grupo mediante el enlace de invitación.
ᰔᩚ *#leave • #salir*
> ✦ Sacar el Bot de un grupo.
ᰔᩚ *#let*
> ✦ Envia un mensaje con una duración de 1 hora.
ᰔᩚ *#prefix*
> ✦ Ver o cambiar el prefijo del Bot.
ᰔᩚ *#resetprefix*
> ✦ Restablecer el prefijo del Bot.
ᰔᩚ *#reiniciar • #restart*
> ✦ Reiniciar el servidor del Bot.
ᰔᩚ *#reunion • #meeting*
> ✦ Envia un aviso de reunión a los owners.
ᰔᩚ *#savejs • #savefile*
> ✦ Guarda un archivo en una de las rutas del Bot.
ᰔᩚ *#saveplugin*
> ✦ Guarda un plugin en la carpeta de comandos del Bot.
ᰔᩚ *#setbanner*
> ✦ Cambia la imagen del menu principal del Bot.
ᰔᩚ *#setavatar*
> ✦ Cambia la imagen del catálogo.
ᰔᩚ *#addcmd • #setcmd*
> ✦ Guarda un sticker/imagen como texto o comando.
ᰔᩚ *#delcmd*
> ✦ Elimina el texto/comando del Bot.
ᰔᩚ *#cmdlist • #listcmd*
> ✦ Ver listado de textos/comandos.
ᰔᩚ *#setimage • #setpfp*
> ✦ Cambia la foto del perfil del Bot.
ᰔᩚ *#setmoneda*
> ✦ Cambia la moneda del Bot.
ᰔᩚ *#setname*
> ✦ Cambia el nombre del Bot
ᰔᩚ *#setbio • #setstatus*
> ✦ Cambia la biografía del Bot.
ᰔᩚ *#update*
> ✦ Actualiza el Bot a la versión más reciente de GitHub.
`.trim();

await conn.sendMessage(m.chat, {
text: owner,
contextInfo: {

}
}, { quoted: m });
};

handler.help = ['mods'];
handler.tags = ['main'];
handler.command = ['dev', 'owners'];
handler.rowner = true;

export default handler;
