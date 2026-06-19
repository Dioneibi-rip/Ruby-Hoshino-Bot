const handler = async (m, { conn, isPrems }) => {
  const user = global.db.getUser(m.sender);
  if (!isPrems && !user.premium) {
    return conn.reply(m.chat, '🔒 Este comando es exclusivo para usuarios premium.', m);
  }

  const cooldown = 8 * 60 * 60 * 1000;
  const now = Date.now();

  if (now - (user.lastpremiumbonus || 0) < cooldown) {
    const restante = msToTime((user.lastpremiumbonus + cooldown) - now);
    return conn.reply(m.chat, `👑 Ya reclamaste tu bonus premium.\n⏳ Vuelve en *${restante}*.`, m);
  }

  const coinReward = randomInt(18000, 36000);
  const expReward = randomInt(1600, 3400);
  const diamondReward = randomInt(4, 10);

  user.coin = (user.coin || 0) + coinReward;
  user.exp = (user.exp || 0) + expReward;
  user.diamond = (user.diamond || 0) + diamondReward;
  user.diamonds = (user.diamonds || 0) + diamondReward;
  user.lastpremiumbonus = now;

  return conn.reply(
    m.chat,
    `👑 *Bonus Premium reclamado*\n\n` +
      `💸 ${m.moneda}: *+${coinReward.toLocaleString()}*\n` +
      `✨ Exp: *+${expReward.toLocaleString()}*\n` +
      `💎 Diamantes: *+${diamondReward}*\n` +
      `🕒 Próximo bonus en: *8 horas*`,
    m,
  );
};

handler.help = ['premiumbonus'];
handler.tags = ['premium', 'economy'];
handler.command = ['premiumbonus', 'bonopremium', 'claimpremium'];
handler.group = true;
handler.register = true;

export default handler;

function msToTime(duration) {
  const totalSeconds = Math.max(0, Math.floor(duration / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
