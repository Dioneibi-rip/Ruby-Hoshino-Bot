import { canLevelUp, xpRange } from '../../library/levelling.js';
import { ensureUserRole } from '../uncategorized/_roles.js';
import { resolveInteractionTarget, resolveIdentityName } from '../../core/identity-utils.js';

let handler = async (m, { conn }) => {
let who = await resolveInteractionTarget(m, conn);
let name = await resolveIdentityName(conn, who, { fallback: 'Usuario' });
let user = global.db.getUser(who);

if (!user) {
await conn.sendMessage(m.chat, { text: "❌ No se encontraron datos del usuario." }, { quoted: m });
return false;
}

let { min, xp } = xpRange(user.level, global.multiplier);
let role = ensureUserRole(user);

let before = user.level * 1;
while (canLevelUp(user.level, user.exp, global.multiplier)) user.level++;
role = ensureUserRole(user);

if (before !== user.level) {

let avatar = await conn.profilePictureUrl(who, 'image').catch(_ => 'https://files.catbox.moe/xr2m6u.jpg');
let background = encodeURIComponent('https://i.ibb.co.com/2jMjYXK/IMG-20250103-WA0469.jpg');
let avatarURL = encodeURIComponent(avatar);
let fromLevel = before;
let toLevel = user.level;
let apiURL = `https://api.siputzx.my.id/api/canvas/level-up?backgroundURL=${background}&avatarURL=${avatarURL}&fromLevel=${fromLevel}&toLevel=${toLevel}&name=${encodeURIComponent(name)}`;

await conn.sendFile(m.chat, apiURL, 'levelup.jpg', `
ᥫ᭡ ¡Felicidades, @${who.split('@')[0]}!

✦ Has subido de nivel:
➜ *${fromLevel}* ➔ *${toLevel}* 〔 ${user.role} 〕

🗓️ *Fecha:* ${new Date().toLocaleString('es-DO')}
> *Sigue interactuando para subir más nivel.*
`.trim(), m, false, { mentions: [who] });
} else {
let rank = global.db.userRank?.(who, { field: 'level' }) || 0;
let totalUsers = global.db.countUsers?.() || 0;

let txt = `*「✿」Usuario* ◢ ${name} ◤\n\n`;
txt += `✦ Nivel » *${user.level}*\n`;
txt += `✰ Experiencia » *${user.exp}*\n`;
txt += `❖ Rango » ${role}\n`;
txt += `➨ Progreso » *${user.exp - min} => ${xp}* _(${Math.floor(((user.exp - min) / xp) * 100)}%)_\n`;
txt += `# Puesto » *${rank || '—'}* de *${totalUsers}*\n`;
txt += `❒ Comandos totales » *${user.commands || 0}*`;

await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
}
};

handler.help = ['levelup', 'lvl @user'];
handler.tags = ['rpg'];
handler.command = ['nivel', 'lvl', 'level', 'levelup'];
handler.register = true;
handler.group = true;

export default handler;
