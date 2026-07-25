export async function applyTalismanIfDead(m, conn, user, tookDamage = true) {
if (!tookDamage || !user || Number(user.health || 0) > 0) return false;

const talismans = Number(user.talisman || 0);
if (talismans <= 0) return false;

user.talisman = Math.max(0, talismans - 1);
user.health = 50;
await conn.reply(m.chat, '🧿 ¡Tu Talismán brilló y se hizo polvo, salvándote de la muerte! Recuperas 50 de salud.', m);
return true;
}
