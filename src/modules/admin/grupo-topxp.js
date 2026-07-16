let handler = async (m, { conn, args }) => {
const page = args[0] && !isNaN(args[0]) ? parseInt(args[0]) : 1;
const usersPerPage = 10;
const startIndex = (page - 1) * usersPerPage;
const totalUsers = global.db.countUsers?.() || 0;
const totalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));
let users = global.db.getTopUsers?.({ field: 'exp', limit: usersPerPage, offset: startIndex }) || global.db.topUsers?.({ field: 'exp', limit: usersPerPage, offset: startIndex }) || [];
users = users.filter(u => Number(u.exp) > 0 && Number(u.level) >= 0).map(u => ({ ...u, jid: u.id || u.jid }));

let text = `◢✿ *Top de usuarios con más experiencia* ✿◤\n\n`;

for (let i = 0; i < users.length; i++) {
let u = users[i];
let name = await conn.getName(u.jid) || 'Desconocido';
text += `✰ ${startIndex + i + 1} » *${name}*\n`;
text += `  ❖ XP » *${u.exp.toLocaleString()}*  ❖ LVL » *${u.level}*\n`;
}

text += `\n> • Página *${page}* de *${totalPages}*`;
if (page < totalPages) text += `\n> Para ver la siguiente página » *#leaderboard ${page + 1}*`;

await conn.reply(m.chat, text, m, {
mentions: users.map(u => u.jid),
});
};

handler.help = ['leaderboard [página]'];
handler.tags = ['rpg'];
handler.command = ['leaderboard', 'topxp', 'toplevel'];
handler.group = true;
handler.register = true;

export default handler;
