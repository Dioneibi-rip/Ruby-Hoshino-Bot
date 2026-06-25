const handler = async (m, { conn, isPrems }) => {
const user = global.db.getUser(m.sender);
if (!isPrems && !user.premium) {
await conn.reply(m.chat, '🔒 Este comando es exclusivo para usuarios premium.', m);
return false;
}

const coinReward = rand(38000, 76000);
const expReward = rand(2800, 6200);
const diamondReward = rand(5, 12);

user.coin = (user.coin || 0) + coinReward;
user.exp = (user.exp || 0) + expReward;
user.diamond = (user.diamond || 0) + diamondReward;
user.diamonds = (user.diamonds || 0) + diamondReward;

return conn.reply(
m.chat,
`🎁 *Premium Pack diario reclamado*\n\n` +
`💸 ${m.moneda}: *+${coinReward.toLocaleString()}*\n` +
`✨ Exp: *+${expReward.toLocaleString()}*\n` +
`💎 Diamantes: *+${diamondReward}*`,
m,
);
};

handler.help = ['premiumpack'];
handler.tags = ['premium', 'economy'];
handler.command = ['premiumpack', 'packpremium', 'dailyvip'];
handler.group = true;
handler.register = true;
handler.cooldown = 86400000;

export default handler;

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
