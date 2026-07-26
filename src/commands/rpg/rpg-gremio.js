
let handler = async (m, { conn }) => {
let senderId = m.sender;
let user = global.db.getUser(senderId);

const eventos = [
{ nombre: 'Batalla contra los Goblins', tipo: 'victoria', coin: randomNumber(3000, 6000), exp: randomNumber(10, 20), health: 0, mensaje: `🏆 ¡Has derrotado a los Goblins! Al caer, dejaron caer un montón de ${m.moneda}.` },
{ nombre: 'Enfrentamiento con el Orco', tipo: 'derrota', coin: randomNumber(-450, -150), exp: randomNumber(5, 10), health: randomNumber(-15, -5), mensaje: `⚠️ Un Orco te atacó y has perdido salud y monedas en la pelea.` },
{ nombre: 'Desafío del Dragón', tipo: 'victoria', coin: randomNumber(9000, 14000), exp: randomNumber(50, 80), health: 0, mensaje: `🔥 ¡Has vencido al Dragón! Encuentras un tesoro antiguo lleno de ${m.moneda}.` },
{ nombre: 'Confrontación con el Esqueleto', tipo: 'derrota', coin: randomNumber(-300, -150), exp: randomNumber(5, 10), health: randomNumber(-10, -5), mensaje: `💀 Has caído ante un Esqueleto. La batalla fue intensa y perdiste algunas ${m.moneda}.` },
{ nombre: 'Combate contra la Manticora', tipo: 'victoria', coin: randomNumber(7000, 11000), exp: randomNumber(40, 60), health: 0, mensaje: `🦁 Has derrotado a la Manticora. Su pelaje brillaba mientras caía, revelando un tesoro oculto de ${m.moneda}.` },
{ nombre: 'Confrontación con el Troll', tipo: 'derrota', coin: randomNumber(-750, -300), exp: randomNumber(10, 20), health: randomNumber(-20, -10), mensaje: `🧌 Un Troll te atacó. Has perdido salud y algunas ${m.moneda} en la contienda.` },
{ nombre: 'Duelo con el Licántropo', tipo: 'victoria', coin: randomNumber(5500, 9500), exp: randomNumber(3500, 6500), health: 0, mensaje: `🐺 Has derrotado a un Licántropo en una feroz batalla. Ganaste un botín de ${m.moneda}.` },
{ nombre: 'Enfrentamiento con el Minotauro', tipo: 'derrota', coin: randomNumber(-600, -225), exp: randomNumber(10, 20), health: randomNumber(-15, -5), mensaje: `🪓 El Minotauro te ha atacado. Has sufrido daños y perdido algunas ${m.moneda}.` },
{ nombre: 'Batalla contra el Fantasma', tipo: 'victoria', coin: randomNumber(30, 50), exp: randomNumber(20, 40), health: 0, mensaje: `👻 Has conseguido vencer al Fantasma que atormentaba la aldea. Recibes ${m.moneda} como recompensa.` },
{ nombre: 'Lucha contra el Dragón de Hielo', tipo: 'derrota', coin: randomNumber(-900, -300), exp: randomNumber(15, 30), health: randomNumber(-25, -10), mensaje: `❄️ El Dragón de Hielo te ha congelado. Has perdido salud y algunas ${m.moneda}.` },
{ nombre: 'Combate con la Hidra', tipo: 'victoria', coin: randomNumber(8000, 12000), exp: randomNumber(50, 80), health: 0, mensaje: `🐉 Has derrotado a la Hidra y encontrado un tesoro de ${m.moneda}.` },
{ nombre: 'Desafío del Caballero Caído', tipo: 'derrota', coin: randomNumber(-450, -150), exp: randomNumber(5, 10), health: randomNumber(-15, -5), mensaje: `⚔️ Has sido derrotado por el Caballero Caído. Has perdido salud y monedas.` },
{ nombre: 'Encuentro con la Bruja', tipo: 'troll', coin: 0, exp: randomNumber(20, 40), health: randomNumber(-10, -5), mensaje: `🧙 Te encontraste con una bruja que te lanzó un hechizo. Ganas experiencia.` },
{ nombre: 'Emboscada de los Bandidos', tipo: 'troll', coin: 0, exp: randomNumber(15, 30), health: randomNumber(-5, -3), mensaje: `🗡️ Te emboscaron unos bandidos. Aunque lograste escapar, has perdido algo de salud.` },
{ nombre: 'Caza de la Serpiente Gigante', tipo: 'victoria', coin: randomNumber(50, 80), exp: randomNumber(30, 50), health: 0, mensaje: `🐍 Has cazado a la Serpiente Gigante. Su piel es valiosa y obtienes ${m.moneda}.` },
];

let evento = eventos[Math.floor(Math.random() * eventos.length)];

if (evento.tipo === 'victoria') {
user.coin = (Number(user.coin) || 0) + evento.coin;
user.exp += evento.exp;
user.health += evento.health;
} else if (evento.tipo === 'derrota') {
user.coin = (Number(user.coin) || 0) + evento.coin;
user.exp += evento.exp;
user.health -= evento.health;
} else if (evento.tipo === 'troll') {
user.exp += evento.exp;
user.health -= evento.health;
}

let img = 'https://qu.ax/bbfSN.jpg';
let info = `╭━〔 Gremio de Aventureros 〕\n` +
`┃Misión: *${evento.nombre}*\n` +
`┃Evento: ${evento.mensaje}\n` +
`┃Recompensa: ${evento.coin > 0 ? '+' : '-'}${Math.abs(evento.coin)} ${m.moneda} y +${evento.exp} XP.\n` +
`┃Tu salud ${user.health < 0 ? 'bajó en: ' + Math.abs(user.health) : 'se mantuvo igual.'}\n` +
`╰━━━━━━━━━━━━⬣`;

await conn.sendFile(m.chat, img, 'gremio.jpg', info, fkontak);

await global.db.write();
};

handler.tags = ['rpg'];
handler.help = ['gremio'];
handler.command = ['gremio', 'mision'];
handler.register = true;
handler.group = true
handler.cooldown = 600000;

handler.cooldownMessage = (seconds, time, hms) => `⏱️ Ya has cazado recientemente. Espera ⏳ *${hms}* antes de intentar de nuevo.`;

export default handler;

function randomNumber(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}
