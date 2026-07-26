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
const levelBoost = 1 + Math.min(0.40, Math.max(0, level - 15) * 0.008);
const premiumBoost = user.premium ? 1.25 : 1;
const rewardBoost = Math.min(1.5, levelBoost * premiumBoost);
let coin = Math.min(12000, Math.floor(randomInt(3500, 8000) * rewardBoost));
let emerald = Math.floor(randomInt(3, 8) * rewardBoost);
let iron = Math.floor(randomInt(12, 45) * rewardBoost);
let gold = Math.floor(randomInt(10, 35) * rewardBoost);
let coal = Math.floor(randomInt(20, 90) * rewardBoost);
let stone = Math.floor(randomInt(150, 650) * rewardBoost);
let diamonds = Math.floor(randomInt(3, 8) * rewardBoost);
let exp = Math.floor(randomInt(350, 900) * rewardBoost);
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

function randomInt(min,max){
return Math.floor(Math.random()*(max-min+1))+min
}
