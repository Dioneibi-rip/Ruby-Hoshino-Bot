import { loadHarem, saveHarem, isSameUserId } from '../../lib/gacha-group.js'
import { loadCharacters } from '../../lib/gacha-characters.js'
import { normalizeProtectionDuration, formatProtectionDate, isProtectionActive, getUserFunds, spendUserFunds, getBaseProtectionPrice, getProtectionRenewalPlan, applyProtection, MAX_PROTECTION_DAYS } from '../../lib/gacha-protection.js'

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
if (args.length < 2) return conn.reply(m.chat, `◢✿ *RENOVAR PROTECCIÓN* ✿◤\n\n✧ Uso: *${prefix}renovarproteccion <días> <personaje|all>*\n✧ Límite máximo acumulado: *${MAX_PROTECTION_DAYS} días*\n✧ Puedes elegir cualquier cantidad entre *1* y *${MAX_PROTECTION_DAYS}* días.`, m)
const durationData = normalizeProtectionDuration(args[0])
const target = args.slice(1).join(' ').trim().toLowerCase()
if (!durationData) return conn.reply(m.chat, `✘ Duración no válida. Elige entre *1* y *${MAX_PROTECTION_DAYS}* días.`, m)
try {
const [harem, characters] = await Promise.all([loadHarem(), loadCharacters()])
const characterMap = new Map(characters.map(c => [String(c.id), c]))
const userChars = dedupeByCharacterId(harem.filter(c => c?.groupId === groupId && isSameUserId(c?.userId, userId)))
if (!userChars.length) return conn.reply(m.chat, '✘ No tienes personajes en este grupo.', m)
const selected = selectCharacters(userChars, characterMap, target)
if (!selected.length) return conn.reply(m.chat, '✘ No encontré ese personaje en tu harem.', m)
const renewable = selected.filter(isProtectionActive)
if (!renewable.length) return conn.reply(m.chat, `✘ Los personajes elegidos no tienen protección activa para renovar.\nUsa *${prefix}comprarproteccion* primero.`, m)
const now = Date.now()
const renewalPlans = renewable.map(char => ({ char, plan: getProtectionRenewalPlan(char, durationData, now) })).filter(item => item.plan.effectiveDays > 0)
if (!renewalPlans.length) return conn.reply(m.chat, `◢✿ *LÍMITE ALCANZADO* ✿◤\n\n✧ La protección ya está en el máximo permitido.\n✧ No se pueden acumular más de *${MAX_PROTECTION_DAYS} días*.`, m)
const billedDays = Math.max(...renewalPlans.map(item => item.plan.effectiveDays))
const quantity = renewalPlans.length
const subtotal = renewalPlans.reduce((sum, item) => sum + getBaseProtectionPrice({ days: item.plan.effectiveDays }), 0)
let totalCost = subtotal
if (quantity >= 5) totalCost = Math.ceil(totalCost * 0.92)
if (quantity >= 12) totalCost = Math.ceil(totalCost * 0.88)
const unitPrice = Math.ceil(totalCost / quantity)
const funds = getUserFunds(user)
if (funds.total < totalCost) return conn.reply(m.chat, `◢✿ *SALDO INSUFICIENTE* ✿◤\n\n✧ Renovación: *¥${totalCost.toLocaleString()} ${moneda}*\n✧ Cálculo: *${quantity}* x *¥${unitPrice.toLocaleString()}* (${billedDays} día${billedDays === 1 ? '' : 's'} efectivos)\n✧ Cartera: *¥${funds.coin.toLocaleString()} ${moneda}*\n✧ Banco: *¥${funds.bank.toLocaleString()} ${moneda}*\n✧ Total: *¥${funds.total.toLocaleString()} ${moneda}*`, m)
let maxExpiry = 0
let cappedCount = 0
for (const { char, plan } of renewalPlans) {
const applied = applyProtection(char, { ...durationData, days: plan.effectiveDays, ms: plan.effectiveMs }, { now, mode: 'renew' })
if (plan.capped) cappedCount++
if (applied?.expiresAt > maxExpiry) maxExpiry = applied.expiresAt
}
const paid = spendUserFunds(user, totalCost)
await saveHarem(harem)
return conn.reply(m.chat, `◢✿ *PROTECCIÓN RENOVADA* ✿◤\n\n✧ Renovados: *${renewalPlans.length} personaje(s)*\n✧ Solicitud: *${durationData.label}*\n✧ Días cobrados: *${billedDays}*\n✧ Vencimiento más lejano: *${formatProtectionDate(maxExpiry)}*\n✧ Límite activo: *${MAX_PROTECTION_DAYS} días máximo*\n✧ Costo: *¥${totalCost.toLocaleString()} ${moneda}*\n✧ Cálculo: *${quantity}* x *¥${unitPrice.toLocaleString()}*\n✧ Cobro: banco *¥${(paid?.fromBank || 0).toLocaleString()}* + cartera *¥${(paid?.fromCoin || 0).toLocaleString()}*\n✧ Cartera: *¥${(user.coin || 0).toLocaleString()} ${moneda}*\n✧ Banco: *¥${(user.bank || 0).toLocaleString()} ${moneda}*${cappedCount ? `\n\n⚠️ Ajustados al límite de ${MAX_PROTECTION_DAYS} días: *${cappedCount}*` : ''}`, m)
} catch (error) {
console.error(error)
return conn.reply(m.chat, `✘ Error al renovar protección: ${error.message}`, m)
}
}

handler.help = ['renovarproteccion <días> <personaje|all>']
handler.tags = ['gacha', 'economia']
handler.command = ['renovarproteccion', 'renewprotection', 'extenderproteccion']
handler.group = true
handler.register = true

export default handler
