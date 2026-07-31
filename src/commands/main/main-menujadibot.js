let handler = async (m, { conn }) => {
const text = `🤖⊹ 𝐌𝐄𝐍𝐔 𝐉𝐀𝐃𝐈𝐁𝐎𝐓 / 𝐒𝐔𝐁-𝐁𝐎𝐓𝐒 ⊹✨

𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *#qr*
> ✦ Crea una sesión de Sub-Bot escaneando código QR.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *#code*
> ✦ Crea una sesión de Sub-Bot usando código de vinculación.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *#bots • #sockets • #socket*
> ✦ Muestra los Sub-Bots conectados actualmente.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *#deletesesion • #deletebot • #deletesession*
> ✦ Elimina tu sesión activa de Sub-Bot desde el bot principal.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *#stop • #pausarai • #pausarbot*
> ✦ Pausa el Sub-Bot conectado sin apagar el bot principal.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *#setprimary • #botprimario • #setbot* + <@bot>
> ✦ Define qué Sub-Bot atiende comandos en el grupo.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *#resetbot*
> ✦ Restablece la ruta de bots y habilita todos los Sub-Bots del grupo.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *#setmoneda*
> ✦ cambia el nombre de la moneda del bot.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *#banchat*
> ✦ Banear al Bot en un chat o grupo.
𓂃˛ׁ⁠  ✿𝆬ᩙ⃞𓈒࣭🤖 *#unbanchat*
> ✦ Desbanear al Bot del chat o grupo.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅`
const image = process.env.JADIBOT_MENU_IMAGE || 'https://files.catbox.moe/rt1yfo.jpeg'
return conn.sendMessage(m.chat, { image: { url: image }, caption: text }, { quoted: m })
}
handler.help = ['menujadibot']
handler.tags = ['main']
handler.command = ['menujadibot', 'menujadibots', 'jadibotmenu']
export default handler
