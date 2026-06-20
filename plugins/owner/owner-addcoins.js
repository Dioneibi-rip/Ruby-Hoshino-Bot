const handler = async (m, { conn, text }) => {
  let who;
  if (m.isGroup) {
    who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
  } else {
    who = m.chat;
  }
  if (!who) return m.reply('⚠️ Menciona al usuario o cita un mensaje.');

  if (who.endsWith('@lid')) {
    try {
      const pp = await conn.groupMetadata(m.chat);
      const dbUser = pp.participants.find(u => u.lid === who);
      if (dbUser && dbUser.id) who = dbUser.id;
    } catch (e) {
      console.error('[addcoin] Error resolviendo LID:', e);
    }
  }

  const normalizeJid = (jid) => {
    if (!jid) return null;
    let cleaned = jid.replace(/[^\d@]/g, '');
    if (cleaned.includes('@')) {
      const [number] = cleaned.split('@');
      return number + '@s.whatsapp.net';
    }
    return cleaned + '@s.whatsapp.net';
  };

  who = normalizeJid(who);

  let txt = text.replace('@' + who.split('@')[0], '').trim();
  let dmt;

  if (txt.toLowerCase().includes('all') || txt.toLowerCase().includes('todo')) {
    return m.reply('⚠️ Usa una cantidad válida. `all` no aplica para dar dinero.');
  } else {
    let cleanNum = txt.replace(/[^\d]/g, '');
    if (!cleanNum) return m.reply('⚠️ Ingresa la cantidad a dar.');
    dmt = parseInt(cleanNum);
  }

  if (dmt <= 0) return m.reply('⚠️ La cantidad debe ser mayor a 0.');

  try {
    const user = global.db.getUser(who);
    user.coin = (user.coin || 0) + dmt;

    conn.reply(
      m.chat,
      `💰 Dinero agregado\n» +${dmt.toLocaleString()}\n👤 @${who.split('@')[0]}\n📥 Billetera`,
      m,
      { mentions: [who] }
    );
  } catch (error) {
    console.error(`[addcoin] Error al agregar dinero a ${who}:`, error);
    return m.reply('❌ No se pudo actualizar la economía. Revisa la consola.');
  }
};

handler.help = ['darcoin <@user> <cantidad>'];
handler.tags = ['owner'];
handler.command = ['darcoin', 'addcoin', 'givecoin'];
handler.rowner = true;

export default handler;