let handler = async (m, { conn, usedPrefix }) => {
const prefix = usedPrefix || conn.botProfile?.customPrefix || '#'
const text = `┏━━━⏤͟͟͞͞★꙲⃝͟⚙️ *GUÍA DOCUMENTACIÓN SUB-BOT* ━━━┓
┃
┃ 📌 *¿Qué es un Sub-Bot?:*
┃ Un Sub-Bot es una sesión clonada de Ruby Hoshino que funciona con Baileys Multi-Device. Puedes conectarlo escaneando QR con *${prefix}jadibot* / *${prefix}qr* o usando código de vinculación con *${prefix}code*.
┃
┃ 🎯 *Sistema de Personalización:*
┃ Cada Sub-Bot puede tener identidad propia: nombre, prefijo, imagen de pairing, moneda/divisa RPG, pack de stickers y banners. Usa *${prefix}setbotmenu* respondiendo a una imagen estática para cambiar la portada del menú principal; usa *${prefix}setbotmenuall* para el Menú Completo con imagen, GIF o video MP4, y *${prefix}setbanner [categoría]* respondiendo a una imagen para cambiar menús específicos.
┃
┃ 🏷️ *Banners útiles:*
┃ • *${prefix}setbotmenu* — imagen estática del menú principal.
┃ • *${prefix}setbotmenuall* — media del Menú Completo.
┃ • *${prefix}setbanner menu* — banner alternativo del menú principal.
┃ • *${prefix}setbanner menujadibot* — imagen de la guía Jadibot.
┃ • *${prefix}setbanner nsfw* — banner de categoría NSFW.
┃ • *${prefix}setmoneda Rubíes* — divisa personalizada.
┃
┃ 💾 *Persistencia:*
┃ Toda la decoración, banners, moneda y ajustes personalizados se conservan guardados aunque la sesión del Sub-Bot se desconecte, cierre o reinicie.
┃
┃ 🛑 *Gestión en Grupos:*
┃ Para evitar spam cuando hay varios bots, un admin puede fijar un único bot con *${prefix}setprimary @bot*. Desde ese momento solo el bot primario responderá comandos en el grupo. Para liberar la ruta y permitir todos otra vez, usa *${prefix}resetbot*.
┃
┃ 🧰 *Comandos rápidos:*
┃ • *${prefix}jadibot*
┃ • *${prefix}subbots*
┃ • *${prefix}setbotmenu*
┃ • *${prefix}setbanner*
┃ • *${prefix}setprimary*
┃ • *${prefix}resetbot*
┃
┃ 💡 *Tip:*
┃ Responde a una imagen con *${prefix}setbotmenu* para la portada, a un video/GIF con *${prefix}setbotmenuall* para MenuAll o a una imagen con *${prefix}setbanner menujadibot* para la sección Jadibot.
┗━━━━⏤͟͟͞͞★꙲⃝͟🌸❈┉━━━━━━┛`
return conn.reply(m.chat, text, m)
}
handler.help = ['subbotdoc', 'jadibotdoc', 'guiajadibot']
handler.tags = ['jadibot']
handler.command = ['subbotdoc', 'jadibotdoc', 'guiajadibot']
export default handler
