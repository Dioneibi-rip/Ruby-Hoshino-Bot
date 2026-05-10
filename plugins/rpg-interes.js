const handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender];
  const bank = Math.max(0, Number(user.bank) || 0);

  if (bank < 5000) {
    return conn.reply(m.chat, `🏦 Necesitas al menos *5,000 ${m.moneda}* en el banco para cobrar interés.`, m);
  }

  const cooldown = 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (now - (user.lastinterest || 0) < cooldown) {
    const restante = msToTime((user.lastinterest + cooldown) - now);
    return conn.reply(m.chat, `🏦 Ya cobraste interés hoy.\n⏳ Vuelve en *${restante}*.`, m);
  }

  const rate = user.premium ? 0.0285 : 0.028;
  const cap = user.premium ? 55000 : 110000;
  const interest = Math.min(cap, Math.max(600, Math.floor(bank * rate)));

  user.coin = (user.coin || 0) + interest;
  user.lastinterest = now;

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

export default handler;

function msToTime(duration) {
  const totalSeconds = Math.max(0, Math.floor(duration / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
