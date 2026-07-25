const MAX_BET = 150000
const WIN_MULTIPLIER = 0.8

let handler = async (m, { conn, text, usedPrefix, command }) => {
let [eleccion, cantidad] = String(text || '').trim().split(' ');

if (!eleccion || !cantidad) {
await m.reply(`${emoji} Por favor, elige *cara* o *cruz* y una cantidad de ${m.moneda} para apostar.\nEjemplo: *${usedPrefix + command} cara 5000*`);
return false;
}

eleccion = eleccion.toLowerCase();
cantidad = parseInt(cantidad);

if (!['cara', 'cruz'].includes(eleccion)) {
await m.reply(`${emoji2} Elección no válida. Usa *cara* o *cruz*.\nEjemplo: *${usedPrefix + command} cara 5000*`);
return false;
}

if (isNaN(cantidad) || cantidad <= 0) {
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
if (saldo < cantidad) {
await m.reply(`${emoji2} No tienes suficientes ${m.moneda} para apostar. Tienes *¥${saldo.toLocaleString()}* y necesitas *¥${cantidad.toLocaleString()}*.`);
return false;
}
user.coin = saldo - cantidad;
let resultado = Math.random() < 0.5 ? 'cara' : 'cruz';

if (resultado === eleccion) {
let ganancia = Math.floor(cantidad * WIN_MULTIPLIER);
let pagoTotal = cantidad + ganancia;
user.coin += pagoTotal;

return conn.reply(m.chat,
`「✿」La moneda ha caído en *${resultado.toUpperCase()}* y recuperaste *¥${cantidad.toLocaleString()}* + ganaste *¥${ganancia.toLocaleString()} ${m.moneda}* netos. 🍀
> Tu elección fue *${eleccion.toUpperCase()}*
✨ ¡La suerte estuvo de tu lado! ✨`, m);
} else {
let perdida = cantidad;

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
