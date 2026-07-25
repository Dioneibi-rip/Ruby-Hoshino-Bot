import { applyTalismanIfDead } from '../../library/rpg-talisman.js';

let handler = async (m, { conn }) => {
let user = global.db.getUser(m.sender);
let img = 'https://files.catbox.moe/bj45rp.jpg';
let level = Number(user.level || 0);

if (level < 15) {
await conn.reply(m.chat, '🛡️ Necesitas ser nivel 15 para emprender aventuras épicas.', m);
return false;
}

user.health = Math.min(100, Math.max(0, Number(user.health || 100)));
if (user.health < 80) {
await conn.reply(m.chat, '💔 No tienes suficiente salud para aventurarte. Usa el comando .heal para curarte.', m);
return false;
}
let kingdoms = [
'Reino de Eldoria',
'Reino de Drakonia',
'Reino de Arkenland',
'Reino de Valoria',
'Reino de Mystara',
'Reino de Ferelith',
'Reino de Thaloria',
'Reino de Nimboria',
'Reino de Galadorn',
'Reino de Elenaria'
];
let randomKingdom = pickRandom(kingdoms);
let coin = pickRandom([3000, 4000, 5000, 6000, 7000, 8000]);
let emerald = pickRandom([4, 6, 8, 10, 12]);
let iron = pickRandom([5, 6, 7, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]);
let gold = pickRandom([25, 35, 45, 60, 75]);
let coal = pickRandom([20, 5, 7, 8, 88, 40, 50, 80, 70, 60, 100, 120, 600, 700, 64]);
let stone = pickRandom([200, 500, 700, 800, 900, 4000, 300]);
let diamonds = pickRandom([6, 8, 10, 12, 14]);
let exp = pickRandom([150, 250, 350, 450, 600]);
user.coin = (user.coin || 0) + coin;
user.emerald = (user.emerald || 0) + emerald;
user.iron = (user.iron || 0) + iron;
user.gold = (user.gold || 0) + gold;
user.coal = (user.coal || 0) + coal;
user.stone = (user.stone || 0) + stone;
user.diamond = (user.diamond || 0) + diamonds;
user.exp = (user.exp || 0) + exp;
user.health -= 50;
if (user.health < 0) {
user.health = 0;
}
await applyTalismanIfDead(m, conn, user);
let info = `🛫 Te has aventurado en el *<${randomKingdom}>*\n` +
`🏞️ *Aventura Finalizada* 🏞️\n` +
`💸 *${m.moneda} Ganados:* ${coin}\n` +
`♦️ *Esmeralda:* ${emerald}\n` +
`🔩 *Hierro:* ${iron}\n` +
`🏅 *Oro:* ${gold}\n` +
`🕋 *Carbón:* ${coal}\n` +
`🪨 *Piedra:* ${stone}\n` +
`💎 *Diamantes Ganados:* ${diamonds}\n` +
`✨ *Experiencia Ganada:* ${exp}\n` +
`❤️ *Salud Actual:* ${user.health}`;
await conn.sendFile(m.chat, img, 'yuki.jpg', info, fkontak);
}

handler.help = ['aventura', 'adventure'];
handler.tags = ['rpg'];
handler.command = ['adventure', 'aventura'];
handler.group = true;
handler.register = true;
handler.cooldown = 1500000;

handler.cooldownMessage = (seconds, time, hms) => `${emoji3} Debés esperar. ${hms} antes de aventurarte de nuevo.`;

export default handler;

function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)];
}
