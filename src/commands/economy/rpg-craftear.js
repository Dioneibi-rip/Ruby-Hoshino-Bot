const RECIPES = {
antorcha: {
label: 'Antorcha',
output: 'antorcha',
quantity: 1,
requires: [
{ field: 'stone', label: 'Piedra', amount: 10 },
{ field: 'coal', label: 'Carbón', amount: 5 },
],
},
anillo: {
label: 'Anillo',
output: 'anillo',
quantity: 1,
requires: [
{ field: 'gold', label: 'Oro', amount: 15 },
{ field: 'iron', label: 'Hierro', amount: 5 },
],
},
};

const handler = async (m, { conn, args = [], usedPrefix, command }) => {
const user = global.db.getUser(m.sender);
if (!user) return false;
const key = normalize(args[0]);
if (!key || !RECIPES[key]) return conn.reply(m.chat, buildHelp(usedPrefix, command), m);

const recipe = RECIPES[key];
for (const req of recipe.requires) {
const owned = Number(user[req.field] || 0);
if (owned < req.amount) {
return conn.reply(m.chat, `✘ No tienes materiales suficientes para craftear *${recipe.label}*.\n\nNecesitas: *${req.amount} ${req.label}*\nTienes: *${owned}*`, m);
}
}

const patch = {};
for (const req of recipe.requires) {
user[req.field] = Math.max(0, Number(user[req.field] || 0) - req.amount);
patch[req.field] = user[req.field];
}
user[recipe.output] = Number(user[recipe.output] || 0) + recipe.quantity;
patch[recipe.output] = user[recipe.output];
await global.db.updateUser(m.sender, patch);

return conn.reply(m.chat, `✅ Crafteo completado: *${recipe.label}* x${recipe.quantity}.\n🎒 Ahora tienes: *${user[recipe.output]}*`, m);
};

handler.help = ['craftear <antorcha|anillo>'];
handler.tags = ['economy', 'rpg'];
handler.command = ['craftear', 'craft'];
handler.group = true;
handler.register = true;

export default handler;

function normalize(value = '') {
return String(value || '').toLowerCase().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function buildHelp(usedPrefix = '!', command = 'craftear') {
return `╭━〔 🛠️ Crafteo RPG 〕⬣
┃ Uso:
┃ • *${usedPrefix}${command} antorcha*
┃ • *${usedPrefix}${command} anillo*
┃
┃ Recetas:
┃ • Antorcha: 10 piedra + 5 carbón
┃ • Anillo: 15 oro + 5 hierro
╰━━━━━━━━━━━━⬣`;
}
