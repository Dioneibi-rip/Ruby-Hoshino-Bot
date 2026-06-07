var handler = async (m, { conn }) => {
  let res = await conn.groupRevokeInvite(m.chat);
  let newLink = 'https://chat.whatsapp.com/' + await conn.groupInviteCode(m.chat);
  
  conn.reply(m.chat, `${emoji2} *Nuevo enlace del grupo:*\n${newLink}`, m);
};

handler.help = ['revoke'];
handler.tags = ['grupo'];
handler.command = ['revoke', 'restablecer'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
