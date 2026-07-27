const xppercoin = 60;
const handler = async (m, { conn, command, args }) => {
let count = command.replace(/^buy/i, '');
const user = global.db.getUser(m.sender);
const countInput = count || args[0] || '1';
if (/all/i.test(countInput)) count = Math.floor(Number(user.exp || 0) / xppercoin);
else if (/^\d+$/.test(String(countInput).trim())) count = Number.parseInt(String(countInput).trim(), 10);
else return conn.reply(m.chat, `${emoji2} Lo siento, no tienes suficiente *XP* para comprar *0* ${m.moneda} 💸`, m);
if (!Number.isSafeInteger(count) || count <= 0) return conn.reply(m.chat, `${emoji2} Lo siento, no tienes suficiente *XP* para comprar *0* ${m.moneda} 💸`, m);

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
handler.cooldown = 10000;
handler.cooldownMessage = (seconds, time, hms) => `${emoji2} Debes esperar ${hms} para usar #buy nuevamente.`;

export default handler;
