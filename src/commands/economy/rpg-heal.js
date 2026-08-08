import { readUnifiedUser } from '../../core/economy-identity.js'

let handler = async (m, { conn }) => {
// Se lee sobre la identidad canonica y con los saldos ya unificados: cobrar sobre la
// fila `@lid` mientras el dinero vivia en la fila del telefono dejaba al usuario en
// negativo o le impedia curarse teniendo saldo.
const { user, coin } = readUnifiedUser(m.sender);

const costoCura = 8000;
const cura = 75;

if (coin < costoCura) {
return conn.reply(m.chat, `💔 No tienes suficientes *${m.moneda}* para curarte.\nNecesitas al menos *¥${costoCura.toLocaleString()} ${m.moneda}*.`, m);
}

const health = Math.min(100, (Number(user.health) || 0) + cura);
user.health = health;
user.coin = coin - costoCura;

user.lastHeal = new Date();

const mensaje = `
╭───────❍
│🌸 *¡Curación exitosa!*
│❤️ *+${cura}* puntos de vida restaurados
│💸 *Costo:* ¥${costoCura.toLocaleString()} ${m.moneda}
╰──────────❍

🏷️ *Estado actual*
› ❤️ Vida: *${health}/100*
› 💰 Monedas: *¥${(coin - costoCura).toLocaleString()} ${m.moneda}*
`;

await conn.sendMessage(m.chat, { text: mensaje.trim() }, { quoted: m });
};

handler.help = ['heal'];
handler.tags = ['rpg'];
handler.command = ['heal', 'curar'];
handler.group = true;
handler.register = true;

export default handler;
