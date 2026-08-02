import { getActiveBotProfile, getMenuBanner } from '../../core/menu-banner.js'

let handler = async (m, { conn, usedPrefix }) => {
const profile = await getActiveBotProfile(conn)
const used = profile.customPrefix || usedPrefix || '#'
const texto = `

✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐠𝐚𝐜𝐡𝐚 𝐩𝐚𝐫𝐚 𝐫𝐞𝐜𝐥𝐚𝐦𝐚𝐫 𝐲 𝐜𝐨𝐥𝐞𝐜𝐜𝐢𝐨𝐧𝐚𝐫 𝐩𝐞𝐫𝐬𝐨𝐧𝐚𝐣𝐞𝐬 🎭🌟⊹

̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}rollwaifu • ${used}rw • ${used}roll*
> ✦ Waifu o husbando aleatorio.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}claim • ${used}c • ${used}reclamar*
> ✦ Reclamar un personaje.
🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}delclaimmsg*
> ✦ Restablecer el mensaje al reclamar un personaje.
🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}setclaim • ${used}setclaimmsg*
> ✦ Modificar el mensaje al reclamar un personaje
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}buycharacter • ${used}buychar • ${used}comprarwaifu*
> ✦ Comprar un personaje en venta.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}harem • ${used}waifus • ${used}claims*
> ✦ Ver tus personajes reclamados.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}removerwaifu • ${used}removesale*
> ✦ Eliminar un personaje en venta.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}sell • ${used}vender + [nombre] [precio]*
> ✦ Poner un personaje a la venta.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}charimage • ${used}waifuimage • ${used}wimage*
> ✦ Ver una imagen aleatoria de un personaje.
🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}serieinfo • ${used}ainfo _[nombre]_*
> Ver todos los personajes de una serie.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}charinfo • ${used}winfo • ${used}waifuinfo*
> ✦ Ver información de un personaje.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}favoritetop • ${used}favtop*
> ✦ Ver el top de personajes favoritos del sistema.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}giveallharem • ${used}regalarharem*
> ✦ Regalar todos tus personajes a otro usuario.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}infogacha • ${used}ginfo • ${used}gachainfo*
> ✦ Ver tu información personal del gacha.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}givechar • ${used}givewaifu • ${used}regalar*
> ✦ Regalar un personaje a otro usuario.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}trade • ${used}intercambiar • ${used}intercambio*
> ✦ Intercambiar personajes de forma segura entre usuarios.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}robwaifu • ${used}stealwaifu • ${used}robarwaifu*
> ✦ Intenta robar un personaje del harem de otro usuario.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}comprarproteccion • ${used}buyprotection • ${used}proteger*
> ✦ Compra protección para tus personajes del harem.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}renovarproteccion • ${used}renewprotection • ${used}extenderproteccion*
> ✦ Renueva la protección activa de tus personajes.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}setfav • ${used}setfavorito*
> ✦ Poner de favorito a un personaje.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}vote • ${used}votar*
> ✦ Votar por un personaje para subir su valor.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}waifusboard • ${used}waifustop • ${used}topwaifus*
> ✦ Ver el top de personajes con mayor valor.
🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *${used}delwaifu • ${used}deletewaifu • ${used}delchar*
> ✦ Eliminar un personaje reclamado.
ੈ₊˚༅༴╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈੈ₊˚
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: getMenuBanner(profile, 'gacha', 'https://files.catbox.moe/jau272.jpeg') },
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

handler.command = ['menugacha'];
export default handler;
