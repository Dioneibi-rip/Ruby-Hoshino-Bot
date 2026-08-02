const handler = async (m, { conn, command, text }) => {
const action = getAction(command, text);
if (action === 'regalo') return abrirRegalo(m, conn);
if (action === 'dulce') return comerDulce(m, conn);
return false;
};

handler.before = async function (m, { conn }) {
const body = String(m.text || '').trim().toLowerCase();
if (/^[#!./]abrir\s+regalo\b/.test(body)) {
m.__pluginHalt = true;
return abrirRegalo(m, conn);
}
if (/^[#!./]comer\s+dulce\b/.test(body)) {
m.__pluginHalt = true;
return comerDulce(m, conn);
}
return false;
};

handler.help = ['abrir regalo', 'comer dulce'];
handler.tags = ['rpg'];
handler.command = ['abrirregalo', 'openregalo', 'opengift', 'comerdulce', 'eatcandy'];
handler.group = true;
handler.register = true;

export default handler;

function getAction(command = '', text = '') {
const normalizedCommand = String(command || '').toLowerCase().trim();
const normalizedText = String(text || '').toLowerCase().trim();
if (['abrirregalo', 'openregalo', 'opengift'].includes(normalizedCommand)) return 'regalo';
if (['comerdulce', 'eatcandy'].includes(normalizedCommand)) return 'dulce';
if (normalizedCommand === 'abrir' && normalizedText.startsWith('regalo')) return 'regalo';
if (normalizedCommand === 'comer' && normalizedText.startsWith('dulce')) return 'dulce';
return '';
}

function abrirRegalo(m, conn) {
const user = global.db.getUser(m.sender);
if (!user) return false;

const gifts = Number(user.gifts || user.regalos || 0);
if (gifts <= 0) return conn.reply(m.chat, '🎁 No tienes regalos para abrir.', m);

const coins = randomNumber(2000, 5000);
const diamonds = randomNumber(1, 3);
user.gifts = Math.max(0, gifts - 1);
user.regalos = Number(user.regalos || 0) > 0 ? Math.max(0, Number(user.regalos || 0) - 1) : user.regalos;
user.coin = Number(user.coin || 0) + coins;
user.diamond = Number(user.diamond || 0) + diamonds;

return conn.reply(m.chat, `🎁 Abriste un regalo y encontraste:\n\n✦ ${m.moneda}: *+${coins.toLocaleString()}*\n✦ Diamantes: *+${diamonds}*\n✦ Regalos restantes: *${Number(user.gifts || 0)}*`, m);
}

function comerDulce(m, conn) {
const user = global.db.getUser(m.sender);
if (!user) return false;

const candies = Number(user.candies || user.dulces || 0);
if (candies <= 0) return conn.reply(m.chat, '🍬 No tienes dulces para comer.', m);

const before = Math.min(100, Math.max(0, Number(user.health || 0)));
user.candies = Math.max(0, candies - 1);
user.dulces = Number(user.dulces || 0) > 0 ? Math.max(0, Number(user.dulces || 0) - 1) : user.dulces;
user.health = Math.min(100, before + 15);

return conn.reply(m.chat, `🍬 Comiste un dulce y recuperaste energía.\n\n❤️ Salud: *${before}* → *${user.health}/100*\n🍬 Dulces restantes: *${Number(user.candies || 0)}*`, m);
}

function randomNumber(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}
