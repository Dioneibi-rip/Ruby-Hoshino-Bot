export function normalizeCooldownMs(value = 0) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return 0
  return Math.ceil(number)
}

export function millisecondsToSeconds(ms = 0) {
  return Math.max(0, Math.ceil(normalizeCooldownMs(ms) / 1000))
}

export function formatDurationHMS(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Math.ceil(Number(totalSeconds) || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function getRemainingCooldownMs(lastUsedAt = 0, cooldownMs = 0, now = Date.now()) {
  const last = Number(lastUsedAt) || 0
  const cooldown = normalizeCooldownMs(cooldownMs)
  const current = Number(now) || Date.now()
  return Math.max(0, last + cooldown - current)
}
