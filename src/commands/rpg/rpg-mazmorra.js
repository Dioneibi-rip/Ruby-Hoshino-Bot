
import { applyTalismanIfDead } from '../../library/rpg-talisman.js';

let handler = async (m, { conn }) => {
let senderId = m.sender;
let user = global.db.getUser(senderId);
let level = Number(user.level || 0);

if (level < 10) {
await conn.reply(m.chat, '💀 Los monstruos de la mazmorra te harían pedazos. Alcanza el nivel 10.', m);
return false;
}

const minHealth = 50;
user.health = Math.min(100, Math.max(0, Number(user.health || 0)));
if (user.health < minHealth) {
await conn.reply(m.chat, `💔 Necesitas al menos ${minHealth} de salud para entrar a la mazmorra. Usa el comando .heal para curarte.`, m);
return false;
}

const eventos = [
{ nombre: 'Mazmorras de los Caídos', tipo: 'victoria', coin: randomNumber(9000, 16000), exp: randomNumber(225, 450), health: 0, mensaje: `🏆 Derrotaste al guardián y abriste su cofre.` },
{ nombre: 'Cámara de los Espectros', tipo: 'derrota', coin: randomNumber(-1500, -800), exp: randomNumber(300, 700), health: randomNumber(-15, -5), mensaje: `⚠️ Un espectro te atrapó en sombras.` },
{ nombre: 'Cripta del Olvido', tipo: 'victoria', coin: randomNumber(12000, 20000), exp: randomNumber(300, 550), health: 0, mensaje: `💎 Hallaste un tesoro antiguo.` },
{ nombre: 'Trampa del Laberinto', tipo: 'trampa', coin: 0, exp: randomNumber(700, 1300), health: 0, mensaje: `🚧 Activaste una trampa oculta.` },
{ nombre: 'Cámara de los Demonios', tipo: 'derrota', coin: randomNumber(-2500, -1200), exp: randomNumber(400, 900), health: randomNumber(-30, -20), mensaje: `🐉 Un demonio te emboscó en la oscuridad.` },
{ nombre: 'Santuario de la Luz', tipo: 'victoria', coin: randomNumber(7000, 12000), exp: randomNumber(200, 350), health: 0, mensaje: `🎆 Encontraste un cofre brillante.` },
{ nombre: 'Laberinto de los Perdidos', tipo: 'trampa', coin: 0, exp: randomNumber(900, 1700), health: 0, mensaje: `🌀 Saliste de un laberinto interminable.` },
{ nombre: 'Ruinas de los Caídos', tipo: 'victoria', coin: randomNumber(9000, 16000), exp: randomNumber(375, 650), health: 0, mensaje: `🏺 Descubriste artefactos con valor.` },
{ nombre: 'Guarida del Dragón', tipo: 'derrota', coin: randomNumber(-3000, -1500), exp: randomNumber(500, 1000), health: randomNumber(-30, -20), mensaje: `🔥 Un dragón te lanzó una llamarada.` },
{ nombre: 'Sabio de la Mazmorra', tipo: 'victoria', coin: randomNumber(6000, 10000), exp: randomNumber(250, 500), health: 0, mensaje: `👴 Un sabio te recompensó por escuchar sus historias.` },
];

let evento = { ...eventos[Math.floor(Math.random() * eventos.length)] };
const torchProtected = Number(user.antorcha || 0) > 0 && Number(evento.health || 0) < 0;
if (torchProtected) evento.health = Math.ceil(Number(evento.health || 0) / 2);

user.coin = (Number(user.coin) || 0) + evento.coin;
user.exp = (user.exp || 0) + evento.exp;
user.health = Math.max(0, (user.health || 100) + (evento.health || 0));
await applyTalismanIfDead(m, conn, user, Number(evento.health || 0) < 0);

let info = `╭━〔 Mazmorras Antiguas 〕\n` +
`┃Misión: *${evento.nombre}*\n` +
`┃Evento: ${evento.mensaje}\n` +
`┃Recompensa: ${evento.coin > 0 ? '+' : '-'}${Math.abs(evento.coin)} *${m.moneda}* y +${evento.exp} *XP*.\n` +
`┃Tu salud ${evento.health < 0 ? 'bajó en: ' + Math.abs(evento.health) : 'se mantuvo igual.'}\n` +
`${torchProtected ? '┃🕯️ Tu antorcha redujo el daño a la mitad.\n' : ''}` +
`╰━━━━━━━━━━━━⬣`;

await conn.sendFile(m.chat, 'https://files.catbox.moe/wtyj6h.jpg', 'mazmorras.jpg', info, m);

global.db.write();
};

handler.tags = ['rpg'];
handler.help = ['explorar'];
handler.command = ['dungeon', 'mazmorra', 'cueva'];
handler.register = true;
handler.group = true
handler.cooldown = 480000;

handler.cooldownMessage = (seconds, time, hms) => `⏱️ Ya exploraste la mazmorra recientemente. Espera *${hms}* para volver.`;

export default handler;

function randomNumber(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}
