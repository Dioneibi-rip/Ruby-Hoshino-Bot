import { pathToFileURL } from 'url'

const DEFAULT_MAX_ENTRIES = 40
const DEFAULT_TTL_MS = 15 * 60 * 1000

function now() {
return Date.now()
}

function resolveModuleApi(module) {
const legacy = module?.default || module?.handler || module
const modern = typeof module?.run === 'function' ? module.run : null
return { legacy, modern }
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
const api = resolveModuleApi(module)
if (!api.modern && typeof api.legacy !== 'function') throw new TypeError(`Command module has no executable export: ${meta.file || meta.path || key}`)
const entry = { module, api, touchedAt: now(), loadedAt: now(), meta }
this.cache.set(key, entry)
this.pruneLru()
return entry
}

buildLegacyOptions(ctx = {}, extra = {}) {
const safeExtra = extra || {}
const safeCtx = ctx || {}
return {
...safeExtra,
conn: safeCtx.conn || safeExtra.conn || global.conn,
db: safeCtx.db || safeExtra.db || global.db,
text: safeExtra.text || '',
args: Array.isArray(safeExtra.args) ? safeExtra.args : [],
usedPrefix: safeExtra.usedPrefix || safeExtra.prefix || '',
command: safeExtra.command || safeCtx.m?.command || '',
isOwner: Boolean(safeExtra.isOwner),
isAdmin: Boolean(safeExtra.isAdmin),
isROwner: Boolean(safeExtra.isROwner),
isBotAdmin: Boolean(safeExtra.isBotAdmin),
isPrems: Boolean(safeExtra.isPrems),
participants: Array.isArray(safeExtra.participants) ? safeExtra.participants : [],
groupMetadata: safeExtra.groupMetadata || {},
metadata: safeExtra.metadata || safeCtx.route?.meta || null,
services: safeCtx.services || safeExtra.services || {},
logger: safeCtx.logger || console,
metrics: safeCtx.metrics || null
}
}

async execute(meta, ctx, extra = {}) {
try {
const entry = await this.load(meta)
const options = this.buildLegacyOptions(ctx, extra)
if (entry.api.modern) return await entry.api.modern({ ...(ctx || {}), options, command: options.command, args: options.args, text: options.text, usedPrefix: options.usedPrefix })
return await entry.api.legacy.call(options.conn, ctx?.m, options)
} catch (error) {
ctx?.logger?.error?.('[command-loader] execution error', error)
if (ctx?.m) ctx.m.error = error
try {
await ctx?.m?.reply?.(String(error?.message || error))
} catch {}
return false
}
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
