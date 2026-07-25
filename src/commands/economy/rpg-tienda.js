const SELL_CATALOG = {
piedra: { field: 'stone', label: 'Piedra', price: 5 },
stone: { field: 'stone', label: 'Piedra', price: 5 },
carbon: { field: 'coal', label: 'Carbón', price: 15 },
carbón: { field: 'coal', label: 'Carbón', price: 15 },
coal: { field: 'coal', label: 'Carbón', price: 15 },
hierro: { field: 'iron', label: 'Hierro', price: 40 },
iron: { field: 'iron', label: 'Hierro', price: 40 },
oro: { field: 'gold', label: 'Oro', price: 100 },
gold: { field: 'gold', label: 'Oro', price: 100 },
esmeralda: { field: 'emerald', label: 'Esmeralda', price: 250 },
emerald: { field: 'emerald', label: 'Esmeralda', price: 250 },
diamante: { field: 'diamond', label: 'Diamante', price: 1500 },
diamond: { field: 'diamond', label: 'Diamante', price: 1500 },
diamantes: { field: 'diamond', label: 'Diamante', price: 1500 },
diamonds: { field: 'diamond', label: 'Diamante', price: 1500 },
};

const BUY_CATALOG = {
pocion: { label: 'Poción', coin: 3000, heal: 50 },
poción: { label: 'Poción', coin: 3000, heal: 50 },
pico: { label: 'Pico', coin: 5000, iron: 5, durability: 100 },
talisman: { label: 'Talismán', diamond: 10, field: 'talisman' },
talismán: { label: 'Talismán', diamond: 10, field: 'talisman' },
};

const handler = async (m, { conn, args, usedPrefix, command }) => {
const user = global.db.getUser(m.sender);
if (!user) return false;

const action = normalize(args[0]);
const itemKey = normalize(args[1]);
const quantity = parseQuantity(args[2]);

user.coin = Number(user.coin || 0);
user.diamond = Number(user.diamond || 0);
user.health = Math.min(100, Math.max(0, Number(user.health || 0)));
user.pickaxedurability = Math.min(100, Math.max(0, Number(user.pickaxedurability || 0)));

if (!action || !['comprar', 'vender', 'buy', 'sell'].includes(action)) {
return conn.reply(m.chat, buildHelp(usedPrefix, command, m.moneda), m);
}

if (!itemKey) {
return conn.reply(m.chat, `✦ Indica un objeto. Ejemplo: *${usedPrefix}${command} ${action} pocion 1*`, m);
}

if (action === 'vender' || action === 'sell') {
return sellItem(m, conn, user, itemKey, quantity);
}

return buyItem(m, conn, user, itemKey, quantity);
};

handler.help = ['tienda', 'tienda comprar <item> <cantidad>', 'tienda vender <material> <cantidad>'];
handler.tags = ['economy'];
handler.command = ['tienda', 'shop', 'store'];
handler.group = true;
handler.register = true;

export default handler;

function sellItem(m, conn, user, itemKey, quantity) {
const item = SELL_CATALOG[itemKey];
if (!item) return conn.reply(m.chat, `✘ No compro ese material. Usa *tienda* para ver el catálogo.`, m);

const owned = Number(user[item.field] || 0);
if (owned < quantity) {
return conn.reply(m.chat, `✘ No tienes suficiente *${item.label}*.
Tienes: *${owned}*
Necesitas vender: *${quantity}*`, m);
}

const total = item.price * quantity;
user[item.field] = Math.max(0, owned - quantity);
user.coin = Number(user.coin || 0) + total;

return conn.reply(m.chat, `✅ Venta completada.

✦ Material: *${item.label}*
✦ Cantidad: *${quantity}*
✦ Precio unitario: *${item.price.toLocaleString()} ${m.moneda}*
✦ Total recibido: *${total.toLocaleString()} ${m.moneda}*
✦ Cartera actual: *${Number(user.coin || 0).toLocaleString()} ${m.moneda}*`, m);
}

function buyItem(m, conn, user, itemKey, quantity) {
const item = BUY_CATALOG[itemKey];
if (!item) return conn.reply(m.chat, `✘ Ese objeto no está en venta. Usa *tienda* para ver el catálogo.`, m);

const totalCoin = Number(item.coin || 0) * quantity;
const totalDiamond = Number(item.diamond || 0) * quantity;
const totalIron = Number(item.iron || 0) * quantity;

if (Number(user.coin || 0) < totalCoin) {
return conn.reply(m.chat, `✘ No tienes suficientes *${m.moneda}*.
Necesitas: *${totalCoin.toLocaleString()}*
Tienes: *${Number(user.coin || 0).toLocaleString()}*`, m);
}
if (Number(user.diamond || 0) < totalDiamond) {
return conn.reply(m.chat, `✘ No tienes suficientes *Diamantes*.
Necesitas: *${totalDiamond}*
Tienes: *${Number(user.diamond || 0)}*`, m);
}
if (Number(user.iron || 0) < totalIron) {
return conn.reply(m.chat, `✘ No tienes suficiente *Hierro*.
Necesitas: *${totalIron}*
Tienes: *${Number(user.iron || 0)}*`, m);
}

user.coin = Number(user.coin || 0) - totalCoin;
user.diamond = Number(user.diamond || 0) - totalDiamond;
user.iron = Number(user.iron || 0) - totalIron;

let effect = '';
if (item.heal) {
const before = Number(user.health || 0);
user.health = Math.min(100, before + (item.heal * quantity));
effect = `❤️ Salud: *${before}* → *${user.health}/100*`;
} else if (item.durability) {
user.pickaxedurability = 100;
effect = `⛏️ Durabilidad del pico restaurada a *100/100*`;
} else if (item.field) {
user[item.field] = Number(user[item.field] || 0) + quantity;
effect = `🎐 ${item.label}: *${Number(user[item.field] || 0)}* en inventario`;
}

return conn.reply(m.chat, `✅ Compra completada.

✦ Objeto: *${item.label}*
✦ Cantidad: *${quantity}*
${totalCoin ? `✦ Costo coins: *${totalCoin.toLocaleString()} ${m.moneda}*\n` : ''}${totalDiamond ? `✦ Costo diamantes: *${totalDiamond}*\n` : ''}${totalIron ? `✦ Costo hierro: *${totalIron}*\n` : ''}✦ Efecto: ${effect}`, m);
}

function parseQuantity(value) {
const quantity = Math.floor(Number(value || 1));
return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function normalize(value = '') {
return String(value || '').toLowerCase().trim();
}

function buildHelp(usedPrefix = '!', command = 'tienda', moneda = 'Coins') {
return `╭━〔 🏪 Tienda RPG 〕⬣
┃ Uso:
┃ • *${usedPrefix}${command} comprar pocion 1*
┃ • *${usedPrefix}${command} comprar pico 1*
┃ • *${usedPrefix}${command} vender hierro 10*
┃
┃ Comprar:
┃ • pocion: 3,000 ${moneda} → +50 salud
┃ • pico: 5,000 ${moneda} + 5 hierro → pico 100/100
┃ • talismán: 10 diamantes → seguro de vida
┃
┃ Vender materiales:
┃ • piedra: 5 ${moneda}
┃ • carbon: 15 ${moneda}
┃ • hierro: 40 ${moneda}
┃ • oro: 100 ${moneda}
┃ • esmeralda: 250 ${moneda}
┃ • diamante: 1,500 ${moneda}
╰━━━━━━━━━━━━⬣`;
}
