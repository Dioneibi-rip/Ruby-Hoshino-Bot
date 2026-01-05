import db from '../lib/database.js';

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let user = db.data.users[m.sender];
  let mentionedJid = m.mentionedJid?.[0];

  if (!mentionedJid) return m.reply(`*✦ Debes mencionar al usuario que quieres retar al duelo.*\n\nEjemplo: *${usedPrefix}${command} @usuario*`);
  if (mentionedJid === m.sender) return m.reply('✦ No puedes retarte a ti mismo, ¿eh?');

  let target = db.data.users[mentionedJid];
  if (!target) return m.reply('✦ El usuario mencionado no existe en la base de datos.');

  const apuesta = 2500;
  if (user.yenes < apuesta) return m.reply(`✦ No tienes suficiente dinero para retar. Necesitas ¥${apuesta}.`);
  if (target.yenes < apuesta) return m.reply(`✦ El usuario mencionado no tiene suficiente dinero para aceptar el duelo.`);

  const acceptMsg = `
𓆩 ⚔️ 𝔻 𝕌 𝔼 𝕃 𝕆 ⚔️ 𓆪

*${conn.getName(m.sender)}* ha retado a *${conn.getName(mentionedJid)}* a un duelo anime ⚔️  
🎴 Apuesta total: *¥${apuesta}* por cada uno

*${conn.getName(mentionedJid)}*, ¿aceptas el duelo?

✦ Responde con:* _acepto_ *en los próximos 30 segundos.
`;

  await conn.sendMessage(m.chat, { text: acceptMsg, mentions: [mentionedJid, m.sender] }, { quoted: m });

  const respuesta = await conn.awaitReply(m.chat, mentionedJid, 30000);
  if (!respuesta || !/acepto|sí|si/i.test(respuesta.text)) {
    return m.reply(`❌ El duelo fue cancelado. El usuario no respondió o no aceptó.`);
  }

  // Proceder con el duelo
  user.yenes -= apuesta;
  target.yenes -= apuesta;

  let ganador = Math.random() < 0.5 ? m.sender : mentionedJid;
  let perdedor = ganador === m.sender ? mentionedJid : m.sender;

  db.data.users[ganador].yenes += apuesta * 2;

  const gifs = [
    'https://c.tenor.com/EZITk9w7NNUAAAAC/anime-fight.gif',
    'https://c.tenor.com/g2SRjuoKJvYAAAAd/anime-fight-sword.gif',
    'https://c.tenor.com/EDK51mtA0OYAAAAC/naruto-sasuke.gif',
    'https://c.tenor.com/x6xxo2nGFYMAAAAd/anime-duel.gif'
  ];

  const gif = gifs[Math.floor(Math.random() * gifs.length)];

  const resultado = `
╭━━━❰  🎴 𝗗𝗨𝗘𝗟𝗢 𝗔𝗡𝗜𝗠𝗘 🎴 ❱━━━╮
┃ 🥷 *${conn.getName(m.sender)}*
┃            ✦  𝙑𝙎  ✦
┃ 🥷 *${conn.getName(mentionedJid)}*
╰━━━━━━━━━━━━━━━━━━━╯

⚔️ ¡La batalla ha comenzado!
💸 Ambos apostaron: *¥${apuesta}*

🎥 *Escena Épica:* 
${gif}

🏆 𝙂𝘼𝙉𝘼𝘿𝙊𝙍: *${conn.getName(ganador)}*
🎊 Se lleva el premio de: *¥${apuesta * 2}*

> _¡Sigue luchando por la gloria!_
`;

  await conn.sendMessage(m.chat, { text: resultado, mentions: [m.sender, mentionedJid] }, { quoted: m });
};

handler.command = ['duelo']
handler.group = true;

export default handler;
