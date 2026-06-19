const handler = async (m, {conn, isOwner}) => {
  const chats = Object.entries(global.db.listChats()).filter((chat) => chat[1].isBanned);
  const users = Object.entries(global.db.listUsers()).filter((user) => user[1].banned);
  const caption = `
┌〔 Usuarios  -  Baneados 〕
├ Total : ${users.length} ${users ? '\n' + users.map(([jid], i) => `
├ ${isOwner ? '@' + jid.split`@`[0] : jid}`.trim()).join('\n') : '├'}
└────

┌〔 Chats  -  Baneados 〕
├ Total : ${chats.length} ${chats ? '\n' + chats.map(([jid], i) => `
├ ${isOwner ? '@' + jid.split`@`[0] : jid}`.trim()).join('\n') : '├'}
└────
`.trim();
  m.reply(caption, null, {mentions: conn.parseMention(caption)});
};
handler.command = ['banlist','listban'];
handler.rowner = true;

export default handler;
