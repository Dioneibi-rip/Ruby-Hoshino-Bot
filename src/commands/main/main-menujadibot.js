import { getActiveBotProfile, getMenuBanner } from '../../core/menu-banner.js'
let handler = async (m, { conn, usedPrefix }) => {
const profile = await getActiveBotProfile(conn)
const used = profile.customPrefix || usedPrefix || '#'
const prefix = used
const botName = profile.botName || 'Ruby Hoshino'
const text = `🤖⊹ 𝐌𝐄𝐍𝐔 𝐉𝐀𝐃𝐈𝐁𝐎𝐓 / 𝐒𝐔𝐁-𝐁𝐎𝐓𝐒 ⊹✨

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}qr*
> ✦ Crea una sesión de Sub-Bot escaneando código QR.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}code*
> ✦ Crea una sesión de Sub-Bot usando código de vinculación.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}bots* • *${prefix}sockets*
> ✦ Muestra los Sub-Bots conectados actualmente.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}deletesesion* • *${prefix}deletebot*
> ✦ Elimina tu sesión activa de Sub-Bot desde el bot principal.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}stop* • *${prefix}pausarbot*
> ✦ Pausa el Sub-Bot conectado.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setprimary* + <@bot>
> ✦ Define qué Sub-Bot atiende en el grupo.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}resetbot* • *${prefix}resetprimary*
> ✦ Restablece la ruta de bots en el grupo.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}banchat* / *${prefix}unbanchat*
> ✦ Banea o desbanea al Bot en el chat actual.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}subbotdoc* • *${prefix}jadibotdoc*
> ✦ Guía completa y documentación de Sub-Bots.

⚙️ 𝖯𝖤𝖱𝖲𝖮𝖭𝖠𝖫𝖨𝖹𝖠𝖢𝖨𝖮𝖭 𝖣𝖤𝖫 𝖲𝖴𝖡-𝖡𝖮𝖳

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}botname* • *${prefix}setbotname*
> ✦ Edita el nombre visible del Sub-Bot.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setprefix* • *${prefix}setbotprefix*
> ✦ Edita el prefijo de comandos del Sub-Bot.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setpprefix* • *${prefix}setpimg*
> ✦ Personaliza el Pairing Code (texto e imagen).

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setbotmenu* • *${prefix}setmenu*
> ✦ Cambia la portada del Menú Principal (#menu).

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setbotmenuall* • *${prefix}setmenuall*
> ✦ Cambia la imagen/video del menú completo (#menuall).

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setwarnimage* • *${prefix}setwarnmsg*
> ✦ Personaliza advertencias interactivas de permisos.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setbanner* • *${prefix}setmenubanner*
> ✦ Cambia el banner de submenús (Uso: ${prefix}setbanner [categoría]).

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setmoneda*
> ✦ Cambia el nombre de la moneda del Sub-Bot.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setbotwelcome* • *${prefix}setbotbye*
> ✦ Edita los mensajes de bienvenida y despedida.

𓂃˛ׁ  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}botprofile* • *${prefix}resetbotprofile*
> ✦ Consulta o restablece la configuración del Sub-Bot.`
const image = process.env.JADIBOT_MENU_IMAGE || 'https://files.catbox.moe/rt1yfo.jpeg'
return conn.sendMessage(m.chat, { image: { url: getMenuBanner(profile, 'jadibot', image) }, caption: text }, { quoted: m })
}
handler.help = ['menujadibot']
handler.tags = ['main']
handler.command = ['menujadibot', 'menujadibots', 'jadibotmenu']
export default handler
