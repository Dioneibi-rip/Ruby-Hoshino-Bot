let handler = async (m, { conn, usedPrefix }) => {
const profile = conn.botProfile || {}
const used = profile.customPrefix || usedPrefix || '#'
const prefix = used
const botName = profile.botName || 'Ruby Hoshino'
const text = `🤖⊹ 𝐌𝐄𝐍𝐔 𝐉𝐀𝐃𝐈𝐁𝐎𝐓 / 𝐒𝐔𝐁-𝐁𝐎𝐓𝐒 ⊹✨

𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}qr*
> ✦ Crea una sesión de Sub-Bot escaneando código QR.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}code*
> ✦ Crea una sesión de Sub-Bot usando código de vinculación.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}bots • ${prefix}sockets • ${prefix}socket*
> ✦ Muestra los Sub-Bots conectados actualmente.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}deletesesion • ${prefix}deletebot • ${prefix}deletesession*
> ✦ Elimina tu sesión activa de Sub-Bot desde el bot principal.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}stop • ${prefix}pausarai • ${prefix}pausarbot*
> ✦ Pausa el Sub-Bot conectado sin apagar el bot principal.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setprimary • ${prefix}botprimario • ${prefix}setbot* + <@bot>
> ✦ Define qué Sub-Bot atiende comandos en el grupo.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}resetbot*
> ✦ Restablece la ruta de bots y habilita todos los Sub-Bots del grupo.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setmoneda*
> ✦ cambia el nombre de la moneda del bot.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}banchat*
> ✦ Banear al Bot en un chat o grupo.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}unbanchat*
> ✦ Desbanear al Bot del chat o grupo.

𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setbotname • ${prefix}setbotprefix*
> ✦ Edita nombre y prefijo del Sub-Bot.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setpairingprefix • ${prefix}setpairingimage*
> ✦ Edita el Pairing Code personalizado.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setbotmenu • ${prefix}setmenubanner*
> ✦ Edita MenuAll y banners individuales.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}setbotwelcome • ${prefix}setbotbye*
> ✦ Edita bienvenida y despedida.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *${prefix}botprofile • ${prefix}resetbotprofile*
> ✦ Consulta o restablece el perfil nativo de ${botName}.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅`
const image = process.env.JADIBOT_MENU_IMAGE || 'https://files.catbox.moe/rt1yfo.jpeg'
return conn.sendMessage(m.chat, { image: { url: profile.individualMenuImageUrl || image }, caption: text }, { quoted: m })
}
handler.help = ['menujadibot']
handler.tags = ['main']
handler.command = ['menujadibot', 'menujadibots', 'jadibotmenu']
export default handler
