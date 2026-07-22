import { millisecondsToSeconds, normalizeCooldownMs } from './time-utils.js'

const memoryStore = new Map()
const memoryExpirations = new Map()

function normalizeKey(key) { return String(key ?? '') }
function now() { return Date.now() }

function getSqlite() {
  return global.db?.sqlite || null
}

function ensureTable(sqlite = getSqlite()) {
  if (!sqlite) return null
  sqlite.prepare(`CREATE TABLE IF NOT EXISTS redis_cooldowns (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '1',
    expires_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run()
  sqlite.prepare('CREATE INDEX IF NOT EXISTS idx_redis_cooldowns_expires_at ON redis_cooldowns(expires_at)').run()
  return sqlite
}

function purgeExpiredMemory(key) {
  const normalizedKey = normalizeKey(key)
  const expiresAt = memoryExpirations.get(normalizedKey)
  if (expiresAt && expiresAt <= now()) {
    memoryStore.delete(normalizedKey)
    memoryExpirations.delete(normalizedKey)
    return true
  }
  return false
}

function purgeExpiredSqlite(sqlite = getSqlite()) {
  if (!sqlite) return
  ensureTable(sqlite).prepare('DELETE FROM redis_cooldowns WHERE expires_at <= ?').run(now())
}

export default class Redis {
  constructor() { this.store = memoryStore }

  async get(key) {
    const normalizedKey = normalizeKey(key)
    const sqlite = getSqlite()
    if (sqlite) {
      purgeExpiredSqlite(sqlite)
      return ensureTable(sqlite).prepare('SELECT value FROM redis_cooldowns WHERE key=?').get(normalizedKey)?.value ?? null
    }
    purgeExpiredMemory(normalizedKey)
    return memoryStore.get(normalizedKey) ?? null
  }

  async set(key, value, mode = null, duration = null, condition = null) {
    const normalizedKey = normalizeKey(key)
    const ttlMs = String(mode || '').toUpperCase() === 'EX' ? normalizeCooldownMs(Number(duration) * 1000) : 0
    const expiresAt = ttlMs > 0 ? now() + ttlMs : 2147483647000
    const normalizedCondition = String(condition || '').toUpperCase()
    const sqlite = getSqlite()
    if (sqlite) {
      const db = ensureTable(sqlite)
      purgeExpiredSqlite(db)
      if (normalizedCondition === 'NX' && db.prepare('SELECT 1 FROM redis_cooldowns WHERE key=?').get(normalizedKey)) return null
      db.prepare('INSERT INTO redis_cooldowns(key,value,expires_at,updated_at) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, expires_at=excluded.expires_at, updated_at=excluded.updated_at').run(normalizedKey, String(value), expiresAt, now())
      return 'OK'
    }
    purgeExpiredMemory(normalizedKey)
    if (normalizedCondition === 'NX' && memoryStore.has(normalizedKey)) return null
    memoryStore.set(normalizedKey, String(value))
    memoryExpirations.set(normalizedKey, expiresAt)
    return 'OK'
  }

  async del(key) {
    const normalizedKey = normalizeKey(key)
    const sqlite = getSqlite()
    if (sqlite) return ensureTable(sqlite).prepare('DELETE FROM redis_cooldowns WHERE key=?').run(normalizedKey).changes
    const existed = memoryStore.delete(normalizedKey)
    memoryExpirations.delete(normalizedKey)
    return existed ? 1 : 0
  }

  async ttl(key) {
    const normalizedKey = normalizeKey(key)
    const sqlite = getSqlite()
    if (sqlite) {
      purgeExpiredSqlite(sqlite)
      const row = ensureTable(sqlite).prepare('SELECT expires_at FROM redis_cooldowns WHERE key=?').get(normalizedKey)
      if (!row) return -2
      return Math.max(1, millisecondsToSeconds(Number(row.expires_at) - now()))
    }
    if (purgeExpiredMemory(normalizedKey)) return -2
    if (!memoryStore.has(normalizedKey)) return -2
    return Math.max(1, millisecondsToSeconds(Number(memoryExpirations.get(normalizedKey)) - now()))
  }

  on() { return this }
  quit() { return Promise.resolve('OK') }
}

export const redis = new Redis()
export function isRedisReady() { return true }
export function getCooldownSeconds(plugin = {}) { return millisecondsToSeconds(plugin?.cooldown ?? plugin?.cooldownMs ?? plugin?.cooldownTime ?? 0) }
export function getCooldownKey(command = 'unknown', sender = 'unknown') {
  const safeCommand = String(command || 'unknown').toLowerCase().replace(/[^a-z0-9:_-]/gi, '_')
  const safeSender = String(sender || 'unknown').replace(/[^a-z0-9@.:_-]/gi, '_')
  return `cooldown:${safeCommand}:${safeSender}`
}
export async function setRedisWithTTL(key, value, seconds, condition = undefined) { return redis.set(key, value, 'EX', seconds, condition) }
