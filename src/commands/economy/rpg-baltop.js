import { resolveIdentityName } from '../../core/identity-utils.js'
import { rankParticipants } from '../../core/economy-identity.js'

const PER_PAGE = 10
const ICONS = ['👑', '🥈', '🥉']

const money = value => `¥${(Number(value) || 0).toLocaleString()}`

let handler = async (m, { conn, args, groupMetadata, participants = [] }) => {
// La metadata en vivo es la mejor fuente de pares lid/pn, pero si la consulta falla se
// reutiliza la que ya trae el pipeline en vez de reventar el comando.
const metadata = await conn.groupMetadata(m.chat).catch(() => groupMetadata || {})
const roster = (Array.isArray(metadata?.participants) && metadata.participants.length ? metadata.participants : participants) || []
if (!roster.length) return conn.reply(m.chat, '✰ No pude leer la lista de participantes de este grupo.', m)

// `rankParticipants` resuelve cada participante a su JID canonico via `jid_aliases`,
// consulta todas sus variantes de una sola vez y suma los saldos partidos entre el
// numero y el `@lid`, de modo que nadie aparece duplicado ni con saldo a cero.
const rows = rankParticipants(roster, { field: 'coin', useTotalWealth: true }).filter(row => row.totalWealth > 0)

if (!rows.length) return conn.reply(m.chat, '✰ Aún no hay balances de participantes registrados.', m)

const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
const requestedPage = Number.parseInt(args[0], 10)
const page = Math.min(Math.max(Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1, 1), totalPages)
const start = (page - 1) * PER_PAGE
const pageRows = rows.slice(start, start + PER_PAGE)

// Los nombres se resuelven EN PARALELO: el bucle secuencial anterior encadenaba hasta
// 10 consultas de contacto y hacia que el comando pareciera colgado o expirara.
const names = await Promise.all(pageRows.map(async row => {
const fallback = String(row.id).split('@')[0]
try {
const name = await resolveIdentityName(conn, row.id, { fallback })
return String(name || fallback).replace(/@/g, '') || fallback
} catch {
return fallback
}
}))

const lines = pageRows.map((row, index) => {
const position = start + index
return `${ICONS[position] || '✰'} ${position + 1} » *${names[index]}:*\n\t\tTotal→ *${money(row.totalWealth)} ${m.moneda}*\nCartera→ *${money(row.coin)}* · Banco→ *${money(row.bank)}*`
})

const text = `「✿」Los usuarios con más *${m.moneda}* son:\n\n${lines.join('\n')}\n\n> • Pagina *${page}* de *${totalPages}*`
await conn.reply(m.chat, text.trim(), m)
}

handler.help = ['baltop']
handler.tags = ['rpg']
handler.command = ['baltop', 'eboard']
handler.group = true
handler.register = true
handler.exp = 0
export default handler
