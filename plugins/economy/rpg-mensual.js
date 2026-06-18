let handler = async (m) => {
  let user = global.db.getUser(m.sender) || {};
  user.monthly = user.monthly || 0;

  const cooldown = 604800000 * 4;
  const timeRemaining = user.monthly + cooldown - Date.now();

  if (timeRemaining > 0) {
    return m.reply(`${emoji3} ✿ Ya reclamaste tu *recompensa mensual* ✿\n⏳ Vuelve en *${msToTime(timeRemaining)}*`);
  }

  const premiumFactor = user.premium ? 1.3 : 1;
  const coinReward = Math.floor(pickRandom([300000, 340000, 380000, 420000]) * premiumFactor);
  const expReward = Math.floor(pickRandom([24000, 28000, 32000, 36000]) * premiumFactor);
  const diamondReward = Math.floor(pickRandom([28, 34, 40, 46]) * premiumFactor);

  user.coin = (user.coin || 0) + coinReward;
  user.exp = (user.exp || 0) + expReward;
  user.diamond = (user.diamond || 0) + diamondReward;
  user.diamonds = (user.diamonds || 0) + diamondReward;
  user.monthly = Date.now();

  const mensaje = `
╭───────「  🎁 𝐌𝐄𝐍𝐒𝐔𝐀𝐋 - 𝐁𝐎𝐍𝐔𝐒 🎁 」───────
│ ✿ ¡Has reclamado tu regalo mensual!
│
│ 💸 ${m.moneda}: *+¥${coinReward.toLocaleString()}*
│ ✨ Experiencia: *+${expReward.toLocaleString()} XP*
│ 💎 Diamantes: *+${diamondReward}*
│ 👑 Multiplicador premium: *x${premiumFactor}*
╰─────────────────────────────

⏳ Puedes volver a reclamarlo dentro de *4 semanas*
`.trim();

  m.reply(mensaje);
};

handler.help = ['mensual'];
handler.tags = ['rpg'];
handler.command = ['mensual', 'monthly'];
handler.group = true;
handler.register = true;

export default handler;

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function msToTime(duration) {
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  return `${days} días, ${hours} horas, ${minutes} minutos`;
}
