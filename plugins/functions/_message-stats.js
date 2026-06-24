const DAY_MS = 24 * 60 * 60 * 1000
const MAX_DAYS_TO_KEEP = 45

const normalizeJid = jid => typeof jid === 'string' ? jid.split(':')[0] : jid

const getDayKey = (time = Date.now()) => {
  const date = new Date(time)
  return date.toISOString().slice(0, 10)
}

const normalizePrefixList = prefix => {
  if (Array.isArray(prefix)) return prefix
  if (prefix instanceof RegExp) return [prefix]
  if (typeof prefix === 'string') return [prefix]
  return ['#', '.', '/', '!']
}

const isCommandMessage = (text, conn) => {
  if (!text || typeof text !== 'string') return false
  const prefixes = normalizePrefixList(conn?.prefix || global.prefix)
  return prefixes.some(prefix => {
    if (prefix instanceof RegExp) return prefix.test(text)
    return text.startsWith(prefix)
  })
}

const pruneOldDays = (users, now = Date.now()) => {
  const minTime = now - (MAX_DAYS_TO_KEEP * DAY_MS)
  for (const user of Object.values(users)) {
    if (!user || typeof user !== 'object' || !user.days) continue
    for (const day of Object.keys(user.days)) {
      const dayTime = new Date(`${day}T00:00:00.000Z`).getTime()
      if (!Number.isFinite(dayTime) || dayTime < minTime) delete user.days[day]
    }
  }
}

let handler = m => m

handler.before = async function (m) {
  if (!m?.isGroup || !m.sender || m.fromMe || m._messageStatsCounted) return false
  m._messageStatsCounted = true

  const chat = global.db.getChat(m.chat)
  chat.messageStats = chat.messageStats && typeof chat.messageStats === 'object' ? chat.messageStats : {}
  chat.messageStats.users = chat.messageStats.users && typeof chat.messageStats.users === 'object' ? chat.messageStats.users : {}

  const sender = normalizeJid(m.sender)
  const now = Date.now()
  const day = getDayKey(now)
  const users = chat.messageStats.users
  const user = users[sender] || (users[sender] = { name: '', days: {} })
  const bucket = user.days[day] || (user.days[day] = { messages: 0, commands: 0 })

  user.name = m.name || m.pushName || user.name || sender.split('@')[0]
  user.lastSeen = now
  bucket.messages += 1
  if (isCommandMessage(m.text, this)) bucket.commands += 1

  chat.messageStats.updatedAt = now
  chat.messageStats.keepDays = MAX_DAYS_TO_KEEP
  pruneOldDays(users, now)
  global.db.updateChat(m.chat, { messageStats: chat.messageStats })

  return false
}

export default handler
