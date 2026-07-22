const store = new Map()
const expirations = new Map()

function normalizeKey(key) {
  return String(key ?? '')
}

function purgeExpired(key) {
  const normalizedKey = normalizeKey(key)
  const expiresAt = expirations.get(normalizedKey)
  if (expiresAt && expiresAt <= Date.now()) {
    store.delete(normalizedKey)
    expirations.delete(normalizedKey)
    return true
  }
  return false
}

export default class Redis {
  constructor() {
    this.store = store
  }

  async get(key) {
    const normalizedKey = normalizeKey(key)
    purgeExpired(normalizedKey)
    return store.get(normalizedKey) ?? null
  }

  async set(key, value, mode = null, duration = null, condition = null) {
    const normalizedKey = normalizeKey(key)
    purgeExpired(normalizedKey)
    const normalizedCondition = String(condition || '').toUpperCase()
    if (normalizedCondition === 'NX' && store.has(normalizedKey)) return null
    store.set(normalizedKey, String(value))
    if (String(mode || '').toUpperCase() === 'EX' && Number(duration) > 0) {
      expirations.set(normalizedKey, Date.now() + Number(duration) * 1000)
    } else {
      expirations.delete(normalizedKey)
    }
    return 'OK'
  }

  async del(key) {
    const normalizedKey = normalizeKey(key)
    const existed = store.delete(normalizedKey)
    expirations.delete(normalizedKey)
    return existed ? 1 : 0
  }

  async ttl(key) {
    const normalizedKey = normalizeKey(key)
    if (purgeExpired(normalizedKey)) return -2
    if (!store.has(normalizedKey)) return -2
    const expiresAt = expirations.get(normalizedKey)
    if (!expiresAt) return -1
    return Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000))
  }

  on() { return this }
  quit() { return Promise.resolve('OK') }
}

export const redis = new Redis()

export function isRedisReady() {
  return true
}

export function getCooldownSeconds(plugin = {}) {
  const value = plugin?.cooldown ?? plugin?.cooldownSeconds ?? plugin?.cooldownTime ?? 0
  const seconds = Number(value)
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 0
}

export function getCooldownKey(command = 'unknown', sender = 'unknown') {
  const safeCommand = String(command || 'unknown').toLowerCase().replace(/[^a-z0-9:_-]/gi, '_')
  const safeSender = String(sender || 'unknown').replace(/[^a-z0-9@.:_-]/gi, '_')
  return `cooldown:${safeCommand}:${safeSender}`
}

export async function setRedisWithTTL(key, value, seconds, condition = undefined) {
  return redis.set(key, value, 'EX', seconds, condition)
}
