const handler = async (m, {conn, text, command, usedPrefix, args}) => {
const pp = 'https://telegra.ph/file/c7924bf0e0d839290cc51.jpg';

const time = global.db.getUser(m.sender).wait + 10000;
if (new Date - global.db.getUser(m.sender).wait < 10000) throw `${emoji} Tendrás que esperar ${Math.floor((time - new Date()) / 1000)} segundos antes de poder volver a jugar.`;

if (!args[0]) return conn.reply(m.chat, `*PIEDRA 🗿, PAPEL 📄 o TIJERA ✂️*\n\n*—◉ Puedes usar éstos comandos:*\n*◉ ${usedPrefix + command} piedra*\n*◉ ${usedPrefix + command} papel*\n*◉ ${usedPrefix + command} tijera*`, m);

let astro = Math.random();
if (astro < 0.34) {
astro = 'piedra';
} else if (astro > 0.34 && astro < 0.67) {
astro = 'tijera';
} else {
astro = 'papel';
}
const textm = text.toLowerCase();
if (textm == astro) {
global.db.getUser(m.sender).exp += 500;
m.reply(`*${emoji2} Empate!*\n\n*👉🏻 Tu: ${textm}*\n*👉🏻 El Bot: ${astro}*\n*🎁 Premio +500 XP*`);
} else if (text == 'papel') {
if (astro == 'piedra') {
global.db.getUser(m.sender).exp += 1000;
m.reply(`*${emoji} Tú ganas! 🎉*\n\n*👉🏻 Tu: ${textm}*\n*👉🏻 El Bot: ${astro}*\n*🎁 Premio +1000 XP*`);
} else {
global.db.getUser(m.sender).exp -= 300;
m.reply(`*💀 Tú pierdes! ❌*\n\n*👉🏻 Tu: ${textm}*\n*👉🏻 El Bot: ${astro}*\n*❌ Premio -300 XP*`);
}
} else if (text == 'tijera') {
if (astro == 'papel') {
global.db.getUser(m.sender).exp += 1000;
m.reply(`*${emoji} Tú ganas! 🎉*\n\n*👉🏻 Tu: ${textm}*\n*👉🏻 El Bot: ${astro}*\n*🎁 Premio +1000 XP*`);
} else {
global.db.getUser(m.sender).exp -= 300;
m.reply(`*☠️ Tú pierdes! ❌*\n\n*👉🏻 Tu: ${textm}*\n*👉🏻 El Bot: ${astro}*\n*❌ Premio -300 XP*`);
}
} else if (textm == 'tijera') {
if (astro == 'papel') {
global.db.getUser(m.sender).exp += 1000;
m.reply(`*${emoji} Tú ganas! 🎉*\n\n*👉🏻 Tu: ${textm}*\n*👉🏻 El Bot: ${astro}*\n*🎁 Premio +1000 XP*`);
} else {
global.db.getUser(m.sender).exp -= 300;
m.reply(`*☠️ Tú pierdes! ❌*\n\n*👉🏻 Tu: ${textm}*\n*👉🏻 El Bot: ${astro}*\n*❌ Premio -300 XP*`);
}
} else if (textm == 'papel') {
if (astro == 'piedra') {
global.db.getUser(m.sender).exp += 1000;
m.reply(`*${emoji} Tú ganas! 🎉*\n\n*👉🏻 Tu: ${textm}*\n*👉🏻 El Bot: ${astro}*\n*🎁 Premio +1000 XP*`);
} else {
global.db.getUser(m.sender).exp -= 300;
m.reply(`*☠️ Tú pierdes! ❌*\n\n*👉🏻 Tu: ${textm}*\n*👉🏻 El Bot: ${astro}*\n*❌ Premio -300 XP*`);
}
} else if (textm == 'piedra') {
if (astro == 'tijera') {
global.db.getUser(m.sender).exp += 1000;
m.reply(`*${emoji} Tú ganas! 🎉*\n\n*👉🏻 Tu: ${textm}*\n*👉🏻 El Bot: ${astro}*\n*🎁 Premio +1000 XP*`);
} else {
global.db.getUser(m.sender).exp -= 300;
m.reply(`*${emoji} Tú pierdes! ❌*\n\n*👉🏻 Tu: ${textm}*\n*👉🏻 El Bot: ${astro}*\n*❌ Premio -300 XP*`);
}
}
global.db.getUser(m.sender).wait = new Date * 1;
};
handler.help = ['ppt'];
handler.tags = ['games'];
handler.command = ['ppt'];
handler.group = true;
handler.register = true;

export default handler;
