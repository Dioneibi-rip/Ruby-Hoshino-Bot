import { isChatBannedForBot } from '../../src/core/session-utils.js';
const handler = async (m, {conn, isOwner}) => {
  const chats = Object.entries(global.db.getSection('chats')).filter(([, chat]) => Object.keys(chat?.isBanned || {}).length || (chat?.bannedBots || []).some((jid) => isChatBannedForBot(chat, jid)));
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
