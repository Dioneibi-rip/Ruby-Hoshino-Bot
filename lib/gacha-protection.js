export const PROTECTION_DURATIONS = {
  '3d': { ms: 3 * 24 * 60 * 60 * 1000, label: '3 días' },
  '7d': { ms: 7 * 24 * 60 * 60 * 1000, label: '7 días' },
  '15d': { ms: 15 * 24 * 60 * 60 * 1000, label: '15 días' },
  '30d': { ms: 30 * 24 * 60 * 60 * 1000, label: '30 días' }
}

const FIXED_PROTECTION_PRICES = {
  '3d': 5_000,
  '7d': 9_000,
  '15d': 16_000,
  '30d': 28_000
}

export function getBaseProtectionPrice(duration = '3d') {
  return FIXED_PROTECTION_PRICES[duration] || FIXED_PROTECTION_PRICES['3d']
}

export function calculateProtectionCost({ duration = '3d', quantity = 1 }) {
  const safeQuantity = Math.max(1, Number(quantity) || 1)
  const unitPrice = getBaseProtectionPrice(duration)

  let total = unitPrice * safeQuantity
  if (safeQuantity >= 5) total = Math.ceil(total * 0.92)
  if (safeQuantity >= 12) total = Math.ceil(total * 0.88)

  return total
}

export function getUserFunds(user = {}) {
  const coin = Number(user.coin || 0)
  const bank = Number(user.bank || 0)
  return {
    coin,
    bank,
    total: coin + bank
  }
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

  return {
    fromBank,
    fromCoin,
    total: cost,
    coinLeft: user.coin,
    bankLeft: user.bank,
    totalLeft: (user.coin || 0) + (user.bank || 0)
  }
}

export function resetProtectionOnTransfer(entry, { graceMs = 0, now = Date.now(), reason = 'transfer' } = {}) {
  if (!entry) return entry

  if (graceMs > 0) {
    entry.lastClaimTime = now
    entry.protection = {
      protected: false,
      expiresAt: 0,
      duration: null,
      reason,
      transferredAt: now
    }
    return entry
  }

  entry.protection = {
    protected: false,
    expiresAt: 0,
    duration: null,
    reason,
    transferredAt: now
  }
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
    return new Date(timestamp).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  } catch {
    return 'Fecha inválida'
  }
}
