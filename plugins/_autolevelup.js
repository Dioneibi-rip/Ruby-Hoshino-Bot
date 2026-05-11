import { canLevelUp } from '../lib/levelling.js';

let handler = m => m;
handler.before = async function (m) {
    const chat = global.db.data.chats[m.chat];
    if (!chat?.autolevelup) return;

    const user = global.db.data.users[m.sender];
    if (!user) return;

    const before = user.level * 1;
    while (canLevelUp(user.level, user.exp, global.multiplier)) user.level++;

    if (before === user.level) return;

    m.reply(`*✿ ¡ F E L I C I D A D E S ! ✿*\n\n✰ Nivel Anterior » *${before}*\n✰ Nivel Actual » *${user.level}*\n✦ Fecha » *${moment.tz('America/Bogota').format('DD/MM/YY')}*\n\n> *\`¡Has alcanzado un Nuevo Nivel!\`*`);

    if (user.level % 5 === 0) {
        user.coin += Math.floor(Math.random() * (9 - 6 + 1)) + 6;
        user.exp += Math.floor(Math.random() * (10 - 6 + 1)) + 6;
    }
};

export default handler;
