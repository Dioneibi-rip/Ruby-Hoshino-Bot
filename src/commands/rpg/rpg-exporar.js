
import { applyTalismanIfDead } from '../../library/rpg-talisman.js'

let handler = async (m, { conn }) => {
let senderId = m.sender
let user = global.db.getUser(senderId)
let level = Number(user.level || 0)

if (level < 5) {
await conn.reply(m.chat, '🌲 El bosque es muy peligroso para un novato. Alcanza el nivel 5 para explorar.', m)
return false
}

const minHealth = 35
user.health = Math.min(100, Math.max(0, Number(user.health || 0)))
if (user.health < minHealth) {
await conn.reply(m.chat, `💔 Necesitas al menos ${minHealth} de salud para continuar. Usa el comando .heal para curarte.`, m)
return false
}

const eventos = [
{ nombre: '🌲 Tesoro bajo el Árbol Sagrado', coin: 18000, exp: 450, health: 0, mensaje: `¡Descubriste un cofre antiguo lleno de ${m.moneda}!` },
{ nombre: '🐺 Ataque de Lobos Hambrientos', coin: -1800, exp: 700, health: -25, mensaje: `¡Fuiste atacado por una manada y escapaste perdiendo ${m.moneda}!` },
{ nombre: '🔮 Encuentro con una Hechicera', coin: 12000, exp: 350, health: +10, mensaje: 'Una hechicera te bendijo con riquezas y experiencia.' },
{ nombre: '☠️ Trampa Mortal de los Duendes', coin: -2500, exp: 600, health: -30, mensaje: 'Caíste en una trampa y perdiste gran parte del botín.' },
{ nombre: '🏹 Cazador Errante', coin: 9500, exp: 275, health: 0, mensaje: 'Un cazador te regaló provisiones por ayudarlo.' },
{ nombre: '💎 Piedra Épica del Alma', coin: 30000, exp: 625, health: 0, mensaje: `¡Una piedra mágica explotó en riqueza de ${m.moneda}!` },
{ nombre: '🌿 Curandera del Bosque', coin: 5000, exp: 225, health: +30, mensaje: 'Una mujer misteriosa sanó tus heridas con magia natural.' },
{ nombre: '🪙 Mercader Ambulante', coin: 15000, exp: 325, health: 0, mensaje: 'Vendiste objetos recolectados y ganaste buenas monedas.' },
{ nombre: '🧌 Troll del Puente', coin: -1600, exp: 500, health: -15, mensaje: 'El troll te cobró peaje... a golpes.' },
{ nombre: '🗺️ Mapa de un Explorador Perdido', coin: 21000, exp: 425, health: 0, mensaje: 'Encontraste un mapa secreto con una gran recompensa.' },
{ nombre: '🌀 Portal Dimensional', coin: 0, exp: 1600, health: -10, mensaje: 'Entraste a otro mundo y regresaste con sabiduría, pero debilitado.' },
]

let evento = eventos[Math.floor(Math.random() * eventos.length)]

user.coin = (Number(user.coin) || 0) + evento.coin
user.exp = (user.exp || 0) + evento.exp
user.health = Math.max(0, (user.health || 100) + evento.health)
await applyTalismanIfDead(m, conn, user, Number(evento.health || 0) < 0)

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

handler.cooldownMessage = (seconds, time, hms) => `⏱️ Ya exploraste recientemente. Espera *${hms}* para volver al bosque.`;

export default handler
