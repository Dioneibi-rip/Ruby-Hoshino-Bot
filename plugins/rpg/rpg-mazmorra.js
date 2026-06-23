
let handler = async (m, { conn }) => {
let senderId = m.sender;
let user = global.db.getUser(senderId);


const eventos = [
{ nombre: 'Mazmorras de los Caídos', tipo: 'victoria', coin: randomNumber(18000, 36000), exp: randomNumber(900, 1800), health: 0, mensaje: `🏆 Derrotaste al guardián y abriste su cofre.` },
{ nombre: 'Cámara de los Espectros', tipo: 'derrota', coin: randomNumber(-10000, -6000), exp: randomNumber(300, 700), health: randomNumber(-15, -5), mensaje: `⚠️ Un espectro te atrapó en sombras.` },
{ nombre: 'Cripta del Olvido', tipo: 'victoria', coin: randomNumber(26000, 46000), exp: randomNumber(1200, 2200), health: 0, mensaje: `💎 Hallaste un tesoro antiguo.` },
{ nombre: 'Trampa del Laberinto', tipo: 'trampa', coin: 0, exp: randomNumber(700, 1300), health: 0, mensaje: `🚧 Activaste una trampa oculta.` },
{ nombre: 'Cámara de los Demonios', tipo: 'derrota', coin: randomNumber(-18000, -9000), exp: randomNumber(400, 900), health: randomNumber(-30, -20), mensaje: `🐉 Un demonio te emboscó en la oscuridad.` },
{ nombre: 'Santuario de la Luz', tipo: 'victoria', coin: randomNumber(12000, 26000), exp: randomNumber(800, 1400), health: 0, mensaje: `🎆 Encontraste un cofre brillante.` },
{ nombre: 'Laberinto de los Perdidos', tipo: 'trampa', coin: 0, exp: randomNumber(900, 1700), health: 0, mensaje: `🌀 Saliste de un laberinto interminable.` },
{ nombre: 'Ruinas de los Caídos', tipo: 'victoria', coin: randomNumber(18000, 36000), exp: randomNumber(1500, 2600), health: 0, mensaje: `🏺 Descubriste artefactos con valor.` },
{ nombre: 'Guarida del Dragón', tipo: 'derrota', coin: randomNumber(-24000, -12000), exp: randomNumber(500, 1000), health: randomNumber(-30, -20), mensaje: `🔥 Un dragón te lanzó una llamarada.` },
{ nombre: 'Sabio de la Mazmorra', tipo: 'victoria', coin: randomNumber(9000, 18000), exp: randomNumber(1000, 2000), health: 0, mensaje: `👴 Un sabio te recompensó por escuchar sus historias.` },
];

let evento = eventos[Math.floor(Math.random() * eventos.length)];

user.coin += evento.coin;
user.exp += evento.exp;
user.health = Math.max(0, (user.health || 100) + (evento.health || 0));

let info = `╭━〔 Mazmorras Antiguas 〕\n` +
`┃Misión: *${evento.nombre}*\n` +
`┃Evento: ${evento.mensaje}\n` +
`┃Recompensa: ${evento.coin > 0 ? '+' : '-'}${Math.abs(evento.coin)} *${m.moneda}* y +${evento.exp} *XP*.\n` +
`┃Tu salud ${evento.health < 0 ? 'bajó en: ' + Math.abs(evento.health) : 'se mantuvo igual.'}\n` +
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

export default handler;

function randomNumber(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}
