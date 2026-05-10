const handler = async (m) => {
  const user = global.db.data.users[m.sender] || {};
  user.weekly = user.weekly || 0;

  const cooldown = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (now - user.weekly < cooldown) {
    return m.reply(`🎁 Ya reclamaste tu semanal.\nVuelve en *${msToTime((user.weekly + cooldown) - now)}*`);
  }

  const coinReward = user.premium ? 120000 : 75000;
  const expReward = user.premium ? 12000 : 7000;
  const diamondReward = user.premium ? 14 : 8;

  user.coin = (user.coin || 0) + coinReward;
  user.exp = (user.exp || 0) + expReward;
  user.diamond = (user.diamond || 0) + diamondReward;
  user.diamonds = (user.diamonds || 0) + diamondReward;
  user.weekly = now;

  m.reply(
    `🎁 *Recompensa semanal*\n\n` +
      `💸 ${m.moneda}: *+${coinReward.toLocaleString()}*\n` +
      `✨ Exp: *+${expReward.toLocaleString()}*\n` +
      `💎 Diamantes: *+${diamondReward}*\n\n` +
      `👑 Premium recibe más monedas, EXP y diamantes.`,
  );
};

handler.help = ['weekly'];
handler.tags = ['rpg'];
handler.command = ['semanal', 'weekly'];
handler.group = true;
handler.register = true;

export default handler;

function msToTime(duration) {
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  return `${days} días ${hours} horas ${minutes} minutos`;
}
