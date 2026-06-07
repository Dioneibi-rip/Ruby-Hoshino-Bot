let handler = async (m, { conn, args, participants }) => {
const jidLocal = jid => String(jid || '').split('@')[0].split(':')[0]
const groupLocals = new Set(participants.map(p => jidLocal(p.id)).filter(Boolean))

const users = Object.entries(global.db.data.users)
.filter(([jid]) => groupLocals.has(jidLocal(jid)))
.map(([key, value]) => ({ ...value, jid: key }))

const sorted = users.sort((a, b) => {
const totalA = (a.coin || 0) + (a.bank || 0)
const totalB = (b.coin || 0) + (b.bank || 0)
return totalB - totalA
})

const page = args[0] && !isNaN(args[0]) ? parseInt(args[0]) : 1
const perPage = 10
const start = (page - 1) * perPage
const end = start + perPage
const totalPages = Math.ceil(sorted.length / perPage)

const iconos = ['👑', '🥈', '🥉']
let texto = `「✿」Los usuarios con más *${m.moneda}* son:\n\n`

for (let i = start; i < Math.min(end, sorted.length); i++) {
const { jid, coin = 0, bank = 0 } = sorted[i]
const total = coin + bank
const nombre = await conn.getName(jid)
const icono = iconos[i] || '✰'
const yenes = `¥${total.toLocaleString()} ${m.moneda}`

texto += `${icono} ${i + 1} » *${nombre}:*\n`
texto += `\t\t Total→ *${yenes}*\n`
}

texto += `\n> • Página *${page}* de *${totalPages}*`

await conn.reply(m.chat, texto.trim(), m)
}

handler.help = ['baltop']
handler.tags = ['rpg']
handler.command = ['baltop', 'eboard']
handler.group = true
handler.register = true
handler.exp = 0

export default handler
