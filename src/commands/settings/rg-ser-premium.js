const handler = async (m, { conn, text, usedPrefix, command }) => {
const user = global.db.getUser(m.sender);
text = (text || '').toLowerCase().trim();

const plans = {
dia: { duration: 1, cost: 120000, bonusRate: 0.10 },
semana: { duration: 7, cost: 620000, bonusRate: 0.15 },
mes: { duration: 30, cost: 2200000, bonusRate: 0.20 },
};

if (!text || !plans[text]) {
let response = `🎟️ *Planes Premium* 🎟️\n\n`;
for (const plan of Object.keys(plans)) {
const p = plans[plan];
response += `• *${plan.toUpperCase()}* (${p.duration} día(s)) → *¥${p.cost.toLocaleString()} ${m.moneda}*\n`;
}
response += `\n*Beneficios premium:*\n`;
response += `- Mejor cooldown en #rob y #crime\n`;
response += `- Multiplicadores en #daily, #weekly y #mensual\n`;
response += `- Acceso a #premiumbonus cada 8h\n`;
response += `- Mejor rentabilidad en #interes\n\n`;
response += `💡 *¿Cómo comprar?*\n`;
response += `Escribe el comando seguido del plan que deseas. Por ejemplo:\n`;
response += `👉 *${usedPrefix + command} dia*\n`;
response += `👉 *${usedPrefix + command} semana*`;
return conn.reply(m.chat, response, m);
}

const selectedPlan = plans[text];

if (user.premium === true && Number(user.premiumTime || 0) > Date.now()) {
return conn.reply(m.chat, `❌ Ya posees Premium activo. No puedes comprarlo nuevamente hasta que termine tu beneficio actual.`, m);
}

if (Number(user.coin || 0) < selectedPlan.cost) {
return conn.reply(
m.chat,
`❌ Te faltan ${m.moneda}. Necesitas *¥${selectedPlan.cost.toLocaleString()}* y tienes *¥${(user.coin || 0).toLocaleString()}*.`,
m,
);
}

user.coin = Number(user.coin || 0) - selectedPlan.cost;
user.premium = true;

const extraMs = selectedPlan.duration * 24 * 60 * 60 * 1000;
user.premiumTime = (Number(user.premiumTime || 0) > Date.now() ? Number(user.premiumTime || 0) : Date.now()) + extraMs;

const bonusCoins = Math.floor(selectedPlan.cost * selectedPlan.bonusRate);
const bonusExp = selectedPlan.duration * 3000;
const bonusDiamonds = Math.max(8, Math.floor(selectedPlan.duration / 2));
user.coin += bonusCoins;
user.exp = (user.exp || 0) + bonusExp;
user.diamond = (user.diamond || 0) + bonusDiamonds;

const remainingTime = user.premiumTime - Date.now();
const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

conn.reply(
m.chat,
`✅ Compraste *Premium ${text}*.\n\n` +
`🎁 Bonus de compra:\n` +
`• +${bonusCoins.toLocaleString()} ${m.moneda}\n` +
`• +${bonusExp.toLocaleString()} EXP\n` +
`• +${bonusDiamonds} Diamantes\n\n` +
`⏳ Tiempo premium restante: *${days}d ${hours}h*`,
m,
);
};

handler.help = ['comprarpremium [plan]'];
handler.tags = ['premium'];
handler.command = ['comprarpremium', 'premium', 'vip'];
handler.register = true;

export default handler;
