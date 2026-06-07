/* 
- programarcierre By Dioneibi-rip
- Programa el cierre de un grupo de WhatsApp a una hora específica
- https://whatsapp.com/channel/0029VaJxgcB0bIdvuOwKTM2Y
*/

const handler = async (m, { conn, args, usedPrefix, command, isAdmin, isOwner }) => {
  const customEmoji = global.db.data.chats[m.chat]?.customEmoji || '⏰';
  m.react(customEmoji);

  if (!(isAdmin || isOwner)) {
    global.dfail('admin', m, conn);
    throw false;
  }

  if (!conn.groupMetadata || !m.isGroup) throw '*Este comando solo funciona en grupos.*';

  const chat = await conn.groupMetadata(m.chat);
  const botAdmin = chat.participants.find(p => p.id === conn.user.jid)?.admin;
  if (!botAdmin) throw '*Debo ser administrador para poder cerrar el grupo.*';

  if (args.length < 3) {
    throw `*Ejemplo de uso:*\n${usedPrefix + command} argentina 9:00 am`;
  }

  const zonas = {
    argentina: -3,
    mexico: -6,
    chile: -4,
    colombia: -5,
    españa: 2,
    peru: -5,
    uruguay: -3,
    bolivia: -4,
    venezuela: -4,
    paraguay: -4,
    ecuador: -5,
    panama: -5,
    costa_rica: -6,
    honduras: -6,
    guatemala: -6,
    el_salvador: -6,
    nicaragua: -6,
    republica_dominicana: -4,
    cuba: -4,
    brasil: -3,
    estados_unidos: -4, // Hora del Este
  };

  const zona = args[0].toLowerCase();
  if (!zonas[zona]) {
    throw `*Zona horaria no válida.*\nZonas válidas: ${Object.keys(zonas).map(z => `\`${z}\``).join(', ')}`;
  }

  const horaTexto = args[1];
  const ampm = (args[2] || '').toLowerCase();
  if (!horaTexto.match(/^([0-1]?[0-9]):([0-5][0-9])$/) || !['am', 'pm'].includes(ampm)) {
    throw '*Formato de hora inválido. Ejemplo: 9:00 am*';
  }

  let [hora, minuto] = horaTexto.split(':').map(n => parseInt(n));
  if (ampm === 'pm' && hora !== 12) hora += 12;
  if (ampm === 'am' && hora === 12) hora = 0;

  const ahora = new Date();
  const tiempoDestino = new Date(ahora);
  tiempoDestino.setUTCHours(hora - zonas[zona], minuto, 0, 0);

  const diferencia = tiempoDestino.getTime() - ahora.getTime();
  if (diferencia <= 0) throw '*La hora debe ser posterior a la actual.*';

  await m.reply(`✅ El grupo será *cerrado automáticamente* hoy a las *${horaTexto} ${ampm.toUpperCase()}* en zona horaria *${zona.toUpperCase()}*.`);

  setTimeout(async () => {
    await conn.groupSettingUpdate(m.chat, 'announcement'); // modo solo admin
    await conn.sendMessage(m.chat, { text: '🔒 *El grupo ha sido cerrado automáticamente.*' });
  }, diferencia);
};

handler.help = ['programarcierre <zona> <hora> <am/pm>'];
handler.tags = ['group'];
handler.command = ['programarcierre', 'cerrargrupo'];
handler.admin = true;
handler.group = true;

export default handler;
