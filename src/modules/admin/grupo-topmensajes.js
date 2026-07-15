import { areJidsSameUser } from '@whiskeysockets/baileys'

const PER_PAGE = 10
const RANGE_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

const normalizeJid = jid => typeof jid === 'string' ? jid.split(':')[0] : jid

const parsePositiveInt = value => {
const number = Number.parseInt(value, 10)
return Number.isFinite(number) && number > 0 ? number : null
}

const isBotJid = (jid, conn) => {
const normalized = normalizeJid(jid)
if (!normalized) return false
const botJids = [conn?.user?.jid, conn?.user?.id, conn?.authState?.creds?.me?.jid, conn?.authState?.creds?.me?.id]
.map(value => normalizeJid(conn?.decodeJid?.(value) || value))
.filter(Boolean)
return botJids.some(bot => areJidsSameUser(bot, normalized) || bot === normalized)
}

const dayTime = day => new Date(`${day}T00:00:00.000Z`).getTime()

const isRecentDay = (day, now = Date.now()) => {
const time = dayTime(day)
return Number.isFinite(time) && time >= now - ((RANGE_DAYS - 1) * DAY_MS)
}

const sumRecentStats = (statsUser, now = Date.now()) => {
const totals = { messages: 0, commands: 0 }
if (!statsUser?.days || typeof statsUser.days !== 'object') return totals
for (const [day, bucket] of Object.entries(statsUser.days)) {
if (!isRecentDay(day, now)) continue
totals.messages += Number(bucket?.messages) || 0
totals.commands += Number(bucket?.commands) || 0
}
return totals
}

const mergeTotals = (target, source) => {
target.messages += Number(source?.messages) || 0
target.commands += Number(source?.commands) || 0
return target
}

const buildRanking = (chat, conn) => {
const now = Date.now()
const chatUsers = chat.users && typeof chat.users === 'object' ? chat.users : {}
const statsUsers = chat.messageStats?.users && typeof chat.messageStats.users === 'object' ? chat.messageStats.users : {}
const totalsByJid = new Map()

for (const [jid, statsUser] of Object.entries(statsUsers)) {
const normalized = normalizeJid(jid)
if (!normalized || isBotJid(normalized, conn)) continue
const totals = sumRecentStats(statsUser, now)
if (totals.messages <= 0 && totals.commands <= 0) continue
const current = totalsByJid.get(normalized) || { jid: normalized, name: statsUser?.name || '', messages: 0, commands: 0 }
if (!current.name && statsUser?.name) current.name = statsUser.name
mergeTotals(current, totals)
totalsByJid.set(normalized, current)
}

for (const [jid, localUser] of Object.entries(chatUsers)) {
const normalized = normalizeJid(jid)
if (!normalized || isBotJid(normalized, conn)) continue
const lastMsg = Number(localUser?.lastMsg) || 0
if (lastMsg && lastMsg < now - (RANGE_DAYS * DAY_MS)) continue
const legacyMessages = Number(localUser?.msgCount) || 0
if (!legacyMessages) continue
if (totalsByJid.has(normalized)) continue
const name = localUser?.name || ''
totalsByJid.set(normalized, { jid: normalized, name, messages: legacyMessages, commands: 0 })
}

return [...totalsByJid.values()]
.filter(user => user.messages > 0 || user.commands > 0)
.sort((a, b) => (b.messages - a.messages) || (b.commands - a.commands))
}

let handler = async (m, { conn, args, usedPrefix }) => {
const page = Math.max(parsePositiveInt(args[0]) || 1, 1)
const offset = (page - 1) * PER_PAGE
const chat = global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat] || {}
const ranking = buildRanking(chat, conn)
const pageItems = ranking.slice(offset, offset + PER_PAGE)

if (!pageItems.length) {
return m.reply(`❀ Aún no tengo mensajes registrados de usuarios en los últimos *${RANGE_DAYS}* días.

> Escribe un poco más y vuelve a usar *${usedPrefix}topmensajes*.`)
}

const lines = [`❀ Top de mensajes de los últimos *${RANGE_DAYS}* días`, '']
for (const [index, user] of pageItems.entries()) {
let name = user.name || user.jid.split('@')[0]
try { name = await conn.getName(user.jid) || name } catch {}
lines.push(`*#${offset + index + 1} » ${name}*`)
lines.push(`		» Mensajes: \`${user.messages}\`, Comandos: \`${user.commands}\``)
}

lines.push('')
if (ranking.length > offset + PER_PAGE) lines.push(`> Para ver la siguiente página › *${usedPrefix}topmensajes ${page + 1}*`)
if (page > 1) lines.push(`> Para volver a la primera página › *${usedPrefix}topmensajes 1*`)
lines.push(`> Página *${page}*`)

await conn.sendMessage(m.chat, { text: lines.join('\n'), mentions: pageItems.map(user => user.jid) }, { quoted: m })
}

handler.help = ['topmensajes [página]']
handler.tags = ['group']
handler.command = ['topmensajes', 'topmsg', 'topmsgs', 'rankingmensajes', 'mensajesgrupo', 'topactividad', 'actividadgrupo']
handler.group = true

export default handler
