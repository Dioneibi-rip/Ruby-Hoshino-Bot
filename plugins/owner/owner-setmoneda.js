let handler = async (m, { conn, text, isROwner }) => {
  if (!isROwner && m.sender !== conn.user.jid) {
      throw `Este comando solo puede ser utilizado por el propietario del bot.`;
  }

  let settings = global.db.get('settings', conn.user.jid) || {};
  if (!global.db.has('settings', conn.user.jid)) global.db.set('settings', conn.user.jid, settings);

  if (!text) {
    const currentMoneda = settings.moneda || 'No establecida';
    return m.reply(
`*–––––『 MONEDA DEL BOT 』–––––*

Por favor, proporciona un nombre para la moneda.
> *Ejemplo:* #setmoneda Diamantes 

*Moneda actual:* ${currentMoneda}`
    );
  }

  settings.moneda = text.trim();
  global.db.set('settings', conn.user.jid, settings);

  m.reply(`✅ El nombre de la moneda para este bot ha sido cambiado a: *${settings.moneda}*`);
};

handler.help = ['setmoneda <nombre>'];
handler.tags = ['owner'];
handler.command = ['setmoneda'];

export default handler;