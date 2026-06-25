const handler = async (m, { conn }) => {
const user = global.db.getUser(m.sender);
const bank = Math.max(0, Number(user.bank) || 0);

if (bank < 5000) {
await conn.reply(m.chat, `🏦 Necesitas al menos *5,000 ${m.moneda}* en el banco para cobrar interés.`, m);
return false;
}

const rate = user.premium ? 0.0285 : 0.028;
const cap = user.premium ? 55000 : 110000;
const interest = Math.min(cap, Math.max(600, Math.floor(bank * rate)));

user.coin = (user.coin || 0) + interest;

return conn.reply(
m.chat,
`🏦 *Interés bancario acreditado*\n` +
`Saldo en banco: *${bank.toLocaleString()} ${m.moneda}*\n` +
`Tasa aplicada: *${(rate * 100).toFixed(1)}%*\n` +
`Ganancia: *+${interest.toLocaleString()} ${m.moneda}*`,
m,
);
};

handler.help = ['interes'];
handler.tags = ['economy'];
handler.command = ['interes', 'interest', 'bankinterest'];
handler.group = true;
handler.register = true;
handler.cooldown = 86400000;

export default handler;
