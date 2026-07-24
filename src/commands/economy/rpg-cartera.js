import { formatJobLine, ensureJobFields } from '../../library/rpg-jobs.js'
import { resolveInteractionTarget, resolveIdentityName } from '../../core/identity-utils.js'

let handler = async (m, {conn, usedPrefix, participants = []}) => {
const participantsByLid = global.buildParticipantsByLid?.(participants) || null
let who = await resolveInteractionTarget(m, conn, { participantsByLid })
let user = global.db.getUser(who)
ensureJobFields(user)
let trabajo = formatJobLine(user)
const displayName = await resolveIdentityName(conn, who, { fallback: `@${String(who).split('@')[0]}` })
await m.reply(`${who == m.sender ? `Tienes *${user.coin} ${m.moneda} 💸* en tu Cartera` : `El usuario ${displayName} tiene *${user.coin} ${m.moneda} 💸* en su Cartera`}.\n💼 Trabajo: *${trabajo}*`, null, { mentions: [who] })}

handler.help = ['wallet']
handler.tags = ['economy']
handler.command = ['wallet', 'cartera']
handler.group = true
handler.register = true

export default handler
