const handler = async (m, { conn, text, command, usedPrefix, args }) => {
const user = global.db.getUser(m.sender);
const now = Date.now();
const wait = Number(user.wait) || 0;
const time = wait + 10000;

if (now - wait < 10000) throw `${emoji} Tendrás que esperar ${Math.floor((time - now) / 1000)} segundos antes de poder volver a jugar.`;

if (!args[0]) return conn.reply(m.chat, `*PIEDRA 🗿, PAPEL 📄 o TIJERA ✂️*\n\n*—◉ Puedes usar éstos comandos:*\n*◉ ${usedPrefix + command} piedra*\n*◉ ${usedPrefix + command} papel*\n*◉ ${usedPrefix + command} tijera*`, m);

const choices = ['piedra', 'tijera', 'papel'];
const botChoice = choices[Math.floor(Math.random() * choices.length)];
const playerChoice = text.toLowerCase().trim();

if (!choices.includes(playerChoice)) {
return conn.reply(m.chat, `${emoji2} Elige una opción válida: *piedra*, *papel* o *tijera*.`, m);
}

let expDelta = -300;
let resultText = `*${emoji} Tú pierdes! ❌*`;

if (playerChoice === botChoice) {
expDelta = 500;
resultText = `*${emoji2} Empate!*`;
} else if (
(playerChoice === 'piedra' && botChoice === 'tijera') ||
(playerChoice === 'papel' && botChoice === 'piedra') ||
(playerChoice === 'tijera' && botChoice === 'papel')
) {
expDelta = 1000;
resultText = `*${emoji} Tú ganas! 🎉*`;
}

user.exp = Math.max(0, (Number(user.exp) || 0) + expDelta);
user.wait = now;

return m.reply(`${resultText}\n\n*👉🏻 Tu: ${playerChoice}*\n*👉🏻 El Bot: ${botChoice}*\n*${expDelta >= 0 ? '🎁 Premio +' : '❌ Premio '}${expDelta} XP*`);
};
handler.help = ['ppt'];
handler.tags = ['games'];
handler.command = ['ppt'];
handler.group = true;
handler.register = true;
export default handler;
