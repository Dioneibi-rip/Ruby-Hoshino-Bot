import Redis from 'ioredis'
import { jidNormalizedUser } from '@whiskeysockets/baileys'

export const redisUrl = process.env.REDIS_URL || 'rediss://default:gQAAAAAAAdpPAAIgcDIyMzhiNTI5M2ZlZTA0ZDQwYTJmMmUxMzhjYWZmYmRhNw@climbing-stinkbug-121423.upstash.io:6379'
const redisOptions = {
lazyConnect: false,
enableOfflineQueue: false,
maxRetriesPerRequest: 1,
retryStrategy(times) {
return Math.min(times * 250, 5000)
},
reconnectOnError() {
return true
}
}

export const redis = new Redis(redisUrl, redisOptions)

redis.on('ready', () => {
console.log('[redis] ready')
})

let redisErrorWarned = false
redis.on('error', (error) => {
if (redisErrorWarned) return
redisErrorWarned = true
console.warn('[redis] warning:', error?.message || error)
})

export function isRedisReady() {
return redis.status === 'ready'
}

export function normalizeCooldownJid(jid = '') {
const raw = String(jid || '').trim()
if (!raw) return 'unknown'
const withoutDevice = raw.split(':')[0]
const normalized = jidNormalizedUser(withoutDevice) || withoutDevice
const [user, server = 's.whatsapp.net'] = String(normalized).toLowerCase().split('@')
const digits = String(user || '').replace(/\D/g, '')
if (digits && ['s.whatsapp.net', 'c.us', 'lid', 'hosted.lid'].includes(server)) return `${digits}@s.whatsapp.net`
return String(normalized).toLowerCase()
}

export function getCooldownKey(command, jid) {
const safeCommand = String(command || '').trim().toLowerCase()
return `cooldown:${normalizeCooldownJid(jid)}:${safeCommand}`
}

export function getCooldownSeconds(plugin) {
const value = Number(plugin?.cooldownSeconds || plugin?.cooldown || 0)
if (!Number.isFinite(value) || value <= 0) return 0
return value > 1000 ? Math.ceil(value / 1000) : Math.ceil(value)
}

export async function setRedisWithTTL(key, value, seconds, ...args) {
const ttl = Math.ceil(Number(seconds) || 0)
if (!key || ttl <= 0) throw new Error('Redis writes require an explicit positive TTL')
return redis.set(key, value, 'EX', ttl, ...args)
}
