export class TTLCache {
  constructor(ttlMs = 30_000, maxSize = 500) {
    this.ttlMs = ttlMs
    this.maxSize = maxSize
    this.store = new Map()
  }

  get(key) {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  set(key, value, ttlOverrideMs) {
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value
      if (oldestKey) this.store.delete(oldestKey)
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlOverrideMs || this.ttlMs),
    })
    return value
  }

  clearExpired() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) this.store.delete(key)
    }
  }
}

export function getPrefixMatcherCache(ctx) {
  if (!ctx.__prefixMatcherCache) ctx.__prefixMatcherCache = new Map()
  return ctx.__prefixMatcherCache
}
