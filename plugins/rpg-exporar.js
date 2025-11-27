let cooldowns = {}

let handler = async (m, { conn, text, command }) => {
  let users = global.db.data.users
  let senderId = m.sender

  let tiempoEspera = 5 * 60

  if (cooldowns[m.sender] && Date.now() - cooldowns[m.sender] < tiempoEspera * 1000) {
    let tiempoRestante = segundosAHMS(Math.ceil((cooldowns[m.sender] + tiempoEspera * 1000 - Date.now()) / 1000))
    m.reply(`${emoji} Ya exploraste el bosque recientemente.\n⏳ Espera *${tiempoRestante}* antes de aventurarte de nuevo.`)
    return
  }

  cooldowns[m.sender] = Date.now()

  if (!users[senderId]) users[senderId] = { health: 100, coin: 0, exp: 0 }

  const eventos = [
    { nombre: '🌲 Tesoro bajo el Árbol Sagrado', coin: 15000, exp: 120, health: 0, mensaje: `¡Descubriste un cofre antiguo lleno de ${m.moneda}!` },
    { nombre: '🐺 Ataque de Lobos Hambrientos', coin: -8000, exp: 40, health: -25, mensaje: `¡Fuiste atacado por una manada y escapaste perdiendo valiosas ${m.moneda}!` },
    { nombre: '🔮 Encuentro con una Hechicera', coin: 8000, exp: 60, health: +10, mensaje: 'Una hechicera te bendijo con riquezas y experiencia.' },
    { nombre: '☠️ Trampa Mortal de los Duendes', coin: -12000, exp: 20, health: -30, mensaje: 'Caíste en una trampa y perdiste casi todo tu botín.' },
    { nombre: '🏹 Cazador Errante', coin: 6000, exp: 50, health: 0, mensaje: 'Un cazador te regaló provisiones por ayudarlo.' },
    { nombre: '💎 Piedra Épica del Alma', coin: 30000, exp: 150, health: 0, mensaje: `¡Una piedra mágica explotó en riqueza de ${m.moneda}!` },
    { nombre: '🦴 Huesos Mágicos', coin: 4000, exp: 40, health: +5, mensaje: 'Unos huesos antiguos brillaron y te otorgaron fortuna.' },
    { nombre: '🕳️ Foso sin Fondo', coin: -10000, exp: 0, health: -40, mensaje: 'Resbalaste y caíste perdiendo buena parte de tu botín.' },
    { nombre: '🌿 Curandera del Bosque', coin: 0, exp: 60, health: +30, mensaje: 'Una mujer misteriosa sanó tus heridas con magia natural.' },
    { nombre: '🪙 Mercader Ambulante', coin: 10000, exp: 70, health: 0, mensaje: 'Vendiste objetos recolectados y ganaste buenas monedas.' },
    { nombre: '🧌 Troll del Puente', coin: -6000, exp: 20, health: -15, mensaje: 'El troll te cobró peaje... a golpes.' },
    { nombre: '🐾 Mascota Salvaje', coin: 3000, exp: 40, health: +10, mensaje: 'Adoptaste una criatura del bosque, ella te recompensó.' },
    { nombre: '🗺️ Mapa de un Explorador Perdido', coin: 17000, exp: 90, health: 0, mensaje: 'Encontraste un mapa secreto con una gran recompensa.' },
    { nombre: '🦉 Lechuza Mensajera', coin: 0, exp: 30, health: 0, mensaje: 'Recibiste noticias, pero nada de valor.' },
    { nombre: '⚡ Árbol Maldito', coin: -5000, exp: 10, health: -20, mensaje: 'Un rayo te lanzó por acercarte a un árbol extraño.' },
    { nombre: '🧝 Hada Curiosa', coin: 4500, exp: 50, health: +15, mensaje: 'Una hada te bendijo por ser amable.' },
    { nombre: '🪓 Leñador Misterioso', coin: 7000, exp: 45, health: 0, mensaje: 'Cortaste madera junto a él y te pagó muy bien.' },
    { nombre: '🪦 Cementerio Escondido', coin: -8000, exp: 10, health: -25, mensaje: 'Profanaste un sitio maldito y sufriste la consecuencia.' },
    { nombre: '🌀 Portal Dimensional', coin: 0, exp: 100, health: -10, mensaje: 'Entraste a otro mundo y regresaste con sabiduría, pero debilitado.' },
    { nombre: '🐸 Rana Parlante', coin: 9000, exp: 40, health: +10, mensaje: 'Te dio un acertijo... y su recompensa.' }
  ]

  let evento = eventos[Math.floor(Math.random() * eventos.length)]

  users[senderId].coin += evento.coin
  users[senderId].exp += evento.exp
  users[senderId].health += evento.health

  let img = 'https://files.catbox.moe/357gtl.jpg'
  let info = `╭─「 *🌲 Exploración del Bosque Mágico* 」─
│ ✦ Misión: *${evento.nombre}*
│ ✦ Evento: ${evento.mensaje}
│ ✦ Recompensa: ${evento.coin >= 0 ? `+¥${evento.coin.toLocaleString()} ${m.moneda}` : `-¥${Math.abs(evento.coin).toLocaleString()} ${m.moneda}`}
│ ✦ Exp: +${evento.exp} XP
│ ✦ Salud: ${evento.health >= 0 ? `+${evento.health}` : `-${Math.abs(evento.health)}`} ❤️
╰─────────────────────────`

  await conn.sendFile(m.chat, img, 'exploracion.jpg', info, fkontak)
  global.db.write()
}

handler.tags = ['rpg']
handler.help = ['explorar']
handler.command = ['explorar', 'bosque']
handler.register = true
handler.group = true

export default handler

function segundosAHMS(segundos) {
  let minutos = Math.floor(segundos / 60)
  let segundosRestantes = segundos % 60
  return `${minutos} minutos y ${segundosRestantes} segundos`
}