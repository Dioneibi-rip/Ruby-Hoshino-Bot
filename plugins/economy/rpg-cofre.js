const handler = async (m, { conn }) => {
const user = global.db.getUser(m.sender);
if (!user) throw `${emoji4} Usuario no encontrado.`;

const img = 'https://files.catbox.moe/qfx5pn.jpg';
const premiumFactor = user.premium ? 1.35 : 1;
const coin = Math.floor((Math.random() * 22000 + 12000) * premiumFactor);
const tokens = Math.floor((Math.random() * 16 + 10) * premiumFactor);
const diamonds = Math.floor((Math.random() * 10 + 6) * premiumFactor);
const exp = Math.floor((Math.random() * 9000 + 5000) * premiumFactor);

user.coin = (user.coin || 0) + coin;
user.diamond = (user.diamond || 0) + diamonds;
user.diamonds = (user.diamonds || 0) + diamonds;
user.joincount = (user.joincount || 0) + tokens;
user.exp = (user.exp || 0) + exp;

const texto = `
╭━〔 Cσϝɾҽ Aʅҽαƚσɾισ 〕⬣
┃📦 *Obtienes Un Cofre*
┃ ¡Felicidades!
╰━━━━━━━━━━━━⬣

╭━〔 Nυҽʋσʂ Rҽƈυɾʂσʂ 〕⬣
┃ *${coin.toLocaleString()} ${m.moneda}* 💸
┃ *${tokens} Tokens* ⚜️
┃ *${diamonds} Diamantes* 💎
┃ *${exp.toLocaleString()} Exp* ✨
┃ *Multiplicador premium:* x${premiumFactor} 👑
╰━━━━━━━━━━━━⬣`;

await conn.sendFile(m.chat, img, 'cofre.jpg', texto, fkontak);
};

handler.help = ['cofre'];
handler.tags = ['rpg'];
handler.command = ['cofre'];
handler.level = 5;
handler.group = true;
handler.register = true;
handler.cooldown = 86400000;

export default handler;
