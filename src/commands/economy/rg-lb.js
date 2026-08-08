import { resolveIdentityName } from '../../core/identity-utils.js'
import { aggregateEconomyRows, canonicalEconomyJid, identityVariants } from '../../core/economy-identity.js'

const PER_PAGE = 10

let handler = async (m, { conn, args, participants = [] }) => {
const requestedPage = Number.parseInt(args[0], 10)
const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
const startIndex = (page - 1) * PER_PAGE
const totalUsers = Number(global.db.countUsers?.()) || 0
const totalPages = Math.max(1, Math.ceil(totalUsers / PER_PAGE))

// El set de participantes se construye con TODAS las variantes conocidas de cada
// identidad: comparar solo `p.jid || p.id` fallaba en grupos con numeros ocultos y
// ningun miembro se marcaba como presente en el grupo.
const participantJids = new Set()
for (const participant of Array.isArray(participants) ? participants : []) {
for (const candidate of [participant?.id, participant?.jid, participant?.lid]) {
for (const variant of identityVariants(candidate)) participantJids.add(variant)
}
}

const rawRows = global.db.getTopUsers?.({ field: 'exp', limit: PER_PAGE, offset: startIndex })
|| global.db.topUsers?.({ field: 'exp', limit: PER_PAGE, offset: startIndex })
|| []

const pageUsers = aggregateEconomyRows(rawRows)
.map(row => ({ jid: row.id, exp: Number(row.exp) || 0, level: Number(row.level) || 0 }))
.filter(row => row.jid)
.sort((a, b) => b.exp - a.exp || String(a.jid).localeCompare(String(b.jid)))

if (!pageUsers.length) return conn.reply(m.chat, '✰ Aún no hay usuarios con experiencia registrada.', m)

const names = await Promise.all(pageUsers.map(async row => {
const fallback = `@${String(row.jid).split('@')[0]}`
try {
return (await resolveIdentityName(conn, row.jid, { fallback })) || fallback
} catch {
return fallback
}
}))

const rows = pageUsers.map((row, index) => {
const number = String(row.jid).split('@')[0]
const inGroup = participantJids.has(row.jid) || participantJids.has(canonicalEconomyJid(row.jid))
const label = inGroup ? `(${names[index]}) wa.me/${number}` : `@${number}`
return `✰ ${startIndex + index + 1} » *${label}*\n\t\t ❖ XP » *${row.exp.toLocaleString()}*  ❖ LVL » *${row.level}*`
})

let text = `◢✨ Top de usuarios con más experiencia ✨◤\n\n${rows.join('\n')}`
text += `\n\n> • Página *${page}* de *${totalPages}*`
if (page < totalPages) text += `\n> Para ver la siguiente página » *#lb ${page + 1}*`

// Se mencionan los JIDs reales en vez de re-parsear el texto: `parseMention` perdia a
// los usuarios renderizados como `wa.me/` y a los `@lid`.
await conn.reply(m.chat, text.trim(), m, { mentions: pageUsers.map(row => row.jid) })
}

handler.help = ['lb']
handler.tags = ['rpg']
handler.command = ['lboard', 'top', 'lb']
handler.group = true
handler.register = true
handler.fail = null
handler.exp = 0

export default handler
