let handler = async (m, { conn, text, isROwner }) => {
  if (!isROwner && m.sender !== conn.user.jid) {
      throw `Este comando solo puede ser utilizado por el propietario del bot.`;
  }

  let settings = global.db.data.settings[conn.user.jid];

  if (!settings) {
    global.db.data.settings[conn.user.jid] = {};
    settings = global.db.data.settings[conn.user.jid];
  }

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

  m.reply(`✅ El nombre de la moneda para este bot ha sido cambiado a: *${settings.moneda}*`);
};

handler.help = ['setmoneda <nombre>'];
handler.tags = ['owner'];
handler.command = ['setmoneda'];

export default handler;