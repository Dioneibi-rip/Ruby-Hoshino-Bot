import { pathToFileURL } from 'url'

const DEFAULT_MAX_ENTRIES = 40
const DEFAULT_TTL_MS = 15 * 60 * 1000

function now() {
return Date.now()
}

function resolveExecutable(module) {
const candidate = module?.default || module?.run || module?.handler || module
if (typeof candidate === 'function') return candidate
if (typeof candidate?.run === 'function') return candidate.run.bind(candidate)
return null
}

export class CommandLoader {
constructor({ maxEntries = DEFAULT_MAX_ENTRIES, ttlMs = DEFAULT_TTL_MS } = {}) {
this.maxEntries = Math.max(1, Number(maxEntries) || DEFAULT_MAX_ENTRIES)
this.ttlMs = Math.max(1_000, Number(ttlMs) || DEFAULT_TTL_MS)
this.cache = new Map()
}

pruneExpired() {
const timestamp = now()
for (const [key, entry] of this.cache) {
if (timestamp - entry.touchedAt > this.ttlMs) this.cache.delete(key)
}
}

pruneLru() {
while (this.cache.size > this.maxEntries) {
const oldest = this.cache.keys().next().value
if (oldest === undefined) break
this.cache.delete(oldest)
}
}

async load(meta) {
if (!meta?.path && !meta?.url) throw new TypeError('Command metadata must include path or url')
this.pruneExpired()
const key = meta.url || pathToFileURL(meta.path).href
const cached = this.cache.get(key)
if (cached && now() - cached.touchedAt <= this.ttlMs) {
const refreshed = { ...cached, touchedAt: now() }
this.cache.delete(key)
this.cache.set(key, refreshed)
return refreshed
}
const module = await import(key)
const executable = resolveExecutable(module)
if (!executable) throw new TypeError(`Command module has no executable export: ${meta.file || meta.path || key}`)
const entry = { module, executable, touchedAt: now(), loadedAt: now(), meta }
this.cache.set(key, entry)
this.pruneLru()
return entry
}

async execute(meta, ctx, extra = {}) {
const entry = await this.load(meta)
return entry.executable.call(ctx?.conn, ctx?.m, extra)
}

invalidate(metaOrKey) {
const key = typeof metaOrKey === 'string' ? metaOrKey : metaOrKey?.url || (metaOrKey?.path ? pathToFileURL(metaOrKey.path).href : '')
if (!key) return false
return this.cache.delete(key)
}

clear() {
this.cache.clear()
}
}

export const commandLoader = new CommandLoader()
export default commandLoader
