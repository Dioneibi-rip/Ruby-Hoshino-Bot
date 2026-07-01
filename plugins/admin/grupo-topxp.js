import { xpRange } from '../../lib/levelling.js'

let handler = async (m, { conn, args }) => {
let users = Object.entries(global.db.listUsers())
.filter(([_, u]) => u.exp > 0 && u.level >= 0)
.map(([jid, u]) => ({ ...u, jid }));

users.sort((a, b) => b.exp - a.exp);

const page = args[0] && !isNaN(args[0]) ? parseInt(args[0]) : 1;
const usersPerPage = 10;
const totalPages = Math.ceil(users.length / usersPerPage);
const startIndex = (page - 1) * usersPerPage;
const endIndex = Math.min(startIndex + usersPerPage, users.length);
const rankOffset = startIndex + 1;

let text = `◢✿ *Top de usuarios con más experiencia* ✿◤\n\n`;

for (let i = startIndex; i < endIndex; i++) {
let u = users[i];
let name = await conn.getName(u.jid) || 'Desconocido';
text += `✰ ${i + 1} » *${name}*\n`;
text += `  ❖ XP » *${u.exp.toLocaleString()}*  ❖ LVL » *${u.level}*\n`;
}

text += `\n> • Página *${page}* de *${totalPages}*`;
if (page < totalPages) text += `\n> Para ver la siguiente página » *#leaderboard ${page + 1}*`;

await conn.reply(m.chat, text, m, {
mentions: users.slice(startIndex, endIndex).map(u => u.jid),
});
};

handler.help = ['leaderboard [página]'];
handler.tags = ['rpg'];
handler.command = ['leaderboard', 'topxp', 'toplevel'];
handler.group = true;
handler.register = true;

export default handler;
