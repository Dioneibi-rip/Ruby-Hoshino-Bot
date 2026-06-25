const handler = async (m, {conn, isAdmin, groupMetadata }) => {
  if (isAdmin) return m.reply(`${emoji} Tu ya eres admin.`);
  try {
    await conn.groupParticipantsUpdate(m.chat, [m.sender], 'promote');
  await m.react(done)
   m.reply(`${emoji} Ya te di admin.`);
  } catch (e) {
    m.reply(`${msm} Ocurrio un error.`);
  return false;
  }
};
handler.tags = ['owner'];
handler.help = ['autoadmin'];
handler.command = ['autoadmin'];
handler.rowner = true;
handler.group = true;
handler.botAdmin = true;

export default handler;
