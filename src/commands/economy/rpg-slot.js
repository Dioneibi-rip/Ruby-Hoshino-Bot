
import { delay } from "@whiskeysockets/baileys";

const handler = async (m, { args, usedPrefix, command, conn }) => {
const fa = `${emoji} Por favor, ingresa la cantidad que desea apostar.`.trim();
if (!args[0] || !/^\d+$/.test(String(args[0])) || Number.parseInt(args[0], 10) <= 0) throw fa;

const apuesta = Number.parseInt(args[0], 10);
const users = global.db.getUser(m.sender);
if (!Number.isSafeInteger(apuesta) || apuesta < 100) throw `${emoji2} El minimo para apostar es de 100 XP.`;
const maxBet = 50000;
if (apuesta > maxBet) throw `${emoji2} La apuesta máxima es de ${maxBet.toLocaleString()} XP.`;
const saldoXp = Math.max(0, Math.trunc(Number(users.exp) || 0));
if (saldoXp < apuesta) throw `${emoji2} No tienes suficiente XP para apostar.`;
users.exp = saldoXp - apuesta;

const emojis = ['💴', '💵', '💶'];
const forcedWin = Math.random() < 0.35;
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
if (forcedWin) y[0] = x[0], z[0] = x[0];
let end;
if (x[0] === y[0] && y[0] === z[0]) {
const tax = Math.floor(apuesta * 0.08);
const payout = Math.max(0, apuesta * 2 - tax);
end = `${emoji} Ganaste! 🎁 +${payout} XP. Impuesto casino destruido: ${tax} XP.`;
users.exp = Number(users.exp || 0) + payout;
} else if (x[0] === y[0] || x[0] === z[0] || y[0] === z[0]) {
end = `${emoji2} Casi lo logras!, recuperas la mitad de tu apuesta.`;
users.exp = Number(users.exp || 0) + Math.floor(apuesta * 0.5);
} else {
const perdida = apuesta;
end = `${emoji4} Perdiste -${perdida} XP`;
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
handler.cooldownMessage = (seconds, time, hms) => `${emoji2} Debes esperar ${hms} para usar #slot nuevamente.`;

export default handler;
