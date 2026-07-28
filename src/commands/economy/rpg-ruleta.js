const handler = async (m, { conn, text, command, usedPrefix }) => {
const user = global.db.getUser(m.sender);
if ((Number(user?.coin) || 0) <= 0) {
await conn.reply(m.chat, `《✧》No tienes fondos suficientes para apostar. Debes saldar tu deuda o conseguir ${m.moneda} primero.`, m);
return false;
}

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

const bet = Number.parseInt(args[0], 10);
const color = args[1].toLowerCase();

if (!/^\d+$/.test(args[0]) || !Number.isSafeInteger(bet) || bet < 200) {
await conn.reply(m.chat, `《✧》La apuesta mínima es *200 ${m.moneda}*.`, m);
return false;
}

if (!['red', 'black', 'green'].includes(color)) {
await conn.reply(m.chat, `《✧》Color inválido. Usa *red*, *black* o *green*.`, m);
return false;
}

const maxByTier = user.premium ? 75000 : 50000;
if (bet > maxByTier) {
await conn.reply(m.chat, `《✧》Tu apuesta máxima por tirada es *${maxByTier.toLocaleString()} ${m.moneda}*.`, m);
return false;
}

if ((Number(user.coin) || 0) < bet) {
await conn.reply(m.chat, `《✧》No tienes suficientes ${m.moneda} para apostar.`, m);
return false;
}

const resultado = rollRoulette();
const multipliers = { red: 2, black: 2, green: 14 };
const gano = resultado === color;
const grossPrize = gano ? Math.floor(bet * multipliers[color]) : 0;
const casinoTax = gano ? Math.floor(Math.max(0, grossPrize - bet) * 0.08) : 0;
const premio = Math.max(0, grossPrize - casinoTax);
const updated = await global.db.settleUserBet(m.sender, { field: 'coin', bet, payout: premio });
if (!updated) {
await conn.reply(m.chat, `《✧》Tu saldo cambió antes de completar la apuesta. Vuelve a intentarlo.`, m);
return false;
}

await conn.reply(m.chat, `🎲 Apuesta registrada: *¥${bet.toLocaleString()} ${m.moneda}* al color *${color}*.
⏳ Resolviendo ruleta...`, m);

if (gano) {
return conn.reply(m.chat, `「✿」Resultado: *${resultado}* 🟢
Ganaste *¥${premio.toLocaleString()} ${m.moneda}* (incluye apuesta).
🏦 Impuesto de casino destruido: *¥${casinoTax.toLocaleString()}*.`, m);
}

return conn.reply(m.chat, `「✿」Resultado: *${resultado}* 🔴
Perdiste *¥${bet.toLocaleString()} ${m.moneda}*.
Saldo actual: *¥${(Number(updated.coin) || 0).toLocaleString()} ${m.moneda}*`, m);
};

handler.tags = ['economy'];
handler.help = ['ruleta <cantidad> <red|black|green>'];
handler.command = ['ruleta', 'roulette', 'rt'];
handler.register = true;
handler.group = true;
handler.cooldown = 30000;

handler.cooldownMessage = (seconds, time, hms) => `⏱ Espera *${hms}* para volver a apostar.`;

export default handler;

function rollRoulette() {
const n = Math.random();
if (n < 0.48) return 'red';
if (n < 0.96) return 'black';
return 'green';
}