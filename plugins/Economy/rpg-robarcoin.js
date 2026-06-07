const handler = async (m, { conn, participants }) => {
  try {
    const now = Date.now();

    let senderJid = m.sender;
    if (m.sender.endsWith('@lid') && m.isGroup) {
      const pInfo = participants.find((p) => p.lid === m.sender);
      if (pInfo?.id) senderJid = pInfo.id;
    }

    const user = global.db?.data?.users?.[senderJid];
    if (!user) return conn.reply(m.chat, `${emoji2} Tu usuario no está en la base de datos.`, m);

    let target = null;
    if (m.isGroup) {
      target = m.mentionedJid?.[0] || m.quoted?.sender || null;
    } else {
      target = m.chat;
    }

    if (!target) return conn.reply(m.chat, `${emoji2} Debes mencionar a alguien para intentar robar.`, m);

    let targetJid = target;
    if (target.endsWith('@lid') && m.isGroup) {
      const pInfo = participants.find((p) => p.lid === target);
      if (pInfo?.id) targetJid = pInfo.id;
    }

    if (targetJid === senderJid) return conn.reply(m.chat, `${emoji2} No puedes robarte a ti mismo.`, m);

    const targetUser = global.db?.data?.users?.[targetJid];
    if (!targetUser) return conn.reply(m.chat, `${emoji2} Ese usuario no está registrado.`, m);

    const cooldown = user.premium ? 75 * 60 * 1000 : 120 * 60 * 1000;
    if (user.lastrob2 && now - Number(user.lastrob2) < cooldown) {
      const remaining = Number(user.lastrob2) + cooldown - now;
      return conn.reply(m.chat, `${emoji3} Debes esperar *${msToTime(remaining)}* para volver a robar.`, m);
    }

    const minVictimCash = 2500;
    const victimCash = Math.max(0, Number(targetUser.coin) || 0);
    if (victimCash < minVictimCash) {
      return conn.reply(m.chat, `${emoji2} @${target.split('@')[0]} no tiene efectivo suficiente (mínimo ${minVictimCash.toLocaleString()} ${m.moneda}).`, m, { mentions: [target] });
    }

    const successChance = user.premium ? 0.47 : 0.40;
    const maxSteal = Math.max(1200, Math.floor(victimCash * 0.12));
    const minSteal = 600;

    user.lastrob2 = now;

    if (Math.random() < successChance) {
      const amount = Math.min(victimCash, randomInt(minSteal, maxSteal));
      targetUser.coin = Math.max(0, victimCash - amount);
      user.coin = (Number(user.coin) || 0) + amount;

      return conn.reply(
        m.chat,
        `🕶️ Robo exitoso a @${target.split('@')[0]}\n💸 Te llevaste *¥${amount.toLocaleString()} ${m.moneda}*`,
        m,
        { mentions: [target] },
      );
    }

    const multa = Math.max(300, Math.floor((Number(user.coin) || 0) * 0.05));
    user.coin = Math.max(0, (Number(user.coin) || 0) - multa);

    return conn.reply(
      m.chat,
      `🚨 Fallaste el robo a @${target.split('@')[0]} y te multaron.\n💸 Perdiste *¥${multa.toLocaleString()} ${m.moneda}*`,
      m,
      { mentions: [target] },
    );
  } catch (err) {
    console.error('Error en comando rob:', err);
    return conn.reply(m.chat, `${emoji2} Ocurrió un error al ejecutar el robo.`, m);
  }
};

handler.help = ['rob'];
handler.tags = ['rpg'];
handler.command = ['robar', 'steal', 'rob'];
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
