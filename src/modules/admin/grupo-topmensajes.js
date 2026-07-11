const PER_PAGE = 10

const normalizeJid = jid => typeof jid === 'string' ? jid.split(':')[0] : jid

const parsePositiveInt = value => {
const number = Number.parseInt(value, 10)
return Number.isFinite(number) && number > 0 ? number : null
}

let handler = async (m, { conn, args, usedPrefix, participants }) => {
const page = Math.max(parsePositiveInt(args[0]) || 1, 1)
const participantIds = new Set((participants || []).map(p => normalizeJid(p.id || p.jid)).filter(Boolean))
const offset = (page - 1) * PER_PAGE

let rows = []
if (global.db?.sqlite) {
rows = global.db.sqlite
.prepare('SELECT id, msg_count FROM users WHERE msg_count > 0 ORDER BY msg_count DESC LIMIT ? OFFSET ?')
.all(PER_PAGE * 3, offset)
} else if (typeof global.db?.listUserRows === 'function') {
rows = global.db.listUserRows()
.filter(user => Number(user.msg_count) > 0)
.sort((a, b) => Number(b.msg_count) - Number(a.msg_count))
.slice(offset, offset + (PER_PAGE * 3))
.map(user => ({ id: user.id, msg_count: user.msg_count }))
}

const ranking = rows
.map(row => ({ jid: normalizeJid(row.id), messages: Number(row.msg_count) || 0 }))
.filter(user => user.messages > 0 && (!participantIds.size || participantIds.has(user.jid)))
.slice(0, PER_PAGE)

if (!ranking.length) {
return m.reply(`❀ Aún no tengo mensajes registrados.\n\n> Escribe un poco más y vuelve a usar *${usedPrefix}topmensajes*.`)
}

const lines = [`❀ Top de mensajes registrados`, '']
for (const [index, user] of ranking.entries()) {
let name = user.jid.split('@')[0]
try { name = await conn.getName(user.jid) || name } catch {}
lines.push(`*${offset + index + 1}.* ${name}`)
lines.push(`   » Mensajes: \`${user.messages}\``)
}

lines.push('')
if (ranking.length === PER_PAGE) lines.push(`> Para ver la siguiente página › *${usedPrefix}topmensajes ${page + 1}*`)
if (page > 1) lines.push(`> Para volver a la primera página › *${usedPrefix}topmensajes 1*`)
lines.push(`> Página *${page}*`)

await conn.sendMessage(m.chat, { text: lines.join('\n'), mentions: ranking.map(user => user.jid) }, { quoted: m })
}

handler.help = ['topmensajes [página]']
handler.tags = ['group']
handler.command = ['topmensajes', 'topmsg', 'topmsgs', 'rankingmensajes', 'mensajesgrupo', 'topactividad', 'actividadgrupo']
handler.group = true

export default handler
