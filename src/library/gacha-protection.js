export const MAX_PROTECTION_DAYS = 30
export const DAY_MS = 24 * 60 * 60 * 1000
export const MAX_PROTECTION_MS = MAX_PROTECTION_DAYS * DAY_MS
export const PROTECTION_DURATIONS = Object.fromEntries(Array.from({ length: MAX_PROTECTION_DAYS }, (_, index) => {
const days = index + 1
return [`${days}d`, { days, ms: days * DAY_MS, label: `${days} día${days === 1 ? '' : 's'}` }]
}))

export function normalizeProtectionDuration(input = '') {
const raw = String(input || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
const match = raw.match(/^(\d{1,3})(?:\s*(?:d|dia|dias|day|days))?$/)
if (!match) return null
const days = Number(match[1])
if (!Number.isInteger(days) || days < 1 || days > MAX_PROTECTION_DAYS) return null
return { key: `${days}d`, days, ms: days * DAY_MS, label: `${days} día${days === 1 ? '' : 's'}` }
}

export function getBaseProtectionPrice(duration = '3d') {
const data = typeof duration === 'object' ? duration : normalizeProtectionDuration(duration)
const days = Math.max(1, Math.min(MAX_PROTECTION_DAYS, Number(data?.days || 3)))
const dailyRate = days >= 30 ? 934 : days >= 15 ? 1067 : days >= 7 ? 1286 : 1667
return Math.ceil(days * dailyRate)
}

export function calculateProtectionCost({ duration = '3d', quantity = 1, days } = {}) {
const durationData = days ? { days: Number(days) } : typeof duration === 'object' ? duration : normalizeProtectionDuration(duration)
const safeQuantity = Math.max(1, Number(quantity) || 1)
const unitPrice = getBaseProtectionPrice(durationData || duration)
let total = unitPrice * safeQuantity
if (safeQuantity >= 5) total = Math.ceil(total * 0.92)
if (safeQuantity >= 12) total = Math.ceil(total * 0.88)
return total
}

export function calculateProtectionQuote({ duration = '3d', quantity = 1, days } = {}) {
const durationData = days ? { days: Number(days) } : typeof duration === 'object' ? duration : normalizeProtectionDuration(duration)
const safeQuantity = Math.max(1, Number(quantity) || 1)
const unitPrice = getBaseProtectionPrice(durationData || duration)
let total = unitPrice * safeQuantity
if (safeQuantity >= 5) total = Math.ceil(total * 0.92)
if (safeQuantity >= 12) total = Math.ceil(total * 0.88)
return { total, unitPrice, safeQuantity }
}

export function getUserFunds(user = {}) {
const coin = Number(user.coin || 0)
const bank = Number(user.bank || 0)
return { coin, bank, total: coin + bank }
}

export function spendUserFunds(user = {}, amount = 0) {
const cost = Math.max(0, Number(amount) || 0)
const funds = getUserFunds(user)
if (funds.total < cost) return false
let remaining = cost
const fromBank = Math.min(funds.bank, remaining)
user.bank = funds.bank - fromBank
remaining -= fromBank
const fromCoin = Math.min(funds.coin, remaining)
user.coin = funds.coin - fromCoin
return { fromBank, fromCoin, total: cost, coinLeft: user.coin, bankLeft: user.bank, totalLeft: (user.coin || 0) + (user.bank || 0) }
}

export function getProtectionCeiling(now = Date.now()) {
return now + MAX_PROTECTION_MS
}

export function getProtectionRenewalPlan(entry, durationData, now = Date.now()) {
const currentExpiry = Number(entry?.protection?.expiresAt || 0)
const baseTime = currentExpiry > now ? currentExpiry : now
const ceiling = getProtectionCeiling(now)
const requestedExpiry = baseTime + Number(durationData?.ms || 0)
const expiresAt = Math.min(requestedExpiry, ceiling)
const effectiveMs = Math.max(0, expiresAt - baseTime)
const effectiveDays = Math.ceil(effectiveMs / DAY_MS)
return { baseTime, ceiling, requestedExpiry, expiresAt, effectiveMs, effectiveDays, capped: requestedExpiry > ceiling }
}

export function applyProtection(entry, durationData, { now = Date.now(), mode = 'purchase', extra = {} } = {}) {
if (!entry || !durationData) return null
const plan = mode === 'renew' ? getProtectionRenewalPlan(entry, durationData, now) : { expiresAt: Math.min(now + durationData.ms, getProtectionCeiling(now)), effectiveDays: durationData.days, capped: false }
if (plan.effectiveDays <= 0) return null
entry.protection = { ...(entry.protection || {}), protected: true, expiresAt: plan.expiresAt, duration: `${plan.effectiveDays}d`, days: plan.effectiveDays, capped: plan.capped, updatedAt: now, ...extra }
if (mode === 'purchase') entry.protection.purchasedAt = now
if (mode === 'renew') entry.protection.renewedAt = now
return plan
}

export function resetProtectionOnTransfer(entry, { graceMs = 0, now = Date.now(), reason = 'transfer' } = {}) {
if (!entry) return entry
if (graceMs > 0) entry.lastClaimTime = now
entry.protection = { protected: false, expiresAt: 0, duration: null, reason, transferredAt: now }
return entry
}

export function isProtectionActive(entry) {
if (!entry?.protection?.protected) return false
const expiresAt = Number(entry?.protection?.expiresAt || 0)
if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
entry.protection.protected = false
return false
}
return true
}

export function formatProtectionDate(timestamp) {
try {
return new Date(timestamp).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
} catch {
return 'Fecha inválida'
}
}
