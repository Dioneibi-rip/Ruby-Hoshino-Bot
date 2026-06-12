const handler = async (m, { conn, text, usedPrefix, command }) => {
  let who;
  if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
  else who = m.chat;

  const textpremERROR = `🎟️ Ingresa el @tag del usuario que quieras agregar como premium.`;
  if (!who) return m.reply(textpremERROR, null, { mentions: conn.parseMention(textpremERROR) });

  const user = global.db.data.users[who];
  if (!user) return m.reply(`⚠️ Ese usuario no está en mi base de datos.`);

  const txt = text.replace('@' + who.split`@`[0], '').trim();
  const name = await conn.getName(who);

  const horas = 60 * 60 * 1000 * txt;
  const dias = 24 * horas;
  const semanas = 7 * dias;
  const meses = 30 * dias;
  const now = Date.now();

  if (command === 'addprem' || command === 'userpremium') {
    user.premiumTime = now < user.premiumTime ? user.premiumTime + horas : now + horas;
    user.premium = true;
    m.reply(`🎟️ *Usuario Premium!*\n\n✨ Usuario: ${name}\n🕐 Tiempo: ${txt} hora(s)`, null, { mentions: [who] });
  }

  if (command === 'addprem2' || command === 'userpremium2') {
    user.premiumTime = now < user.premiumTime ? user.premiumTime + dias : now + dias;
    user.premium = true;
    m.reply(`🎟️ *Usuario Premium!*\n\n✨ Usuario: ${name}\n🕐 Tiempo: ${txt} día(s)`, null, { mentions: [who] });
  }

  if (command === 'addprem3' || command === 'userpremium3') {
    user.premiumTime = now < user.premiumTime ? user.premiumTime + semanas : now + semanas;
    user.premium = true;
    const restante = await formatTime(user.premiumTime - now);
    m.reply(`🎟️ *Usuario Premium!*\n\n✨ Usuario: ${name}\n🕐 Tiempo: ${txt} semana(s)\n📉 Restante: ${restante}`, null, { mentions: [who] });
  }

  if (command === 'addprem4' || command === 'userpremium4') {
    user.premiumTime = now < user.premiumTime ? user.premiumTime + meses : now + meses;
    user.premium = true;
    const restante = await formatTime(user.premiumTime - now);
    m.reply(`🎟️ *Usuario Premium!*\n\n✨ Usuario: ${name}\n🕐 Tiempo: ${txt} mes(es)\n📉 Restante: ${restante}`, null, { mentions: [who] });
  }
};

handler.help = ['addprem [@user] <tiempo>'];
handler.tags = ['owner'];
handler.command = ['addprem', 'userpremium', 'addprem2', 'userpremium2', 'addprem3', 'userpremium3', 'addprem4', 'userpremium4'];
handler.group = true;
handler.rowner = true;

export default handler;

async function formatTime(ms) {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  seconds %= 60;
  minutes %= 60;
  hours %= 24;
  let timeString = '';
  if (days) timeString += `${days} día${days > 1 ? 's' : ''} `;
  if (hours) timeString += `${hours} hora${hours > 1 ? 's' : ''} `;
  if (minutes) timeString += `${minutes} minuto${minutes > 1 ? 's' : ''} `;
  if (seconds) timeString += `${seconds} segundo${seconds > 1 ? 's' : ''} `;
  return timeString.trim();
}