
const handler = async (m, { conn, text, command, usedPrefix }) => {
const user = global.db.getUser(m.sender);

if (!text) {
await conn.reply(m.chat, `《✧》Uso correcto:
*${usedPrefix + command} <cantidad> <red|black|green>*
Ejemplo: *${usedPrefix + command} 1500 red*`, m);
return false;
}

const args = text.trim().split(/\s+/);
if (args.length !== 2) {
await conn.reply(m.chat, `《✧》Debes indicar cantidad y color.
Ejemplo: *${usedPrefix + command} 1500 red*`, m);
return false;
}

const bet = Number(args[0]);
const color = args[1].toLowerCase();

if (!Number.isInteger(bet) || bet < 200) {
await conn.reply(m.chat, `《✧》La apuesta mínima es *200 ${m.moneda}*.`, m);
return false;
}

if (!['red', 'black', 'green'].includes(color)) {
await conn.reply(m.chat, `《✧》Color inválido. Usa *red*, *black* o *green*.`, m);
return false;
}

const maxByTier = user.premium ? 150000 : 50000;
const maxByBalance = Math.max(200, Math.floor((user.coin || 0) * 0.25));
const maxBet = Math.min(maxByTier, maxByBalance);

if (bet > maxBet) {
await conn.reply(m.chat, `《✧》Tu apuesta máxima ahora es *${maxBet.toLocaleString()} ${m.moneda}* para mantener la economía estable.`, m);
return false;
}

if (bet > user.coin) {
await conn.reply(m.chat, `《✧》No tienes suficientes *${m.moneda}* para apostar eso.`, m);
return false;
}

user.coin -= bet;


await conn.reply(m.chat, `🎲 Apuesta registrada: *¥${bet.toLocaleString()} ${m.moneda}* al color *${color}*.
⏳ Resolviendo ruleta en 5 segundos...`, m);

setTimeout(() => {
const resultado = rollRoulette();
const multipliers = { red: 2, black: 2, green: 14 };
const gano = resultado === color;

if (gano) {
const premio = Math.floor(bet * multipliers[color]);
user.coin += premio;
return conn.reply(m.chat, `「✿」Resultado: *${resultado}* 🟢
Ganaste *¥${premio.toLocaleString()} ${m.moneda}* (incluye apuesta).`, m);
}

return conn.reply(m.chat, `「✿」Resultado: *${resultado}* 🔴
Perdiste *¥${bet.toLocaleString()} ${m.moneda}*.
Sigue jugando con control 🧠`, m);
}, 5000);
};

handler.tags = ['economy'];
handler.help = ['ruleta <cantidad> <red|black|green>'];
handler.command = ['ruleta', 'roulette', 'rt'];
handler.register = true;
handler.group = true
handler.cooldown = 30000;

export default handler;

function rollRoulette() {
const n = Math.random();
if (n < 0.48) return 'red';
if (n < 0.96) return 'black';
return 'green';
}
