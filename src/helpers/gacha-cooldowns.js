import { getCooldownKey, isRedisReady, redis } from '../library/redis.js'

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
  if (!normalizedUserId || !isRedisReady()) return 0
  const commandList = Array.isArray(commands) ? commands : [commands]
  const ttls = []
  for (const command of commandList) {
    if (!command) continue
    const key = getCooldownKey(command, normalizedUserId)
    const ttlSeconds = await redis.ttl(key)
    if (Number.isFinite(ttlSeconds) && ttlSeconds > 0) ttls.push(ttlSeconds * 1000)
  }
  return ttls.length ? Math.max(...ttls) : 0
}

export async function getGachaCooldownStatus(commands = [], userId = '') {
  try {
    return formatRemainingTimeSpanish(await getGachaCooldownRemainingMs(commands, userId))
  } catch (error) {
    console.error('[gacha-cooldowns] No se pudo consultar cooldown:', error)
    return 'Ahora.'
  }
}
