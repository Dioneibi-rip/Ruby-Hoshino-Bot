import { formatJobLine, ensureJobFields } from '../../library/rpg-jobs.js'
import { buildParticipantsByLid, resolveInteractionTarget, normalizeIdentityJid, resolveIdentityName } from '../../core/identity-utils.js'
import { readUnifiedUser } from '../../core/economy-identity.js'

let handler = async (m, { conn, usedPrefix, participants = [] }) => {
const participantsByLid = buildParticipantsByLid(participants)
let who = await resolveInteractionTarget(m, conn, { participantsByLid })

if (who === conn.user.jid) return m.react('✖️')

let primaryJid = await normalizeIdentityJid(conn, who, participantsByLid)

// `readUnifiedUser` resuelve el JID canonico via `jid_aliases` y, si el usuario tiene el
// saldo partido entre su numero y su `@lid`, fusiona las filas antes de leer. Sin esto
// el comando mostraba solo la mitad del dinero segun con que identidad hablara.
const { user, id: canonicalJid, coin, bank, total } = readUnifiedUser(primaryJid)
primaryJid = canonicalJid || primaryJid

ensureJobFields(user)
let nombre = await resolveIdentityName(conn, primaryJid, { participantsByLid, fallback: `@${String(primaryJid).split('@')[0]}` })
const jobLine = formatJobLine(user)

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
