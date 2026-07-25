const handler = async (m, { conn }) => {
const user = global.db.getUser(m.sender);
if (!user) throw `${emoji4} Usuario no encontrado.`;

const img = 'https://files.catbox.moe/qfx5pn.jpg';
const premiumFactor = user.premium ? 1.35 : 1;
const expMin = user.premium ? 300 : 200;
const expMax = user.premium ? 700 : 500;
const coin = Math.floor(((Math.random() * 11000 + 6000) * 0.7) * premiumFactor);
const tokens = Math.floor((Math.random() * 16 + 10) * premiumFactor);
const diamond = Math.floor((Math.random() * 10 + 6) * premiumFactor);
const exp = randomInt(expMin, expMax);

user.coin = (user.coin || 0) + coin;
user.diamond = (user.diamond || 0) + diamond;
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
┃ *${diamond} Diamantes* 💎
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

handler.cooldownMessage = (seconds, time, hms) => `${emoji3} Ya reclamaste tu cofre
⏰️ Regresa en: *${hms}* para volver a reclamar.`;

export default handler;

function randomInt(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}
