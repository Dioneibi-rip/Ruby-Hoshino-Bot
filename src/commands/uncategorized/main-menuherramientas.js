import { getActiveBotProfile, getMenuBanner } from '../../core/menu-banner.js'

let handler = async (m, { conn, usedPrefix }) => {
const profile = await getActiveBotProfile(conn)
const used = profile.customPrefix || usedPrefix || '#'
const texto = `
🛠️⊹ 𝐌𝐄𝐍𝐔 𝐃𝐄 𝐇𝐄𝐑𝐑𝐀𝐌𝐈𝐄𝐍𝐓𝐀𝐒 ⊹⚙️

⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *${used}calcular • ${used}calcular • ${used}cal*
> ✦ Calcular todo tipo de ecuaciones.
⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *${used}horario*
> ✦ Ver el horario global de los países.
⢷ ꉹᩙ  ִ ▒🎡ᩬ᷒ᰰ⃞  ˄᪲ *${used}fake • ${used}fakereply*
> ✦ Crea un mensaje falso de un usuario.
⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *${used}enhance • ${used}remini • ${used}hd*
> ✦ Mejora la calidad de una imagen.
⢷ ꉹᩙ  ִ ▒🎡ᩬ᷒ᰰ⃞  ˄᪲ *${used}letra*
> ✦ Cambia la fuente de las letras.
⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *${used}read • ${used}readviewonce • ${used}ver*
> ✦ Ver imágenes de una sola vista.
⢷ ꉹᩙ  ִ ▒🎡ᩬ᷒ᰰ⃞  ˄᪲ *${used}whatmusic • ${used}shazam*
> ✦ Descubre el nombre de canciones o vídeos.
⢷ ꉹᩙ  ִ ▒🎡ᩬ᷒ᰰ⃞  ˄᪲ *${used}ss • ${used}ssweb*
> ✦ Ver el estado de una página web.
⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *${used}length • ${used}tamaño*
> ✦ Cambia el tamaño de imágenes y vídeos.
⢷ ꉹᩙ  ִ ▒🎡ᩬ᷒ᰰ⃞  ˄᪲ *${used}say • ${used}decir* + [texto]
> ✦ Repetir un mensaje.
⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *${used}todoc • ${used}toducument*
> ✦ Crea documentos de (audio, imágenes y vídeos).
⢷ ꉹᩙ  ִ ▒🎡ᩬ᷒ᰰ⃞  ˄᪲ *${used}wiki • ${used}wikipedia*
> ✦ Consulta información en Wikipedia.
⢷ ꉹᩙ  ִ ▒🎠ᩬ᷒ᰰ⃞  ˄᪲ *${used}logocorazon • ${used}logopareja • ${used}logogaming*
> ✦ Crea logos con texto usando los generadores disponibles.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅,
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: getMenuBanner(profile, 'herramientas', 'https://files.catbox.moe/wel1hf.jpeg') },
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
{ quoted: fkontak }
);
};

handler.command = ['menuherramientas', 'herramientasmenu'];
export default handler;
