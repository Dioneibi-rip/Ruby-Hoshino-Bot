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

const PREFIX_MATCHER_MAX = 512

export class BoundedMap extends Map {
  constructor(maxSize = 512) {
    super()
    this.maxSize = Math.max(1, Number(maxSize) || 1)
  }

  set(key, value) {
    if (this.has(key)) this.delete(key)
    super.set(key, value)
    while (this.size > this.maxSize) {
      const oldestKey = this.keys().next().value
      if (oldestKey === undefined) break
      this.delete(oldestKey)
    }
    return this
  }
}

export function getPrefixMatcherCache(ctx) {
  if (!ctx.__prefixMatcherCache) ctx.__prefixMatcherCache = new BoundedMap(PREFIX_MATCHER_MAX)
  return ctx.__prefixMatcherCache
}
