let handler = async (m, { conn, args, participants }) => {
const page = parseInt(args[0]) || 1;
const pageSize = 10;
const startIndex = (page - 1) * pageSize;
const endIndex = startIndex + pageSize;
const participantJids = new Set(participants.map(p => p.jid || p.id).filter(Boolean));
const sortedLevel = Object.entries(global.db.listUsers()).map(([jid, user]) => ({
jid,
exp: Number(user.exp) || 0,
level: Number(user.level) || 0
})).sort((a, b) => b.exp - a.exp);
const totalPages = Math.ceil(sortedLevel.length / pageSize);
const pageUsers = sortedLevel.slice(startIndex, endIndex);
let text = `◢✨ Top de usuarios con más experiencia ✨◤\n\n`;

text += pageUsers.map(({ jid, exp, level }, i) => {
return `✰ ${startIndex + i + 1} » *${participantJids.has(jid) ? `(${conn.getName(jid)}) wa.me/` : '@'}${jid.split`@`[0]}*` +
`\n\t\t ❖ XP » *${exp}*  ❖ LVL » *${level}*`;
}).join('\n');

text += `\n\n> • Página *${page}* de *${totalPages}*`;
if (page < totalPages) text += `\n> Para ver la siguiente página » *#lb ${page + 1}*`;

await conn.reply(m.chat, text.trim(), m, { mentions: conn.parseMention(text) });
}

handler.help = ['lb'];
handler.tags = ['rpg'];
handler.command = ['lboard', 'top', 'lb'];
handler.group = true;
handler.register = true;
handler.fail = null;
handler.exp = 0;

export default handler;
