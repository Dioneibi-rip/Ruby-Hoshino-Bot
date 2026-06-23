import { loadHarem, saveHarem, isSameUserId } from '../../lib/gacha-group.js'
import { loadCharacters, findCharacterById } from '../../lib/gacha-characters.js'
import { isProtectionActive, getUserFunds, spendUserFunds, resetProtectionOnTransfer } from '../../lib/gacha-protection.js'
import { canUserClaimCharacter } from '../../lib/gacha-restrictions.js'

const CLAIM_GRACE_MS = 2 * 60 * 1000
const ROB_ATTEMPT_COST = 700
const ROB_FAIL_PENALTY = 1100
const ROB_SUCCESS_FEE = 900

function getStealChance(thiefOwnedCount, victimOwnedCount) {
let chance = 0.42
if (thiefOwnedCount < 3) chance += 0.08
if (thiefOwnedCount > victimOwnedCount) chance -= 0.07
if (victimOwnedCount >= 8) chance += 0.05
return Math.min(0.62, Math.max(0.25, chance))
}


let handler = async (m, { conn, participants }) => {
let userId = m.sender
const groupId = m.chat
const now = Date.now()
const moneda = m.moneda || 'Coins'

let victimJid
if (m.isGroup) {
victimJid = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
} else {
victimJid = m.chat
}

if (!victimJid) {
return conn.reply(m.chat, '✘ Menciona a un usuario o cita su mensaje: *#robwaifu @usuario*', m)
}

try {
if (m.isGroup) {
if (userId.endsWith('@lid')) {
const tUser = participants.find(u => u.lid === userId)
if (tUser) userId = tUser.id
}
if (victimJid.endsWith('@lid')) {
const vUser = participants.find(u => u.lid === victimJid)
if (vUser) victimJid = vUser.id
}
}
} catch (e) {}

if (isSameUserId(victimJid, userId)) return conn.reply(m.chat, '✘ No puedes robarte a ti mismo.', m)

const thief = global.db.getUser(userId)

const funds = getUserFunds(thief)
if (funds.total < ROB_ATTEMPT_COST) {
return conn.reply(m.chat, `✘ Necesitas al menos *¥${ROB_ATTEMPT_COST.toLocaleString()} ${moneda}* para intentar un robo.\n` +
`✧ Cartera: *¥${funds.coin.toLocaleString()} ${moneda}*\n✧ Banco: *¥${funds.bank.toLocaleString()} ${moneda}*`, m)
}

try {
const [harem, characters] = await Promise.all([loadHarem(), loadCharacters()])
const victimName = await conn.getName(victimJid)
const victimChars = harem.filter(c => c.groupId === groupId && isSameUserId(c.userId, victimJid))
const thiefChars = harem.filter(c => c.groupId === groupId && isSameUserId(c.userId, userId))

if (!victimChars.length) return conn.reply(m.chat, `👤 *${victimName}* no tiene personajes para robar.`, m)

const eligibleChars = victimChars.filter(char => {
const restriction = canUserClaimCharacter(char.characterId, userId)
if (!restriction.allowed) return false
if (isProtectionActive(char)) return false
const lastClaimTime = Number(char.lastClaimTime || 0)
if (lastClaimTime > 0 && (now - lastClaimTime) < CLAIM_GRACE_MS) return false
return true
})

if (!eligibleChars.length) {
return conn.reply(m.chat, `◢✿ *ROBO BLOQUEADO* ✿◤\n\n✧ Los personajes de *${victimName}* tienen protección activa o están en gracia anti-robo reciente.\n✧ Espera y vuelve a intentar más tarde.`, m)
}

spendUserFunds(thief, ROB_ATTEMPT_COST)
const stealChance = getStealChance(thiefChars.length, victimChars.length)
const success = Math.random() < stealChance

if (!success) {
spendUserFunds(thief, ROB_FAIL_PENALTY)
return conn.reply(m.chat, `◢✿ *ROBO FALLIDO* ✿◤\n\n✧ *${victimName}* detectó el intento.\n✧ Costo del intento: *¥${ROB_ATTEMPT_COST.toLocaleString()} ${moneda}*\n✧ Penalización: *¥${ROB_FAIL_PENALTY.toLocaleString()} ${moneda}*\n✧ Probabilidad usada: *${Math.round(stealChance * 100)}%*`, m)
}

const stolen = eligibleChars[Math.floor(Math.random() * eligibleChars.length)]
const charData = findCharacterById(characters, stolen.characterId)
const charName = charData?.name || `ID ${stolen.characterId}`

const victimIdx = harem.findIndex(c => c.groupId === groupId && c.characterId === stolen.characterId && isSameUserId(c.userId, victimJid))
if (victimIdx === -1) {
return conn.reply(m.chat, '✘ No se pudo completar el robo. Intenta de nuevo.', m)
}

harem[victimIdx].userId = userId
resetProtectionOnTransfer(harem[victimIdx], { graceMs: CLAIM_GRACE_MS, now, reason: 'robwaifu' })

spendUserFunds(thief, ROB_SUCCESS_FEE)

await saveHarem(harem)

return conn.reply(m.chat, `◢✿ *ROBO EXITOSO* ✿◤\n\n✧ Robaste a *${charName}* de *${victimName}*.\n✧ Costo del intento: *¥${ROB_ATTEMPT_COST.toLocaleString()} ${moneda}*\n✧ Tarifa de escape: *¥${ROB_SUCCESS_FEE.toLocaleString()} ${moneda}*\n✧ El personaje queda protegido por *${Math.floor(CLAIM_GRACE_MS / 60000)} minutos* (anti robo en cadena).`, m)
} catch (error) {
console.error(error)
return conn.reply(m.chat, `✘ Error en robwaifu: ${error.message}`, m)
}
}

handler.help = ['robwaifu @usuario']
handler.tags = ['gacha', 'economia']
handler.command = ['robwaifu', 'stealwaifu', 'robarwaifu']
handler.group = true
handler.register = true
handler.cooldown = 5400000

export default handler
