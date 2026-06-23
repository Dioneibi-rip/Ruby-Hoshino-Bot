
import { delay } from "@whiskeysockets/baileys";

const handler = async (m, { args, usedPrefix, command, conn }) => {
const fa = `${emoji} Por favor, ingresa la cantidad que desea apostar.`.trim();
if (!args[0] || isNaN(args[0]) || parseInt(args[0]) <= 0) throw fa;

const apuesta = parseInt(args[0]);
const users = global.db.getUser(m.sender);
if (apuesta < 100) throw `${emoji2} El minimo para apostar es de 100 XP.`;
if (users.exp < apuesta) {
throw `${emoji2} Tu XP no es suficiente para aportar esa cantidad.`;
}

const emojis = ['💴', '💵', '💶'];
const getRandomEmojis = () => {
const x = Array.from({ length: 3 }, () => emojis[Math.floor(Math.random() * emojis.length)]);
const y = Array.from({ length: 3 }, () => emojis[Math.floor(Math.random() * emojis.length)]);
const z = Array.from({ length: 3 }, () => emojis[Math.floor(Math.random() * emojis.length)]);
return { x, y, z };
};

const initialText = '🎰 | *SLOTS* \n────────\n';
let { key } = await conn.sendMessage(m.chat, { text: initialText }, { quoted: m });

const animateSlots = async () => {
for (let i = 0; i < 5; i++) {
const { x, y, z } = getRandomEmojis();
const animationText = `
🎰 | *SLOTS*
────────
${x[0]} : ${y[0]} : ${z[0]}
${x[1]} : ${y[1]} : ${z[1]}
${x[2]} : ${y[2]} : ${z[2]}
────────`;
await conn.sendMessage(m.chat, { text: animationText, edit: key }, { quoted: m });
await delay(300);
}
};

await animateSlots();

const { x, y, z } = getRandomEmojis();
let end;
if (x[0] === y[0] && y[0] === z[0]) {
end = `${emoji} Ganaste! 🎁 +${apuesta + apuesta} XP.`;
users.exp += apuesta;
} else if (x[0] === y[0] || x[0] === z[0] || y[0] === z[0]) {
end = `${emoji2} Casi lo logras!, sigue intentandolo = *Toma +10 XP*`;
users.exp += 10;
} else {
end = `${emoji4} Perdiste -${apuesta} XP`;
users.exp -= apuesta;
}

const finalResult = `
🎰 | *SLOTS*
────────
${x[0]} : ${y[0]} : ${z[0]}
${x[1]} : ${y[1]} : ${z[1]}
${x[2]} : ${y[2]} : ${z[2]}
────────
🎰 | ${end}`;
await conn.sendMessage(m.chat, { text: finalResult, edit: key }, { quoted: m });
};

handler.help = ['slot <apuesta>'];
handler.tags = ['economy'];
handler.group = true;
handler.register = true
handler.command = ['slot'];
handler.cooldown = 10000;
export default handler;
