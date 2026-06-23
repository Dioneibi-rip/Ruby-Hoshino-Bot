const baseCoinReward = 10000;

var handler = async (m, { conn }) => {

let user = global.db.getUser(m.sender) || {};

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const isOctober = currentDate.getMonth() === 9;

let coinReward = pickRandom([5, 10, 15, 20]);
let candyReward = pickRandom([5, 10, 15, 20]);
let expReward = pickRandom([2000, 3000, 4000, 5000]);
let giftReward = pickRandom([2, 3, 4, 5]);

user.coin = (user.coin || 0) + coinReward;
user.candies = (user.candies || 0) + candyReward;
user.exp = (user.exp || 0) + expReward;
user.gifts = (user.gifts || 0) + giftReward;

m.reply(`
\`\`\`🎃 ¡Feliz Halloween! ¡Disfruta de tu regalo de Halloween! 👻\`\`\`

💸 *${m.moneda}* : +${coinReward}
🍬 *Dulces* : +${candyReward}
✨ *Experiencia* : +${expReward}
🎃 *Regalos de Halloween* : +${giftReward}`);
}

handler.help = ['halloween'];
handler.tags = ['rpg'];
handler.command = ['halloween'];
handler.group = true;
handler.register = true;
handler.cooldown = 31536000000;

export default handler;

function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)];
}
