let handler = async (m, { conn, usedPrefix }) => {
const prefix = usedPrefix || conn.botProfile?.customPrefix || '#'
const text = `┏━━━⏤͟͟͞͞★꙲⃝͟⚙️ *GUÍA DOCUMENTACIÓN SUB-BOT* ━━━┓
┃
┃ 📌 *¿Qué es un Sub-Bot?:*
┃ Un Sub-Bot es una sesión clonada de Ruby Hoshino que funciona con Baileys Multi-Device. Puedes conectarlo escaneando QR con *${prefix}jadibot* / *${prefix}qr* o usando código de vinculación con *${prefix}code*.
┃
┃ 🎯 *Sistema de Personalización:*
┃ Cada Sub-Bot puede tener identidad propia: nombre, prefijo, imagen de pairing, moneda/divisa RPG, pack de stickers y banners. Usa *${prefix}setbotmenu* respondiendo a una imagen, GIF o video para cambiar el menú principal, y *${prefix}setbanner [categoría]* respondiendo a una imagen para cambiar menús específicos.
┃
┃ 🏷️ *Banners útiles:*
┃ • *${prefix}setbanner menu* — imagen del menú principal.
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
┃ Responde a una imagen con *${prefix}setbanner menu* o a un video con *${prefix}setbotmenu* para personalizar la presentación del Sub-Bot.
┗━━━━⏤͟͟͞͞★꙲⃝͟🌸❈┉━━━━━━┛`
return conn.reply(m.chat, text, m)
}
handler.help = ['subbotdoc', 'jadibotdoc', 'guiajadibot']
handler.tags = ['jadibot']
handler.command = ['subbotdoc', 'jadibotdoc', 'guiajadibot']
export default handler
