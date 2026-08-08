import { formatJobLine, ensureJobFields } from '../../library/rpg-jobs.js'
import { resolveInteractionTarget, resolveIdentityName } from '../../core/identity-utils.js'
import { canonicalEconomyJid, readUnifiedUser } from '../../core/economy-identity.js'

let handler = async (m, {conn, usedPrefix, participants = []}) => {
const participantsByLid = global.buildParticipantsByLid?.(participants) || null
let who = await resolveInteractionTarget(m, conn, { participantsByLid })
// Lectura unificada: si el saldo esta partido entre el numero y el `@lid` se fusiona
// antes de mostrarlo, en vez de reportar solo la mitad.
const { user, id: canonicalJid, coin } = readUnifiedUser(who)
who = canonicalJid || who
ensureJobFields(user)
let trabajo = formatJobLine(user)
const displayName = await resolveIdentityName(conn, who, { participantsByLid, fallback: `@${String(who).split('@')[0]}` })
const isSelf = who === canonicalEconomyJid(m.sender)
const amount = `*¥${coin.toLocaleString()} ${m.moneda} 💸*`
await m.reply(`${isSelf ? `Tienes ${amount} en tu Cartera` : `El usuario ${displayName} tiene ${amount} en su Cartera`}.\n💼 Trabajo: *${trabajo}*`, null, { mentions: [who] })}

handler.help = ['wallet']
handler.tags = ['economy']
handler.command = ['wallet', 'cartera']
handler.group = true
handler.register = true

export default handler
