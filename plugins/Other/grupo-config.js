let handler = async (m, { conn, args, command }) => {
  const key = ['open','close','abrir','cerrar','abierto','cerrado'].includes(command)
    ? command
    : (args[0] || '').toLowerCase();

  const map = {
    open: 'not_announcement',
    abrir: 'not_announcement',
    abierto: 'not_announcement',
    close: 'announcement',
    cerrar: 'announcement',
    cerrado: 'announcement',
  };

  const isClose = map[key];
  if (isClose === undefined) return;

  await conn.groupSettingUpdate(m.chat, isClose);
};

handler.help = ['open', 'close', 'abrir', 'cerrar', 'group abrir/cerrar', 'grupo abrir/cerrar'];
handler.tags = ['grupo'];
handler.command = ['open', 'close', 'abrir', 'cerrar', 'group', 'grupo'];
handler.admin = true;
handler.botAdmin = true;
handler.group = true;

export default handler;
