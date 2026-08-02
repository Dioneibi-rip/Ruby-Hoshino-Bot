import { getActiveBotProfile, getMenuBanner } from '../../core/menu-banner.js'

let handler = async (m, { conn, usedPrefix }) => {
const profile = await getActiveBotProfile(conn)
const used = profile.customPrefix || usedPrefix || '#'

const texto = `
💰🎮⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐞𝐜𝐨𝐧𝐨𝐦𝐢́𝐚 𝐲 𝐑𝐏𝐆 𝐩𝐚𝐫𝐚 𝐠𝐚𝐧𝐚𝐫 𝐝𝐢𝐧𝐞𝐫𝐨 𝐲 𝐨𝐭𝐫𝐨𝐬 𝐫𝐞𝐜𝐮𝐫𝐬𝐨𝐬 🏆💎⊹

ൃ⵿꤬ᩚ̸̷͠ᩘ🍒̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}w • ${used}work • ${used}trabajar*
> ✦ Trabaja para ganar ${m.moneda}.
ൃ⵿꤬ᩚ̸̷͠ᩘ🧰̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}trabajo • ${used}job • ${used}empleo*
> ✦ Elige o gestiona tu empleo (afecta work/crime/slut).
ൃ⵿꤬ᩚ̸̷͠ᩘ🎀̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}slut • ${used}prostituirse*
> ✦ Trabaja como prostituta y gana ${m.moneda}.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍨̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}cf • ${used}suerte*
> ✦ Apuesta tus ${m.moneda} a cara o cruz.
ൃ⵿꤬ᩚ̸̷͠ᩘ🌸̷̸ᩚ⃨⢾ ֺ ֢ ᮫ ⵿ ─ *${used}crime • ${used}crimen*
> ✦ Trabaja como ladrón para ganar ${m.moneda}.
ൃ⵿꤬ᩚ̸̷͠ᩘ🪷̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}ruleta • ${used}roulette • ${used}rt*
> ✦ Apuesta ${m.moneda} al color rojo o negro.
ൃ⵿꤬ᩚ̸̷͠ᩘ🥡̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}casino • ${used}apostar*
> ✦ Apuesta tus ${m.moneda} en el casino.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍒̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}slot*
> ✦ Apuesta tus ${m.moneda} en la ruleta y prueba tu suerte.
ൃ⵿꤬ᩚ̸̷͠ᩘ🎀̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}cartera • ${used}wallet*
> ✦ Ver tus ${m.moneda} en la cartera.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍨̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}bal • ${used}balance • ${used}bank*
> ✦ Ver tus ${m.moneda} en el banco.
ൃ⵿꤬ᩚ̸̷͠ᩘ🌸̷̸ᩚ⃨⢾ ֺ ֢ ᮫ ⵿ ─ *${used}deposit • ${used}depositar • ${used}d*
> ✦ Deposita tus ${m.moneda} al banco.
ൃ⵿꤬ᩚ̸̷͠ᩘ🪷̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}with • ${used}retirar • ${used}withdraw*
> ✦ Retira tus ${m.moneda} del banco.
ൃ⵿꤬ᩚ̸̷͠ᩘ🥡̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}transfer • ${used}pay*
> ✦ Transfiere ${m.moneda} o XP a otros usuarios.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍒̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}miming • ${used}minar • ${used}mine*
> ✦ Trabaja como minero y recolecta recursos.
ൃ⵿꤬ᩚ̸̷͠ᩘ🛍️̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}tienda • ${used}shop • ${used}store*
> ✦ Compra y vende ítems de economía y RPG.
ൃ⵿꤬ᩚ̸̷͠ᩘ🛠️̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}craftear • ${used}craft*
> ✦ Convierte materiales en antorchas y anillos.
ൃ⵿꤬ᩚ̸̷͠ᩘ🎀̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}buyall • ${used}buy*
> ✦ Compra ${m.moneda} con tu XP.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍨̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}daily • ${used}diario*
> ✦ Reclama tu recompensa diaria.
ൃ⵿꤬ᩚ̸̷͠ᩘ🌸̷̸ᩚ⃨⢾ ֺ ֢ ᮫ ⵿ ─  *${used}cofre*
> ✦ Reclama un cofre diario lleno de recursos.
ൃ⵿꤬ᩚ̸̷͠ᩘ🪷̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}weekly • ${used}semanal*
> ✦ Reclama tu regalo semanal.
ൃ⵿꤬ᩚ̸̷͠ᩘ🪙̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}interes • ${used}bankinterest*
> ✦ Cobra intereses diarios por ahorrar en el banco.
ൃ⵿꤬ᩚ̸̷͠ᩘ👑̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}premiumbonus • ${used}bonopremium*
> ✦ Bonus exclusivo para usuarios premium cada 8h.
ൃ⵿꤬ᩚ̸̷͠ᩘ🥡̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}monthly • ${used}mensual*
> ✦ Reclama tu recompensa mensual.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍒̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}steal • ${used}robar • ${used}rob*
> ✦ Intenta robarle ${m.moneda} a alguien.
ൃ⵿꤬ᩚ̸̷͠ᩘ🚔̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}fianza • ${used}bail*
> ✦ Paga tu fianza desde el banco para salir de la cárcel.
ൃ⵿꤬ᩚ̸̷͠ᩘ🎀̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}robarxp • ${used}robxp*
> ✦ Intenta robar XP a un usuario.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍨̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}eboard • ${used}baltop*
> ✦ Ver el ranking de usuarios con más ${m.moneda}.
ൃ⵿꤬ᩚ̸̷͠ᩘ🌸̷̸ᩚ⃨⢾ ֺ ֢ ᮫ ⵿ ─ *${used}aventura • ${used}adventure*
> ✦ Aventúrate en un nuevo reino y recolecta recursos.
ൃ⵿꤬ᩚ̸̷͠ᩘ🪷̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}curar • ${used}heal*
> ✦ Cura tu salud para volverte aventurero.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍒̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}inv • ${used}inventario*
> ✦ Ver tu inventario con todos tus ítems.
ൃ⵿꤬ᩚ̸̷͠ᩘ🎀̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}mazmorra • ${used}explorar • ${used}dungeon*
> ✦ Explorar mazmorras para ganar ${m.moneda}.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍨̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *${used}halloween*
> ✦ Reclama tu dulce o truco (Solo en Halloween).
ൃ⵿꤬ᩚ̸̷͠ᩘ🌸̷̸ᩚ⃨⢾ ֺ ֢ ᮫ ⵿ ─ *${used}christmas • ${used}navidad*
> ✦ Reclama tu regalo navideño (Solo en Navidad).
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅,
`.trim();

await conn.sendMessage(
m.chat,
{
image: { url: getMenuBanner(profile, 'economia', 'https://files.catbox.moe/bi19e7.png') },
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

handler.command = ['menueconomia', 'rpgmenu', 'menurpg'];
export default handler;
