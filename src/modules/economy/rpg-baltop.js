let handler = async (m, { conn, args, participants }) => {
const jidLocal = jid => String(jid || '').split('@')[0].split(':')[0]
const groupLocals = new Set(participants.map(p => jidLocal(p.id || p.jid)).filter(Boolean))
const page = args[0] && !isNaN(args[0]) ? parseInt(args[0]) : 1
const perPage = 10
const start = (page - 1) * perPage
const end = start + perPage

const topRows = await Promise.resolve(global.db.getTopUsers?.({ field: 'coin', limit: Math.max(end, perPage), offset: 0 }) || global.db.topUsers?.({ field: 'coin', limit: Math.max(end, perPage), offset: 0 }) || [])
const sorted = topRows
.map(row => ({ jid: row.id, total: Number(row.coin) || 0 }))
.filter(row => groupLocals.has(jidLocal(row.jid)))

const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
const pageUsers = sorted.slice(start, end)
const iconos = ['👑', '🥈', '🥉']
let texto = `「✿」Los usuarios con más *${m.moneda}* son:\n\n`

for (let i = 0; i < pageUsers.length; i++) {
const { jid, total } = pageUsers[i]
const nombre = await conn.getName(jid)
const icono = iconos[start + i] || '✰'
const yenes = `¥${total.toLocaleString()} ${m.moneda}`

texto += `${icono} ${start + i + 1} » *${nombre}:*\n`
texto += `\t\t Total→ *${yenes}*\n`
}

texto += `\n> • Pagina *${page}* de *${totalPages}*`

await conn.reply(m.chat, texto.trim(), m)
}

handler.help = ['baltop']
handler.tags = ['rpg']
handler.command = ['baltop', 'eboard']
handler.group = true
handler.register = true
handler.exp = 0

export default handler
