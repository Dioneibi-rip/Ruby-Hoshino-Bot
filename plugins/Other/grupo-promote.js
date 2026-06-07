const handler = async (m, { conn, text, participants }) => {
  let user;

  // Obtener el usuario a promover
  if (m.mentionedJid && m.mentionedJid.length) {
    user = m.mentionedJid[0]; // usa el primer mencionado
  } else if (m.quoted?.sender) {
    user = m.quoted.sender;
  } else {
    throw '⚠️ Debes mencionar a un usuario o responder a su mensaje para promoverlo.';
  }

  // Promocionar al usuario
  await conn.groupParticipantsUpdate(m.chat, [user], 'promote');
  conn.reply(m.chat, `✅ @${user.split('@')[0]} ahora es administrador.`, m, {
    mentions: [user]
  });
};

handler.help = ['promote'];
handler.tags = ['grupo'];
handler.command = ['promote', 'darpija', 'promover'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
