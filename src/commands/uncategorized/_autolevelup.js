import { canLevelUp } from '../../library/levelling.js';

let handler = m => m;
handler.before = async function (m) {
const user = global.db.getUser(m.sender);
if (!user) return;

user.level = Number(user.level || 0);
user.exp = Number(user.exp || 0);

const before = user.level * 1;
while (canLevelUp(user.level, user.exp, global.multiplier)) user.level++;

if (before === user.level) return;

const fecha = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date());

m.reply(`*✿ ¡ F E L I C I D A D E S ! ✿*\n\n✰ Nivel Anterior » *${before}*\n✰ Nivel Actual » *${user.level}*\n✦ Fecha » *${fecha}*\n\n> *\`¡Has alcanzado un Nuevo Nivel!\`*\n💡 _Sigue usando comandos para ganar XP y desbloquear nuevas zonas._`);

if (user.level % 5 === 0) {
user.coin = Number(user.coin || 0) + Math.floor(Math.random() * (9 - 6 + 1)) + 6;
user.exp = Number(user.exp || 0) + Math.floor(Math.random() * (10 - 6 + 1)) + 6;
}
};

export default handler;
