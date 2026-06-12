const ro = 3000;
const cooldown = 2 * 60 * 60 * 1000;

const handler = async (m, { conn, usedPrefix, command }) => {
  const user = global.db.data.users[m.sender];
  if (!user) return conn.reply(m.chat, `${emoji2} *Tu usuario no está registrado en la base de datos.*`, m);

  const now = Date.now();
  const last = user.lastrob || 0;

  if (now - last < cooldown) {
    const time = msToTime(last + cooldown - now);
    return conn.reply(m.chat, `${emoji3} Debes esperar ${time} para usar *#robxp* de nuevo.`, m);
  }

  let who = null;
  if (m.isGroup) {
    who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
  } else {
    who = m.chat;
  }

  if (!who) {
    return conn.reply(m.chat, `${emoji} Debes mencionar a alguien para intentar robarle XP.`, m);
  }

  if (!(who in global.db.data.users)) {
    return conn.reply(m.chat, `${emoji2} Ese usuario no está en la base de datos.`, m);
  }

  if (who === m.sender) {
    return conn.reply(m.chat, `${emoji2} *No puedes robarte a ti mismo.*`, m);
  }

  const target = global.db.data.users[who];
  target.exp = Number.isFinite(target.exp) ? Math.max(0, target.exp) : 0;
  user.exp = Number.isFinite(user.exp) ? user.exp : 0;

  const rob = Math.floor(Math.random() * (ro - 200 + 1)) + 200;

  if (target.exp < 200) {
    return conn.reply(m.chat, `${emoji2} @${who.split('@')[0]} no tiene al menos *200 XP* como para que valga la pena robar.`, m, { mentions: [who] });
  }

  const finalRob = Math.min(rob, target.exp);

  user.exp += finalRob;
  target.exp -= finalRob;
  user.lastrob = now;

  await conn.reply(m.chat, `${emoji} Le robaste *${finalRob} XP* a @${who.split('@')[0]}`, m, { mentions: [who] });
};

handler.help = ['robxp'];
handler.tags = ['economy'];
handler.command = ['robxp', 'robarxp'];
handler.group = true;
handler.register = true;

export default handler;

function msToTime(duration) {
  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let hours = Math.floor((duration / (1000 * 60 * 60)));

  hours = (hours < 10) ? '0' + hours : hours;
  minutes = (minutes < 10) ? '0' + minutes : minutes;
  seconds = (seconds < 10) ? '0' + seconds : seconds;

  return `${hours} Hora(s) ${minutes} Minuto(s)`;
}
