const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_DAYS = 30
const PER_PAGE = 10

const normalizeJid = jid => typeof jid === 'string' ? jid.split(':')[0] : jid

const dayKey = time => new Date(time).toISOString().slice(0, 10)

const getDaysToCount = days => {
  const now = Date.now()
  const keys = new Set()
  for (let i = 0; i < days; i++) keys.add(dayKey(now - (i * DAY_MS)))
  return keys
}

const parsePositiveInt = value => {
  const number = Number.parseInt(value, 10)
  return Number.isFinite(number) && number > 0 ? number : null
}

let handler = async (m, { conn, args, usedPrefix, participants }) => {
  const first = parsePositiveInt(args[0])
  const second = parsePositiveInt(args[1])
  const days = second ? Math.min(first || DEFAULT_DAYS, 45) : DEFAULT_DAYS
  const page = Math.max(second || first || 1, 1)

  const chat = global.db.getChat(m.chat) || {}
  const stats = chat.messageStats?.users || {}
  const validDays = getDaysToCount(days)
  const participantIds = new Set((participants || []).map(p => normalizeJid(p.id || p.jid)).filter(Boolean))

  const ranking = Object.entries(stats).map(([jid, user]) => {
    let messages = 0
    let commands = 0
    for (const [date, bucket] of Object.entries(user?.days || {})) {
      if (!validDays.has(date)) continue
      messages += Number(bucket.messages) || 0
      commands += Number(bucket.commands) || 0
    }
    return {
      jid: normalizeJid(jid),
      name: user?.name || jid.split('@')[0],
      messages,
      commands,
      active: participantIds.size ? participantIds.has(normalizeJid(jid)) : true
    }
  }).filter(user => user.messages > 0 && user.active)
    .sort((a, b) => (b.messages - a.messages) || (b.commands - a.commands))

  if (!ranking.length) {
    return m.reply(`❀ Aún no tengo mensajes registrados en este grupo.\n\n> Escribe un poco más y vuelve a usar *${usedPrefix}topmensajes*.`)
  }

  const totalPages = Math.max(Math.ceil(ranking.length / PER_PAGE), 1)
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PER_PAGE
  const pageItems = ranking.slice(start, start + PER_PAGE)

  const lines = [`❀ Top de mensajes en los últimos *${days}* días`, '']
  for (const [index, user] of pageItems.entries()) {
    let name = user.name
    try { name = await conn.getName(user.jid) || name } catch (e) {}
    lines.push(`*${start + index + 1}.* ${name}`)
    lines.push(`   » Mensajes: \`${user.messages}\`, Comandos: \`${user.commands}\``)
  }

  lines.push('')
  if (safePage < totalPages) {
    lines.push(`> Para ver la siguiente página › *${usedPrefix}topmensajes ${safePage + 1}*`)
  } else if (totalPages > 1) {
    lines.push(`> Para volver a la primera página › *${usedPrefix}topmensajes 1*`)
  }
  lines.push(`> Página *${safePage}/${totalPages}* · Total registrado: *${ranking.length}* miembros`)

  await conn.sendMessage(m.chat, { text: lines.join('\n'), mentions: pageItems.map(user => user.jid) }, { quoted: m })
}

handler.help = ['topmensajes [página]', 'topmensajes [días] [página]']
handler.tags = ['group']
handler.command = ['topmensajes', 'topmsg', 'topmsgs', 'rankingmensajes', 'mensajesgrupo', 'topactividad', 'actividadgrupo']
handler.group = true

export default handler
