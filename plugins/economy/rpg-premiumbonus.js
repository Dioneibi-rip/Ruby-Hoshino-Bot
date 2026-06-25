const handler = async (m, { conn, isPrems }) => {
const user = global.db.getUser(m.sender);
if (!isPrems && !user.premium) {
await conn.reply(m.chat, '🔒 Este comando es exclusivo para usuarios premium.', m);
return false;
}

const coinReward = randomInt(18000, 36000);
const expReward = randomInt(1600, 3400);
const diamondReward = randomInt(4, 10);

user.coin = (user.coin || 0) + coinReward;
user.exp = (user.exp || 0) + expReward;
user.diamond = (user.diamond || 0) + diamondReward;
user.diamonds = (user.diamonds || 0) + diamondReward;

return conn.reply(
m.chat,
`👑 *Bonus Premium reclamado*\n\n` +
`💸 ${m.moneda}: *+${coinReward.toLocaleString()}*\n` +
`✨ Exp: *+${expReward.toLocaleString()}*\n` +
`💎 Diamantes: *+${diamondReward}*\n` +
`🕒 Próximo bonus en: *8 horas*`,
m,
);
};

handler.help = ['premiumbonus'];
handler.tags = ['premium', 'economy'];
handler.command = ['premiumbonus', 'bonopremium', 'claimpremium'];
handler.group = true;
handler.register = true;
handler.cooldown = 28800000;

export default handler;



function randomInt(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}
