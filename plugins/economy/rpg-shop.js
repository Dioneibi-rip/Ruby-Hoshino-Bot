const xppercoin = 60;
const handler = async (m, { conn, command, args }) => {
let count = command.replace(/^buy/i, '');
count = count ? /all/i.test(count) ? Math.floor(global.db.getUser(m.sender).exp / xppercoin) : parseInt(count) : args[0] ? parseInt(args[0]) : 1;
count = Math.max(1, count);

const user = global.db.getUser(m.sender);
const bonus = user.premium ? 1.3 : 1;
const finalCoins = Math.floor(count * bonus);

if (user.exp >= xppercoin * count) {
user.exp -= xppercoin * count;
user.coin += finalCoins;
conn.reply(m.chat, `
╔═══════⩽✰⩾═══════╗
║    𝐍𝐨𝐭𝐚 𝐃𝐞 𝐏𝐚𝐠𝐨
╠═══════⩽✰⩾═══════╝
║╭──────────────┄
║│ *Compra Nominal* : + ${finalCoins.toLocaleString()} 💸
║│ *Tasa XP* : ${xppercoin} XP = 1 ${m.moneda}
║│ *Gastado* : -${(xppercoin * count).toLocaleString()} XP
║│ *Bonus premium* : x${bonus}
║╰──────────────┄
╚═══════⩽✰⩾═══════╝`, m);
} else conn.reply(m.chat, `${emoji2} Lo siento, no tienes suficiente *XP* para comprar *${count}* ${m.moneda} 💸`, m);
};
handler.help = ['Buy', 'Buyall'];
handler.tags = ['economy'];
handler.command = ['buy', 'buyall'];
handler.group = true;
handler.register = true;

export default handler;
