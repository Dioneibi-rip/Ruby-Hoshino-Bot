export class CommandLoader {
constructor({ maxEntries = 40, ttlMs = 15 * 60 * 1000 } = {}) {
this.maxEntries = Math.max(1, Number(maxEntries) || 40)
this.ttlMs = Math.max(1_000, Number(ttlMs) || 900_000)
this.cache = new Map()
this.inflight = new Map()
}

prune(now = Date.now()) {
for (const [key, entry] of this.cache) if (entry.expiresAt <= now) this.cache.delete(key)
while (this.cache.size > this.maxEntries) this.cache.delete(this.cache.keys().next().value)
}

getCached(key) {
const entry = this.cache.get(key)
if (!entry) return null
if (entry.expiresAt <= Date.now()) {
this.cache.delete(key)
return null
}
this.cache.delete(key)
entry.lastUsedAt = Date.now()
this.cache.set(key, entry)
return entry.command
}

async load(metadata = {}) {
const key = metadata.fileUrl || metadata.filePath
if (!key) throw new Error('Command metadata does not include a loadable path')
this.prune()
const cached = this.getCached(key)
if (cached) return cached
if (this.inflight.has(key)) return this.inflight.get(key)
const request = import(metadata.fileUrl || metadata.filePath).then((mod) => {
const command = mod.default || mod.handler || mod.run
if (typeof command !== 'function') throw new TypeError(`Command ${metadata.name || key} does not export an executable function`)
this.cache.set(key, { command, loadedAt: Date.now(), lastUsedAt: Date.now(), expiresAt: Date.now() + this.ttlMs })
this.prune()
return command
}).finally(() => this.inflight.delete(key))
this.inflight.set(key, request)
return request
}

invalidate(pathOrUrl = '') {
return this.cache.delete(pathOrUrl)
}

clear() {
this.cache.clear()
this.inflight.clear()
}
}

export const commandLoader = new CommandLoader()
export default commandLoader
