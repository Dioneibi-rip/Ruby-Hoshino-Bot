import moment from '../../library/momentCompat.js';

let handler = async (m, { conn, args, usedPrefix }) => {
const used = conn.botProfile?.customPrefix || usedPrefix || '#'
let owner = `
һ᥆ᥣᥲ! s᥆ᥡ  *${botname}*  ٩(˘◡˘)۶
ᥲ𝗊ᥙí 𝗍іᥱᥒᥱs ᥣᥲ ᥣіs𝗍ᥲ ძᥱ ᥴ᥆mᥲᥒძ᥆s ძᥱ m᥆ძs ᥡ ᥆ᥕᥒᥱrs

»  ⊹˚• \`OWNERS\` •˚⊹

❀ ᥴ᥆mᥲᥒძ᥆s ძᥱ m᥆ძᥱrᥲᥴіóᥒ ᥡ ᥴ᥆ᥒ𝗍r᥆ᥣ ᥲ᥎ᥲᥒzᥲძ᥆ ⍴ᥲrᥲ ᥆ᥕᥒᥱrs.
ᰔᩚ *${used}dev • ${used}owners*
> ✦ Abrir este menú de comandos de owner/mod.
ᰔᩚ *${used}addowner • ${used}delowner*
> ✦ Agrega o elimina un número de la lista de owners.
ᰔᩚ *${used}codigo*
> ✦ Crea un token o código de canjeó de códigos.
ᰔᩚ *${used}backup • ${used}copia*
> ✦ Crear un respaldo de seguridad de la *db* del Bot.
ᰔᩚ *${used}bcgc*
> ✦ Envia un mensaje a todos los grupos donde este el Bot.
ᰔᩚ *${used}cleanfiles*
> ✦ Elimina archivos temporales.
ᰔᩚ *${used}addcoins • ${used}añadircoin*
> ✦ Añade coins a un usuario.
ᰔᩚ *${used}userpremium • ${used}addprem*
> ✦ Otorgar premium a un usuario.
ᰔᩚ *${used}delprem ${used}remove*
> ✦ Quitar premium a un usuario.
ᰔᩚ *${used}addexp • ${used}añadirxp*
> ✦ Añade XP a un usuario.
ᰔᩚ *${used}autoadmin*
> ✦ El Bot dara admin automáticamente solo si el Bot es admin.
ᰔᩚ *${used}listban • ${used}banlist*
> ✦ Lista de usuarios y chats baneados.
ᰔᩚ *${used}banuser*
> ✦ Banear a un usuario.
ᰔᩚ *${used}unbanuser*
> ✦ Desbanear a un usuario.
ᰔᩚ *${used}dsowner • ${used}delai*
> ✦ Elimina archivos innecesarios de sesión.
ᰔᩚ *${used}cleartmp • ${used}vaciartmp*
> ✦ Elimina archivo innecesarios de la carpeta tmp.
ᰔᩚ *${used}block • ${used}unblock*
> ✦ Bloquear o desbloquear a un usuario del número del Bot.
ᰔᩚ *${used}listblock • ${used}blocklist*
> ✦ Ver listado de usuarios bloqueados.
ᰔᩚ *${used}removecoin • ${used}quitarcoin*
> ✦ Quitar coins a un usuario.
ᰔᩚ *${used}deletedatauser • ${used}resetuser*
> ✦ Restablecer los datos de un usuario.
ᰔᩚ *${used}removexp • ${used}quitarxp*
> ✦ Quitar XP a un usuario.
ᰔᩚ *${used}newgc ${used}creargc*
> ✦ Crea un nuevo grupo desde el número del Bot.
ᰔᩚ *${used}deletefile*
> ✦ Elimina archivos del Bot
ᰔᩚ *${used}get • ${used}fetch*
> ✦ Ver el estado de una página web.
ᰔᩚ *${used}plugin • ${used}getplugin*
> ✦ Extraer un plugin de los archivos del Bot.
ᰔᩚ *${used}grouplist • ${used}listgroup*
> ✦ Ver listado de grupos en los que está unido el Bot.
ᰔᩚ *${used}join • ${used}invite*
> ✦ Agregar el Bot a un grupo mediante el enlace de invitación.
ᰔᩚ *${used}leave • ${used}salir*
> ✦ Sacar el Bot de un grupo.
ᰔᩚ *${used}let*
> ✦ Envia un mensaje con una duración de 1 hora.
ᰔᩚ *${used}reiniciar • ${used}restart*
> ✦ Reiniciar el servidor del Bot.
ᰔᩚ *${used}reunion • ${used}meeting*
> ✦ Envia un aviso de reunión a los owners.
ᰔᩚ *${used}savejs • ${used}savefile*
> ✦ Guarda un archivo en una de las rutas del Bot.
ᰔᩚ *${used}saveplugin*
> ✦ Guarda un plugin en la carpeta de comandos del Bot.
ᰔᩚ *${used}setbanner*
> ✦ Cambia la imagen del menu principal del Bot.
ᰔᩚ *${used}setavatar*
> ✦ Cambia la imagen del catálogo.
ᰔᩚ *${used}addcmd • ${used}setcmd*
> ✦ Guarda un sticker/imagen como texto o comando.
ᰔᩚ *${used}delcmd*
> ✦ Elimina el texto/comando del Bot.
ᰔᩚ *${used}cmdlist • ${used}listcmd*
> ✦ Ver listado de textos/comandos.
ᰔᩚ *${used}setimage • ${used}setpfp*
> ✦ Cambia la foto del perfil del Bot.
ᰔᩚ *${used}setmoneda*
> ✦ Cambia la moneda del Bot.
ᰔᩚ *${used}setname*
> ✦ Cambia el nombre del Bot
ᰔᩚ *${used}setbio • ${used}setstatus*
> ✦ Cambia la biografía del Bot.
ᰔᩚ *${used}update*
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
