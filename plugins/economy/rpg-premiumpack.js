const handler = async (m, { conn, isPrems }) => {
  const user = global.db.getUser(m.sender);
  if (!isPrems && !user.premium) return conn.reply(m.chat, '🔒 Este comando es exclusivo para usuarios premium.', m);

  const cooldown = 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (now - (user.lastpremiumpack || 0) < cooldown) {
    const wait = msToTime((user.lastpremiumpack + cooldown) - now);
    return conn.reply(m.chat, `🎁 Ya reclamaste tu Premium Pack de hoy.\n⏳ Vuelve en *${wait}*.`, m);
  }

  const coinReward = rand(38000, 76000);
  const expReward = rand(2800, 6200);
  const diamondReward = rand(5, 12);

  user.coin = (user.coin || 0) + coinReward;
  user.exp = (user.exp || 0) + expReward;
  user.diamond = (user.diamond || 0) + diamondReward;
  user.diamonds = (user.diamonds || 0) + diamondReward;
  user.lastpremiumpack = now;

  return conn.reply(
    m.chat,
    `🎁 *Premium Pack diario reclamado*\n\n` +
      `💸 ${m.moneda}: *+${coinReward.toLocaleString()}*\n` +
      `✨ Exp: *+${expReward.toLocaleString()}*\n` +
      `💎 Diamantes: *+${diamondReward}*`,
    m,
  );
};

handler.help = ['premiumpack'];
handler.tags = ['premium', 'economy'];
handler.command = ['premiumpack', 'packpremium', 'dailyvip'];
handler.group = true;
handler.register = true;

export default handler;

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function msToTime(duration) {
  const h = Math.floor(duration / 3600000);
  const m = Math.floor((duration % 3600000) / 60000);
  return `${h}h ${m}m`;
}
