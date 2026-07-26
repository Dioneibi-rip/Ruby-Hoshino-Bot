const handler = async (m, { conn }) => {
const user = global.db.getUser(m.sender);
if (!user) return;

user.health = Math.min(100, Math.max(0, Number(user.health || 100)));
user.pickaxedurability = Math.min(100, Math.max(0, Number(user.pickaxedurability || 100)));

if (user.health < 20) {
await conn.reply(m.chat, '💔 Estás muy débil para trabajar en la mina. Necesitas curarte antes de volver a minar.', m);
return false;
}

if (user.pickaxedurability <= 0) {
await conn.reply(m.chat, '⛏️ Tu pico está roto. Compra o repara uno en la tienda con *tienda comprar pico*.', m);
return false;
}

const levelBoost = 1 + Math.min(0.35, Math.max(0, Number(user.level || 0)) * 0.01);
const bonus = Math.min(1.5, (user.premium ? 1.25 : 1) * levelBoost);
const esEventoPositivo = Math.random() < (user.premium ? 0.82 : 0.78);
const evento = esEventoPositivo ? pickRandom(eventosBuenos) : pickRandom(eventosMalos);
const cambios = evento.cambios(bonus);

user.coin = (Number(user.coin) || 0) + cambios.coin;
user.iron = Math.max(0, (user.iron || 0) + cambios.iron);
user.gold = Math.max(0, (user.gold || 0) + cambios.gold);
user.emerald = Math.max(0, (user.emerald || 0) + cambios.emerald);
user.coal = Math.max(0, (user.coal || 0) + cambios.coal);
user.stone = Math.max(0, (user.stone || 0) + cambios.stone);
user.exp = (user.exp || 0) + cambios.exp;
user.health = Math.max(0, Number(user.health || 0) - 10);
user.pickaxedurability = Math.min(100, Math.max(0, Number(user.pickaxedurability || 0) - 8));

const resultado =
`⛏️ *${evento.texto}*\n\n` +
`✨ Exp: ${formato(cambios.exp)}\n` +
`💸 ${m.moneda}: ${formato(cambios.coin)}\n` +
`♦️ Esmeralda: ${formato(cambios.emerald)}\n` +
`🔩 Hierro: ${formato(cambios.iron)}\n` +
`🏅 Oro: ${formato(cambios.gold)}\n` +
`🕋 Carbón: ${formato(cambios.coal)}\n` +
`🪨 Piedra: ${formato(cambios.stone)}\n` +
`👑 Multiplicador premium: x${bonus}`;

await conn.sendFile(m.chat, 'https://files.catbox.moe/qfx5pn.jpg', 'minado.jpg', resultado, m);
await m.react('⛏️');
};

handler.help = ['minar'];
handler.tags = ['economy'];
handler.command = ['minar', 'miming', 'mine'];
handler.register = true;
handler.group = true;
handler.cooldown = 600000;

handler.cooldownMessage = (seconds, time, hms) => `⛏️ Aún te recuperas del último minado.
⏳ Espera *${hms}*.`;

export default handler;

const eventosBuenos = [
{ texto: '✨ Encontraste una veta de minerales.', cambios: (b) => ({ exp: n(600, 1200, b), coin: n(7000, 13000, b), emerald: n(4, 8, b), iron: n(35, 80, b), gold: n(20, 40, b), coal: n(35, 80, b), stone: n(250, 550, b) }) },
{ texto: '💰 Hallaste un cofre enterrado.', cambios: (b) => ({ exp: n(900, 1500, b), coin: n(9000, 15000, b), emerald: n(6, 10, b), iron: n(45, 100, b), gold: n(25, 50, b), coal: n(40, 90, b), stone: n(300, 600, b) }) },
{ texto: '💎 Cueva antigua descubierta.', cambios: (b) => ({ exp: n(1200, 2200, b), coin: n(12000, 18000, b), emerald: n(8, 14, b), iron: n(55, 110, b), gold: n(30, 60, b), coal: n(45, 100, b), stone: n(350, 700, b) }) },
];

const eventosMalos = [
{ texto: '💥 Pequeño derrumbe en la mina.', cambios: () => ({ exp: r(75, 160), coin: -r(300, 800), emerald: -r(0, 2), iron: -r(2, 8), gold: -r(1, 4), coal: -r(3, 10), stone: -r(20, 60) }) },
{ texto: '🥵 Te perdiste buscando la salida.', cambios: () => ({ exp: r(60, 130), coin: -r(250, 700), emerald: 0, iron: r(0, 4), gold: 0, coal: r(2, 8), stone: r(15, 50) }) },
];

function r(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}

function n(min, max, bonus) {
return Math.floor(r(min, max) * bonus * 0.165);
}

function formato(num) {
return num >= 0 ? `+${num}` : `-${Math.abs(num)}`;
}

function pickRandom(arr) {
return arr[Math.floor(Math.random() * arr.length)];
}
