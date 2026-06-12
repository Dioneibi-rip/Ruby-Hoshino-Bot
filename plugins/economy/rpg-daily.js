const handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender];
  const cooldown = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const elapsed = now - (user.lastclaim || 0);

  if (elapsed < cooldown) {
    const restante = msToTime((user.lastclaim + cooldown) - now);
    return conn.reply(m.chat, `🌸 Ya cobraste tu diario.
⏳ Vuelve en *${restante}*.`, m);
  }

  if (elapsed > cooldown * 2) user.dailyStreak = 1;
  else user.dailyStreak = Math.min(30, (user.dailyStreak || 0) + 1);

  const streak = user.dailyStreak;
  const base = 5200;
  const streakBonus = streak * 520;
  const premiumBonus = user.premium ? 1800 : 0;

  const coinReward = base + streakBonus + premiumBonus;
  const diamondReward = 2 + Math.floor(streak / 8) + (user.premium ? 1 : 0);
  const expReward = 450 + streak * 70 + (user.premium ? 200 : 0);

  user.coin = (user.coin || 0) + coinReward;
  user.diamond = (user.diamond || 0) + diamondReward;
  user.diamonds = (user.diamonds || 0) + diamondReward;
  user.exp = (user.exp || 0) + expReward;
  user.lastclaim = now;

  conn.reply(
    m.chat,
    `「✿」Recompensa diaria reclamada (racha *${streak}*):\n` +
      `💰 ${m.moneda}: *+${coinReward.toLocaleString()}*\n` +
      `💎 Diamantes: *+${diamondReward}*\n` +
      `✨ Exp: *+${expReward}*\n\n` +
      `Siguiente día (racha ${Math.min(30, streak + 1)}): *+${(base + (Math.min(30, streak + 1) * 520) + premiumBonus).toLocaleString()} ${m.moneda}*`,
    m,
  );
};

handler.help = ['daily', 'diario'];
handler.tags = ['rpg'];
handler.command = ['daily', 'diario'];
handler.group = true;
handler.register = true;

export default handler;

function msToTime(duration) {
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} hora(s) y ${minutes} minuto(s)`;
}
