const MAX_BET = 75000
const CASINO_TAX_RATE = 0.08
const WIN_MULTIPLIER = 1 - CASINO_TAX_RATE

let handler = async (m, { conn, text, usedPrefix, command }) => {
let [eleccion, cantidad] = String(text || '').trim().split(' ');

if (!eleccion || !cantidad) {
await m.reply(`${emoji} Por favor, elige *cara* o *cruz* y una cantidad de ${m.moneda} para apostar.\nEjemplo: *${usedPrefix + command} cara 5000*`);
return false;
}

eleccion = eleccion.toLowerCase();
const cantidadText = cantidad;
cantidad = Number.parseInt(cantidadText, 10);

if (!['cara', 'cruz'].includes(eleccion)) {
await m.reply(`${emoji2} Elección no válida. Usa *cara* o *cruz*.\nEjemplo: *${usedPrefix + command} cara 5000*`);
return false;
}

if (!/^\d+$/.test(cantidadText) || !Number.isSafeInteger(cantidad) || cantidad <= 0) {
await m.reply(`${emoji2} Debes ingresar una cantidad válida mayor que cero.\nEjemplo: *${usedPrefix + command} cara 5000*`);
return false;
}

if (cantidad > MAX_BET) {
await m.reply(`${emoji2} La apuesta máxima permitida es *¥${MAX_BET.toLocaleString()} ${m.moneda}*. Baja el monto para proteger la economía.`);
return false;
}

const user = global.db.getUser(m.sender);
if (!user) return false;
const saldo = Number(user.coin || 0);
if (saldo <= 0) {
await m.reply(`${emoji2} ︵‿୨♡୧‿︵ No tienes fondos suficientes para apostar. Debes saldar tu deuda o conseguir ${m.moneda} primero.`);
return false;
}
if (saldo < cantidad) {
await m.reply(`${emoji2} No tienes suficientes ${m.moneda} para apostar. Tienes *¥${saldo.toLocaleString()}* y necesitas *¥${cantidad.toLocaleString()}*.`);
return false;
}
let resultado = Math.random() < 0.5 ? 'cara' : 'cruz';

if (resultado === eleccion) {
let ganancia = Math.floor(cantidad * WIN_MULTIPLIER);
let impuesto = cantidad - ganancia;
let pagoTotal = cantidad + ganancia;
const updated = await global.db.settleUserBet(m.sender, { field: 'coin', bet: cantidad, payout: pagoTotal });
if (!updated) return conn.reply(m.chat, `${emoji2} Tu saldo cambió antes de completar la apuesta. Vuelve a intentarlo.`, m);

return conn.reply(m.chat,
`「✿」La moneda ha caído en *${resultado.toUpperCase()}* y recuperaste *¥${cantidad.toLocaleString()}* + ganaste *¥${ganancia.toLocaleString()} ${m.moneda}* netos.
🏦 Impuesto de casino destruido: *¥${impuesto.toLocaleString()}*. 🍀
> Tu elección fue *${eleccion.toUpperCase()}*
✨ ¡La suerte estuvo de tu lado! ✨`, m);
} else {
let perdida = cantidad;
const updated = await global.db.settleUserBet(m.sender, { field: 'coin', bet: cantidad, payout: 0 });
if (!updated) return conn.reply(m.chat, `${emoji2} Tu saldo cambió antes de completar la apuesta. Vuelve a intentarlo.`, m);

return conn.reply(m.chat,
`🥀 La moneda cayó en *${resultado.toUpperCase()}* y perdiste *¥${perdida.toLocaleString()} ${m.moneda}*...
> Tú habías elegido *${eleccion.toUpperCase()}*
💔 ¡Sigue intentando, no te rindas!`, m);
}
};

handler.help = ['cf <cara|cruz> <cantidad>']
handler.tags = ['economy']
handler.command = ['cf', 'suerte', 'caracruz']
handler.group = true
handler.register = true
handler.cooldown = 30000
handler.cooldownMessage = (seconds, time, hms) => `${emoji2} Debes esperar ${hms} para usar #cf nuevamente.`;

export default handler;