import { getActiveBotProfile, getMenuBanner } from '../../core/menu-banner.js'

let handler = async (m, { conn, usedPrefix }) => {
const profile = await getActiveBotProfile(conn)
const used = profile.customPrefix || usedPrefix || '#'
const texto = `
🎮✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐣𝐮𝐞𝐠𝐨𝐬 𝐩𝐚𝐫𝐚 𝐣𝐮𝐠𝐚𝐫 𝐜𝐨𝐧 𝐭𝐮𝐬 𝐚𝐦𝐢𝐠𝐨𝐬 🕹️🎲⊹

ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}amistad • ${used}amigorandom*
> ✦ Hacer amigos con un juego.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}chiste*
> ✦ La bot te cuenta un chiste.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}consejo*
> ✦ La bot te da un consejo.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}doxeo • ${used}doxear* + <mención>
> ✦ Simular un doxeo falso.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}facto*
> ✦ La bot te lanza un facto.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}formarpareja*
> ✦ Forma una pareja.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}formarpareja5*
> ✦ Forma 5 parejas diferentes.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}frase*
> ✦ La bot te da una frase.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}chupalo* + <mención>
> ✦ Hacer que un usuario te la chupe.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}aplauso* + <mención>
> ✦ Aplaudirle a alguien.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}marron* + <mención>
> ✦ Burlarte del color de piel de un usuario.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}suicidar*
> ✦ Suicídate.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}iq • ${used}iqtest* + <mención>
> ✦ Calcular el IQ de alguna persona.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}meme*
> ✦ La bot te envía un meme aleatorio.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}morse*
> ✦ Convierte un texto a código morse.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}nombreninja*
> ✦ Busca un nombre ninja aleatorio.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}paja • ${used}pajeame*
> ✦ La bot te hace una paja.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}personalidad* + <mención>
> ✦ La bot busca tu personalidad.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}piropo*
> ✦ Lanza un piropo.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}pregunta*
> ✦ Hazle una pregunta a la bot.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}ship • ${used}pareja*
> ✦ La bot te da la probabilidad de enamorarte de una persona.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}sorteo*
> ✦ Empieza un sorteo.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}top*
> ✦ Empieza un top de personas.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}ahorcado*
> ✦ Diviértete jugando al ahorcado con la bot.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}genio*
> ✦ Comienza una ronda de preguntas con el genio.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}mates • ${used}matematicas*
> ✦ Responde preguntas de matemáticas para ganar recompensas.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}ppt*
> ✦ Juega piedra, papel o tijeras con la bot.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}sopa • ${used}buscarpalabra*
> ✦ Juega al famoso juego de sopa de letras.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}pvp • ${used}suit* + <mención>
> ✦ Juega un PVP contra otro usuario.
ᰵ𐇽𑂘⃘ׂ◌࠭᷼🪷⃝⃦̸̷᪶᪶ᩘ★ *${used}ttt*
> ✦ Crea una sala de juego.
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅,
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: getMenuBanner(profile, 'juegos', 'https://files.catbox.moe/pmyirp.jpeg') },
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

handler.command = ['menujuegos', 'juegosmenu'];
export default handler;
