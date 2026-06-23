
let handler = async (m, { conn }) => {
let senderId = m.sender
let user = global.db.getUser(senderId)


const eventos = [
{ nombre: '🌲 Tesoro bajo el Árbol Sagrado', coin: 45000, exp: 1800, health: 0, mensaje: `¡Descubriste un cofre antiguo lleno de ${m.moneda}!` },
{ nombre: '🐺 Ataque de Lobos Hambrientos', coin: -15000, exp: 700, health: -25, mensaje: `¡Fuiste atacado por una manada y escapaste perdiendo ${m.moneda}!` },
{ nombre: '🔮 Encuentro con una Hechicera', coin: 28000, exp: 1400, health: +10, mensaje: 'Una hechicera te bendijo con riquezas y experiencia.' },
{ nombre: '☠️ Trampa Mortal de los Duendes', coin: -22000, exp: 600, health: -30, mensaje: 'Caíste en una trampa y perdiste gran parte del botín.' },
{ nombre: '🏹 Cazador Errante', coin: 22000, exp: 1100, health: 0, mensaje: 'Un cazador te regaló provisiones por ayudarlo.' },
{ nombre: '💎 Piedra Épica del Alma', coin: 90000, exp: 2500, health: 0, mensaje: `¡Una piedra mágica explotó en riqueza de ${m.moneda}!` },
{ nombre: '🌿 Curandera del Bosque', coin: 5000, exp: 900, health: +30, mensaje: 'Una mujer misteriosa sanó tus heridas con magia natural.' },
{ nombre: '🪙 Mercader Ambulante', coin: 36000, exp: 1300, health: 0, mensaje: 'Vendiste objetos recolectados y ganaste buenas monedas.' },
{ nombre: '🧌 Troll del Puente', coin: -14000, exp: 500, health: -15, mensaje: 'El troll te cobró peaje... a golpes.' },
{ nombre: '🗺️ Mapa de un Explorador Perdido', coin: 52000, exp: 1700, health: 0, mensaje: 'Encontraste un mapa secreto con una gran recompensa.' },
{ nombre: '🌀 Portal Dimensional', coin: 0, exp: 1600, health: -10, mensaje: 'Entraste a otro mundo y regresaste con sabiduría, pero debilitado.' },
]

let evento = eventos[Math.floor(Math.random() * eventos.length)]

user.coin += evento.coin
user.exp += evento.exp
user.health = Math.max(0, (user.health || 100) + evento.health)

let info = `╭─「 *🌲 Exploración del Bosque Mágico* 」─
│ ✦ Misión: *${evento.nombre}*
│ ✦ Evento: ${evento.mensaje}
│ ✦ Recompensa: ${evento.coin >= 0 ? `+¥${evento.coin.toLocaleString()} ${m.moneda}` : `-¥${Math.abs(evento.coin).toLocaleString()} ${m.moneda}`}
│ ✦ Exp: +${evento.exp} XP
│ ✦ Salud: ${evento.health >= 0 ? `+${evento.health}` : `-${Math.abs(evento.health)}`} ❤️
╰─────────────────────────`

await conn.sendFile(m.chat, 'https://files.catbox.moe/357gtl.jpg', 'exploracion.jpg', info, fkontak)
global.db.write()
}

handler.tags = ['rpg']
handler.help = ['explorar']
handler.command = ['explorar', 'bosque']
handler.register = true
handler.group = true
handler.cooldown = 600000

export default handler
