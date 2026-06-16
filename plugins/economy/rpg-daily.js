const RUBY_THUMBNAIL_URL = 'https://i.postimg.cc/m2ccrBmq/ㅤcolumbinaㅤ-ㅤicon.jpg';
const RUBY_SOURCE_URL = 'https://github.com/Dioneibi-rip';

async function fetchThumbnailBuffer(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al descargar thumbnail`);
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error('Error al descargar la imagen para externalAdReply:', error);
    return undefined;
  }
}

const handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender];
  const cooldown = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const elapsed = now - (user.lastclaim || 0);

  // Descargamos el thumbnail para usarlo en el mensaje
  const thumbnail = await fetchThumbnailBuffer(RUBY_THUMBNAIL_URL);

  // Preparamos la información del externalAdReply (El "truco")
  const contextInfo = {
    externalAdReply: {
      title: '🌸 𝘙𝘶𝘣𝘺 𝘏𝘰𝘴𝘩𝘪𝘯𝘰 𝘉𝘰𝘵 ☆',
      body: '🪄 Welcome, to Ruby Hoshino.',
      mediaType: 1,
      previewType: 0,
      renderLargerThumbnail: false,
      sourceUrl: RUBY_SOURCE_URL,
      mediaUrl: RUBY_SOURCE_URL,
      ...(thumbnail ? { thumbnail, jpegThumbnail: thumbnail } : {})
    }
  };

  // Verificación de Cooldown (Tiempo de espera)
  if (elapsed < cooldown) {
    const restante = msToTime((user.lastclaim + cooldown) - now);
    const mensajeEspera = `🌸 Ya cobraste tu diario.\n⏳ Vuelve en *${restante}*.`;
    
    return await conn.sendMessage(m.chat, {
      text: mensajeEspera,
      contextInfo
    }, { quoted: m });
  }

  // Cálculo de rachas y recompensas
  if (elapsed > cooldown * 2) user.dailyStreak = 1;
  else user.dailyStreak = Math.min(30, (user.dailyStreak || 0) + 1);

  const streak = user.dailyStreak;
  const base = 5200;
  const streakBonus = streak * 520;
  const premiumBonus = user.premium ? 1800 : 0;

  const coinReward = base + streakBonus + premiumBonus;
  const diamondReward = 2 + Math.floor(streak / 8) + (user.premium ? 1 : 0);
  const expReward = 450 + streak * 70 + (user.premium ? 200 : 0);

  // Actualización de la base de datos
  user.coin = (user.coin || 0) + coinReward;
  user.diamond = (user.diamond || 0) + diamondReward;
  user.diamonds = (user.diamonds || 0) + diamondReward;
  user.exp = (user.exp || 0) + expReward;
  user.lastclaim = now;

  // Mensaje de éxito
  const mensajeRecompensa = `「✿」Recompensa diaria reclamada (racha *${streak}*):\n` +
    `💰 ${m.moneda}: *+${coinReward.toLocaleString()}*\n` +
    `💎 Diamantes: *+${diamondReward}*\n` +
    `✨ Exp: *+${expReward}*\n\n` +
    `Siguiente día (racha ${Math.min(30, streak + 1)}): *+${(base + (Math.min(30, streak + 1) * 520) + premiumBonus).toLocaleString()} ${m.moneda}*`;

  // Enviamos el mensaje final con el diseño
  await conn.sendMessage(m.chat, {
    text: mensajeRecompensa,
    contextInfo
  }, { quoted: m });
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