let handler = async (m, { conn, participants, args }) => {
  let user = null;
  let deleteAll = false;

  if (args[0]) {
    if (args[0].toLowerCase() === 'all') {
      deleteAll = true;
    } else {
      user = args[0].replace(/[@+]/g, '') + '@s.whatsapp.net';
    }
  } else if (m.quoted) {
    user = m.quoted.sender;
  } else if (m.mentionedJid?.length) {
    user = m.mentionedJid[0];
  }

  const allMessages = Object.values(conn.chats[m.chat]?.messages || {})
    .filter(v => v.key?.id && !v.message?.protocolMessage) // válidos
    .sort((a, b) => b.messageTimestamp.low - a.messageTimestamp.low)
    .slice(0, 100);

  if (deleteAll) {
    for (let msg of allMessages) {
      try {
        await conn.sendMessage(m.chat, { delete: msg.key });
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (e) {
        console.error('Error al eliminar (all):', e);
      }
    }
    return m.reply(`✅ Se eliminaron los últimos ${allMessages.length} mensajes del grupo.`);
  }

  if (!user) {
    return m.reply('👤 onichan Menciona al usuario, responde su mensaje o usa "all".\n\nEjemplo:\n.borrarmsg @usuario\n.borrarmsg 829xxxxxxx\n.borrarmsg (respondiendo)\n.borrarmsg all');
  }

  if (!participants.some(p => p.id === user)) return m.reply('❌ El usuario no está en este grupo.');

  const userMessages = allMessages.filter(v => v.key?.participant === user);

  if (!userMessages.length) return m.reply('😿 No encontré mensajes recientes de ese usuario.');

  for (let msg of userMessages) {
    try {
      await conn.sendMessage(m.chat, { delete: msg.key });
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (e) {
      console.error('Error al eliminar (usuario):', e);
    }
  }

  await m.reply(`✅ Se eliminaron ${userMessages.length} mensajes recientes de @${user.split('@')[0]}.`, null, {
    mentions: [user]
  });
};

handler.help = ['borrarmsg @usuario', 'borrarmsg all'];
handler.tags = ['grupo'];
handler.command = ['borrarmsg', 'del']; // <-- Aquí está el alias
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
