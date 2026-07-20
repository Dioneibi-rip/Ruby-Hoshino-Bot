import { TTLCache } from './native-utils.js'

export class LRUCache {
  constructor({ max = 1000, ttl = 5 * 60 * 1000 } = {}) {
    this.max = max
    this.ttl = ttl
    this.store = new Map()
  }

  get(key) {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (this.ttl > 0 && Date.now() - entry.ts > this.ttl) {
      this.store.delete(key)
      return undefined
    }
    this.store.delete(key)
    this.store.set(key, entry)
    return entry.value
  }

  set(key, value) {
    if (!key) return value
    if (this.store.has(key)) this.store.delete(key)
    this.store.set(key, { value, ts: Date.now() })
    while (this.store.size > this.max) this.store.delete(this.store.keys().next().value)
    return value
  }

  delete(key) {
    return this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }

  clearExpired() {
    if (this.ttl <= 0) return
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (now - entry.ts > this.ttl) this.store.delete(key)
    }
  }

  get size() {
    return this.store.size
  }
}

const globalCaches = global.__rubyGlobalCaches ||= {
  groupMetadata: new LRUCache({ max: Number(process.env.RUBY_GROUP_METADATA_CACHE_MAX || 3000), ttl: Number(process.env.RUBY_GROUP_METADATA_CACHE_TTL_MS || 10 * 60 * 1000) }),
  commandTester: new LRUCache({ max: Number(process.env.RUBY_COMMAND_TESTER_CACHE_MAX || 5000), ttl: Number(process.env.RUBY_COMMAND_TESTER_CACHE_TTL_MS || 30 * 60 * 1000) }),
  prefixMatcher: new LRUCache({ max: Number(process.env.RUBY_PREFIX_MATCHER_CACHE_MAX || 3000), ttl: Number(process.env.RUBY_PREFIX_MATCHER_CACHE_TTL_MS || 30 * 60 * 1000) }),
  msgRetryCounter: new TTLCache({ stdTTL: Number(process.env.RUBY_MSG_RETRY_TTL_SECONDS || 5 * 60), checkperiod: 120, useClones: false }),
}

export const groupMetadataCache = globalCaches.groupMetadata
export const commandTesterCache = globalCaches.commandTester
export const prefixMatcherCache = globalCaches.prefixMatcher
export const msgRetryCounterCache = globalCaches.msgRetryCounter

export function getGlobalCacheKey(scope, id) {
  return `${scope}:${id || 'unknown'}`
}

export async function getGroupMetadataOnDemand(sock, jid, { requireParticipants = false, force = false } = {}) {
  const decodedJid = sock?.decodeJid?.(jid) || jid
  if (!sock || typeof decodedJid !== 'string' || !decodedJid.endsWith('@g.us')) return {}
  const key = decodedJid
  const cached = !force ? groupMetadataCache.get(key) : null
  if (cached?.id && (!requireParticipants || cached.participants?.length)) return cached
  const fetchGroupMetadata = sock.__rawGroupMetadata || sock.groupMetadata?.bind(sock)
  if (typeof fetchGroupMetadata !== 'function') return cached || {}
  try {
    const metadata = await fetchGroupMetadata(decodedJid)
    if (metadata?.id) {
      metadata.__cachedAt = Date.now()
      groupMetadataCache.set(key, metadata)
      global.db?.upsertGroupMetadata?.(decodedJid, metadata)
      return metadata
    }
  } catch (error) {
    const code = error?.output?.statusCode || error?.data?.statusCode || error?.statusCode
    if (![408, 428, 429].includes(Number(code))) console.error('[group-metadata-on-demand]', error?.message || error)
  }
  return cached || {}
}

export function cleanupGlobalCaches() {
  groupMetadataCache.clearExpired()
  commandTesterCache.clearExpired()
  prefixMatcherCache.clearExpired()
}

export default {
  groupMetadataCache,
  commandTesterCache,
  prefixMatcherCache,
  msgRetryCounterCache,
  getGroupMetadataOnDemand,
  cleanupGlobalCaches,
}
