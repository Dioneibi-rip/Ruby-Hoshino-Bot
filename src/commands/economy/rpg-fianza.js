const MIN_BAIL = 10000;
const BAIL_RATE = 0.20;

const handler = async (m, { conn }) => {
const user = global.db.getUser(m.sender);
if (!user) return false;
user.extras = user.extras && typeof user.extras === 'object' && !Array.isArray(user.extras) ? user.extras : {};
const jailUntil = Number(user.extras.jailUntil || 0);
if (!jailUntil || jailUntil <= Date.now()) {
user.crime = 0;
await global.db.updateUser(m.sender, { crime: 0, extras: { jailUntil: 0 } });
return conn.reply(m.chat, '✅ No estás en la cárcel. No necesitas pagar fianza.', m);
}

const bank = Math.max(0, Number(user.bank || 0));
const bail = Math.max(MIN_BAIL, Math.floor(bank * BAIL_RATE));
if (bank < bail) {
return conn.reply(m.chat, `❌ Fondos insuficientes. Necesitas ${bail.toLocaleString()} en tu banco y solo tienes ${bank.toLocaleString()}. Ve a hacer un retiro o pide que te transfieran.`, m);
}

user.bank = Math.max(0, bank - bail);
user.extras.jailUntil = 0;
user.crime = 0;
await global.db.updateUser(m.sender, { bank: user.bank, crime: 0, extras: { jailUntil: 0 } });
return conn.reply(m.chat, `🔓 Fianza pagada.\n💸 Se destruyeron *${bail.toLocaleString()} ${m.moneda}* de tu banco.\n✅ Ya estás libre.`, m);
};

handler.help = ['fianza'];
handler.tags = ['economy'];
handler.command = ['fianza', 'bail'];
handler.group = true;
handler.register = true;

export default handler;
