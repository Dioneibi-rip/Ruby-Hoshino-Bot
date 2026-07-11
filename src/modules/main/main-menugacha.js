
let handler = async (m, { conn }) => {
const texto = `

✨⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐠𝐚𝐜𝐡𝐚 𝐩𝐚𝐫𝐚 𝐫𝐞𝐜𝐥𝐚𝐦𝐚𝐫 𝐲 𝐜𝐨𝐥𝐞𝐜𝐜𝐢𝐨𝐧𝐚𝐫 𝐩𝐞𝐫𝐬𝐨𝐧𝐚𝐣𝐞𝐬 🎭🌟⊹

̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#rollwaifu • #rw • #roll*
> ✦ Waifu o husbando aleatorio.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#claim • #c • #reclamar*
> ✦ Reclamar un personaje.
🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#delclaimmsg*
> ✦ Restablecer el mensaje al reclamar un personaje.
🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#setclaim • #setclaimmsg*
> ✦ Modificar el mensaje al reclamar un personaje
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#buycharacter • #buychar • #comprarwaifu*
> ✦ Comprar un personaje en venta.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#harem • #waifus • #claims*
> ✦ Ver tus personajes reclamados.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#removerwaifu • #removesale*
> ✦ Eliminar un personaje en venta.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#sell • #vender + [nombre] [precio]*
> ✦ Poner un personaje a la venta.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#charimage • #waifuimage • #wimage*
> ✦ Ver una imagen aleatoria de un personaje.
🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#serieinfo • #ainfo _[nombre]_*
> Ver todos los personajes de una serie.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#charinfo • #winfo • #waifuinfo*
> ✦ Ver información de un personaje.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#favoritetop • #favtop*
> ✦ Ver el top de personajes favoritos del sistema.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#giveallharem • #regalarharem*
> ✦ Regalar todos tus personajes a otro usuario.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#infogacha • #ginfo • #gachainfo*
> ✦ Ver tu información personal del gacha.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#givechar • #givewaifu • #regalar*
> ✦ Regalar un personaje a otro usuario.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#trade • #intercambiar • #intercambio*
> ✦ Intercambiar personajes de forma segura entre usuarios.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#robwaifu • #stealwaifu • #robarwaifu*
> ✦ Intenta robar un personaje del harem de otro usuario.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#comprarproteccion • #buyprotection • #proteger*
> ✦ Compra protección para tus personajes del harem.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#renovarproteccion • #renewprotection • #extenderproteccion*
> ✦ Renueva la protección activa de tus personajes.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#setfav • #setfavorito*
> ✦ Poner de favorito a un personaje.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#vote • #votar*
> ✦ Votar por un personaje para subir su valor.
̟ׄ🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#waifusboard • #waifustop • #topwaifus*
> ✦ Ver el top de personajes con mayor valor.
🐟▒⃝᪶ᩙ᷼͠꜇ָ—— *#delwaifu • #deletewaifu • #delchar*
> ✦ Eliminar un personaje reclamado.
ੈ₊˚༅༴╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈੈ₊˚
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: 'https://files.catbox.moe/jau272.jpeg' },
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
