import db from '../../infra/database.js'
import { formatJobLine, ensureJobFields } from '../../infra/rpg-jobs.js'
import { buildParticipantsByLid, resolveInteractionTarget, normalizeIdentityJid, resolveIdentityName } from '../../core/identity-utils.js'

let handler = async (m, { conn, usedPrefix, participants }) => {
let who = await resolveInteractionTarget(m, conn)

if (who === conn.user.jid) return m.react('✖️')

const participantsByLid = buildParticipantsByLid(participants)
let primaryJid = await normalizeIdentityJid(conn, who, participantsByLid)

const user = global.db.getUser(primaryJid)

ensureJobFields(user)
let nombre = await resolveIdentityName(conn, primaryJid, { participantsByLid, fallback: `@${String(primaryJid).split('@')[0]}` })
const jobLine = formatJobLine(user)

const coin = Number(user.coin || user.coins || 0)
const bank = Number(user.bank || 0)
const total = coin + bank

let texto = `
╭─〔 ᥫ᭡ 𝗜𝗡𝗙𝗢 𝗘𝗖𝗢𝗡𝗢́𝗠𝗜𝗖𝗔 ❀ 〕
│ 👤 Usuario » *${nombre}*
│ 💸 Dinero » *¥${coin.toLocaleString()} ${m.moneda}*
│ 🏦 Banco » *¥${bank.toLocaleString()} ${m.moneda}*
│ 🧾 Total » *¥${total.toLocaleString()} ${m.moneda}*
│ 💼 Trabajo » *${jobLine}*
╰─────────────────────
> 📌 Usa *${usedPrefix}deposit* para proteger tu dinero en el banco.
`.trim()

await conn.reply(m.chat, texto, m)
}

handler.help = ['bal']
handler.tags = ['rpg']
handler.command = ['bal', 'balance', 'bank']
handler.register = true
handler.group = true

export default handler
