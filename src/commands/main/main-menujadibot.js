let handler = async (m, { conn }) => {
const texto = `
🤖⊹ 𝐌𝐄𝐍𝐔 𝐉𝐀𝐃𝐈𝐁𝐎𝐓 / 𝐒𝐔𝐁-𝐁𝐎𝐓𝐒 ⊹✨

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
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: 'https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/855ccb61ddb6e8a6265750cb601ca07b.jpg' },
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

handler.command = ['menujadibot', 'menujadi', 'jadibotmenu', 'subbotsmenu'];
export default handler;
