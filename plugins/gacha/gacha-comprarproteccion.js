import { loadHarem, saveHarem, isSameUserId } from '../../lib/gacha-group.js'
import { loadCharacters } from '../../lib/gacha-characters.js'
import { normalizeProtectionDuration, isProtectionActive, formatProtectionDate, getUserFunds, spendUserFunds, calculateProtectionQuote, applyProtection, MAX_PROTECTION_DAYS } from '../../lib/gacha-protection.js'

const ALL_PATTERN = /^(all|todos|todo)$/i

function dedupeByCharacterId(list = []) {
const seen = new Set()
return list.filter(item => {
const key = String(item?.characterId || '')
if (!key || seen.has(key)) return false
seen.add(key)
return true
})
}

function findUserCharacters(harem, groupId, userId) {
return dedupeByCharacterId(harem.filter(c => c?.groupId === groupId && isSameUserId(c?.userId, userId)))
}

function selectCharacters(userChars, characterMap, target) {
if (ALL_PATTERN.test(target)) return userChars
const normalizedTarget = String(target || '').toLowerCase().trim()
return dedupeByCharacterId(userChars.filter(c => {
const char = characterMap.get(String(c.characterId))
return char?.name?.toLowerCase().includes(normalizedTarget)
}))
}

let handler = async (m, { conn, args, usedPrefix }) => {
const userId = m.sender
const groupId = m.chat
const user = global.db.getUser(userId)
const moneda = m.moneda || 'Coins'
const prefix = usedPrefix || '#'
if (!user) return conn.reply(m.chat, '✘ Usuario no registrado.', m)
if (args.length < 2) return conn.reply(m.chat, `◢✿ *PROTECCIÓN DE HAREM* ✿◤\n\n✧ Uso: *${prefix}comprarproteccion <días> <personaje|all>*\n✧ Límite máximo: *${MAX_PROTECTION_DAYS} días*\n✧ Puedes elegir cualquier cantidad entre *1* y *${MAX_PROTECTION_DAYS}* días.\n\n✦ Ejemplos:\n- ${prefix}comprarproteccion 7 all\n- ${prefix}comprarproteccion 12d miku`, m)
const durationData = normalizeProtectionDuration(args[0])
const target = args.slice(1).join(' ').trim().toLowerCase()
if (!durationData) return conn.reply(m.chat, `✘ Duración no válida. Elige entre *1* y *${MAX_PROTECTION_DAYS}* días.`, m)
try {
const [harem, characters] = await Promise.all([loadHarem(), loadCharacters()])
const characterMap = new Map(characters.map(c => [String(c.id), c]))
const userChars = findUserCharacters(harem, groupId, userId)
if (!userChars.length) return conn.reply(m.chat, '✘ No tienes personajes en este grupo.', m)
let selected = selectCharacters(userChars, characterMap, target)
if (!selected.length) return conn.reply(m.chat, '✘ No encontré ese personaje en tu harem.', m)
const alreadyProtected = selected.filter(isProtectionActive)
selected = selected.filter(c => !isProtectionActive(c))
if (!selected.length) return conn.reply(m.chat, `✘ Todos los personajes seleccionados ya tienen protección activa.\nUsa *${prefix}renovarproteccion* para extenderla sin superar *${MAX_PROTECTION_DAYS} días*.`, m)
const quantity = selected.length
const { total: totalCost, unitPrice } = calculateProtectionQuote({ duration: durationData, quantity })
const funds = getUserFunds(user)
if (funds.total < totalCost) return conn.reply(m.chat, `◢✿ *SALDO INSUFICIENTE* ✿◤\n\n✧ Necesitas: *¥${totalCost.toLocaleString()} ${moneda}*\n✧ Cálculo: *${quantity}* x *¥${unitPrice.toLocaleString()}* (${durationData.label})\n✧ Cartera: *¥${funds.coin.toLocaleString()} ${moneda}*\n✧ Banco: *¥${funds.bank.toLocaleString()} ${moneda}*\n✧ Total: *¥${funds.total.toLocaleString()} ${moneda}*`, m)
const now = Date.now()
let maxExpiry = 0
for (const char of selected) {
const plan = applyProtection(char, durationData, { now, mode: 'purchase' })
if (plan?.expiresAt > maxExpiry) maxExpiry = plan.expiresAt
}
const paid = spendUserFunds(user, totalCost)
await saveHarem(harem)
return conn.reply(m.chat, `◢✿ *PROTECCIÓN ACTIVADA* ✿◤\n\n✧ Protegidos: *${selected.length} personaje(s)*\n✧ Duración: *${durationData.label}*\n✧ Expira: *${formatProtectionDate(maxExpiry)}*\n✧ Límite activo: *${MAX_PROTECTION_DAYS} días máximo*\n✧ Costo: *¥${totalCost.toLocaleString()} ${moneda}*\n✧ Cálculo: *${quantity}* x *¥${unitPrice.toLocaleString()}* (${durationData.label})\n✧ Cobro: banco *¥${(paid?.fromBank || 0).toLocaleString()}* + cartera *¥${(paid?.fromCoin || 0).toLocaleString()}*\n✧ Cartera: *¥${(user.coin || 0).toLocaleString()} ${moneda}*\n✧ Banco: *¥${(user.bank || 0).toLocaleString()} ${moneda}*${alreadyProtected.length ? `\n\n⚠️ Ya protegidos (sin cobro): *${alreadyProtected.length}*` : ''}`, m)
} catch (error) {
console.error(error)
return conn.reply(m.chat, `✘ Error al comprar protección: ${error.message}`, m)
}
}

handler.help = ['comprarproteccion <días> <personaje|all>']
handler.tags = ['gacha', 'economia']
handler.command = ['comprarproteccion', 'buyprotection', 'proteger']
handler.group = true
handler.register = true

export default handler
