import fetch from 'node-fetch';

var handler = async (m, { conn, args, participants }) => {
  let user1, user2;

  if (m.mentionedJid.length === 2) {
    user1 = m.mentionedJid[0];
    user2 = m.mentionedJid[1];
  } else if (m.mentionedJid.length === 1) {
    user1 = m.sender;
    user2 = m.mentionedJid[0];
  } else {
    return conn.reply(m.chat, `❤️ Menciona a una o dos personas para shippearlas.\n\nEjemplo:\n.ship @usuario1 @usuario2`, m);
  }

  const name1 = await conn.getName(user1);
  const name2 = await conn.getName(user2);
  const avatar1 = await conn.profilePictureUrl(user1, 'image').catch(_ => 'https://i.ibb.co.com/Yc4MVdV/images.jpg');
  const avatar2 = await conn.profilePictureUrl(user2, 'image').catch(_ => 'https://i.ibb.co.com/KKYxYQr/download.jpg');

  const lovePercent = Math.floor(Math.random() * 101);
  const background = encodeURIComponent('https://i.ibb.co/4YBNyvP/images-76.jpg');
  const api = `https://api.siputzx.my.id/api/canvas/ship?avatar1=${encodeURIComponent(avatar1)}&avatar2=${encodeURIComponent(avatar2)}&background=${background}&persen=${lovePercent}`;

  let loveMessage = `
💖 *Compatibilidad del amor entre ${name1} y ${name2}* 💖
❤️ *Resultado:* ${lovePercent}%
💌 *Pareja potencial:* ${name1} 💞 ${name2}
`.trim();

  await conn.sendFile(m.chat, api, 'ship.jpg', loveMessage, m, false, {
    mentions: [user1, user2]
  });
};

handler.help = ['ship @user1 @user2'];
handler.tags = ['fun'];
handler.command = ['ship', 'pareja'];
handler.group = true;
handler.register = true;

export default handler;
