import Redis from 'ioredis'

export const redisUrl = rediss://default:gQAAAAAAAez2AAIgcDI2ZjQ5ODk4ZjMyZDY0OGUwODFmMTgxNDM1Y2RlOWNhMg@positive-escargot-126198.upstash.io:6379'
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

export const redis = redisUrl ? new Redis(redisUrl, redisOptions) : new Redis({
host: process.env.REDIS_HOST || '127.0.0.1',
port: Number(process.env.REDIS_PORT || 6379),
username: process.env.REDIS_USERNAME || undefined,
password: process.env.REDIS_PASSWORD || undefined,
db: Number(process.env.REDIS_DB || 0),
...redisOptions
})

redis.on('ready', () => {
console.log('[redis] ready')
})

redis.on('error', (error) => {
console.error('[redis] error', error?.message || error)
})

export function isRedisReady() {
return redis.status === 'ready'
}

export function getCooldownKey(command, jid) {
return `cooldown:${String(command || '').toLowerCase()}:${jid}`
}

export function getCooldownSeconds(plugin) {
const value = Number(plugin?.cooldownSeconds || plugin?.cooldown || 0)
if (!Number.isFinite(value) || value <= 0) return 0
return value > 1000 ? Math.ceil(value / 1000) : Math.ceil(value)
}