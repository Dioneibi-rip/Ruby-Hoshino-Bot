import { peekCooldownMs, clearCooldownFor } from '../library/cooldown-store.js'

export const GACHA_COOLDOWN_COMMANDS = Object.freeze({
  rollwaifu: ['rw', 'rollwaifu', 'roll'],
  claim: ['claim', 'reclamar', 'c'],
  vote: ['vote', 'votar']
})

export function formatRemainingTimeSpanish(ms = 0) {
  if (!Number.isFinite(ms) || ms <= 0) return 'Ahora.'
  const totalSeconds = Math.ceil(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = []
  if (days) parts.push(`${days} día${days === 1 ? '' : 's'}`)
  if (hours) parts.push(`${hours} hora${hours === 1 ? '' : 's'}`)
  if (minutes) parts.push(`${minutes} minuto${minutes === 1 ? '' : 's'}`)
  if (seconds || !parts.length) parts.push(`${seconds} segundo${seconds === 1 ? '' : 's'}`)
  return parts.join(' ')
}

export function normalizeGachaUserId(userId = '') {
  return String(userId || '').trim()
}

export async function getGachaCooldownRemainingMs(commands = [], userId = '') {
  const normalizedUserId = normalizeGachaUserId(userId)
  if (!normalizedUserId) return 0
  try {
    return await peekCooldownMs(commands, normalizedUserId)
  } catch (error) {
    console.error('[gacha-cooldowns] No se pudo consultar cooldown:', error)
    return 0
  }
}

export async function getGachaCooldownStatus(commands = [], userId = '') {
  return formatRemainingTimeSpanish(await getGachaCooldownRemainingMs(commands, userId))
}

export async function getGachaCooldownReport(userId = '') {
  const normalizedUserId = normalizeGachaUserId(userId)
  const [rollMs, claimMs, voteMs] = await Promise.all([
    getGachaCooldownRemainingMs(GACHA_COOLDOWN_COMMANDS.rollwaifu, normalizedUserId),
    getGachaCooldownRemainingMs(GACHA_COOLDOWN_COMMANDS.claim, normalizedUserId),
    getGachaCooldownRemainingMs(GACHA_COOLDOWN_COMMANDS.vote, normalizedUserId)
  ])
  return {
    userId: normalizedUserId,
    rollwaifu: { remainingMs: rollMs, ready: rollMs <= 0, label: formatRemainingTimeSpanish(rollMs) },
    claim: { remainingMs: claimMs, ready: claimMs <= 0, label: formatRemainingTimeSpanish(claimMs) },
    vote: { remainingMs: voteMs, ready: voteMs <= 0, label: formatRemainingTimeSpanish(voteMs) }
  }
}

export async function resetGachaCooldowns(userId = '') {
  const normalizedUserId = normalizeGachaUserId(userId)
  if (!normalizedUserId) return false
  for (const commands of Object.values(GACHA_COOLDOWN_COMMANDS)) await clearCooldownFor(commands, normalizedUserId)
  return true
}
