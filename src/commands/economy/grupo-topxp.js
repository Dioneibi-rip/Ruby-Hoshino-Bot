import { resolveIdentityName } from '../../core/identity-utils.js'
import { aggregateEconomyRows } from '../../core/economy-identity.js'

const PER_PAGE = 10

let handler = async (m, { conn, args }) => {
const requestedPage = Number.parseInt(args[0], 10)
const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
const startIndex = (page - 1) * PER_PAGE
const totalUsers = Number(global.db.countUsers?.()) || 0
const totalPages = Math.max(1, Math.ceil(totalUsers / PER_PAGE))

const rawRows = global.db.getTopUsers?.({ field: 'exp', limit: PER_PAGE, offset: startIndex })
|| global.db.topUsers?.({ field: 'exp', limit: PER_PAGE, offset: startIndex })
|| []

// Se colapsan las filas partidas entre telefono y `@lid` antes de mostrarlas, y se
// castean los numeros: `u.exp.toLocaleString()` crasheaba cuando la columna venia NULL.
const users = aggregateEconomyRows(rawRows)
.map(row => ({ jid: row.id, exp: Number(row.exp) || 0, level: Number(row.level) || 0 }))
.filter(row => row.jid && row.exp > 0)
.sort((a, b) => b.exp - a.exp || String(a.jid).localeCompare(String(b.jid)))

if (!users.length) return conn.reply(m.chat, '✰ Aún no hay usuarios con experiencia registrada.', m)

const names = await Promise.all(users.map(async row => {
const fallback = String(row.jid).split('@')[0]
try {
return (await resolveIdentityName(conn, row.jid, { fallback })) || fallback
} catch {
return fallback
}
}))

let text = `◢✿ *Top de usuarios con más experiencia* ✿◤\n\n`
text += users.map((row, index) => `✰ ${startIndex + index + 1} » *${names[index]}*\n  ❖ XP » *${row.exp.toLocaleString()}*  ❖ LVL » *${row.level}*`).join('\n')
text += `\n\n> • Página *${page}* de *${totalPages}*`
if (page < totalPages) text += `\n> Para ver la siguiente página » *#leaderboard ${page + 1}*`

await conn.reply(m.chat, text, m, { mentions: users.map(row => row.jid) })
}

handler.help = ['leaderboard [página]']
handler.tags = ['rpg']
handler.command = ['leaderboard', 'topxp', 'toplevel']
handler.group = true
handler.register = true

export default handler
