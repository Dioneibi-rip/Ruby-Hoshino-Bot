import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { serialize, deserialize } from 'v8'

const DEFAULT_SECTIONS = ['users', 'chats', 'settings', 'stats', 'msgs', 'sticker', 'sessions', 'codes', 'owners', 'marriages', 'characters', 'character_favorites', 'harem', 'group_votes', 'claim_config', 'waifus_venta', 'fake_links']
const INTERNAL_PROPS = new Set(['then', 'inspect', 'toJSON', 'valueOf', Symbol.toStringTag, Symbol.iterator])
const RETRYABLE_SQLITE_CODES = new Set(['SQLITE_BUSY', 'SQLITE_LOCKED'])

function isObject(value) { return value !== null && typeof value === 'object' }
function cloneValue(value) { return typeof structuredClone === 'function' ? structuredClone(value) : deserialize(serialize(value)) }
function safeName(value, label = 'identificador') {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error(`${label} inválido: ${value}`)
  return value
}
function encodeValue(value) { return serialize(value) }
function decodeValue(value) { return typeof value === 'undefined' ? undefined : deserialize(value) }

export class SQLiteDatabase {
  constructor(filename = './src/database/database.sqlite', options = {}) {
    this.filename = filename
    this.sections = [...new Set(options.sections || DEFAULT_SECTIONS)]
    this.flushInterval = options.flushInterval || 5000
    this.autoFlush = options.autoFlush !== false
    this.maxWriteRetries = options.maxWriteRetries || 3
    this.cache = new Map()
    this.dirty = new Map()
    this.rawToProxy = new WeakMap()
    this.proxyToRaw = new WeakMap()
    this.sectionProxies = new Map()
    this.READ = null
    this.chain = null
    this._closed = false
    this._flushing = false
    this._timer = null

    const dir = path.dirname(filename)
    if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true })

    this.sqlite = new Database(filename)
    this.sqlite.pragma('journal_mode = WAL')
    this.sqlite.pragma('synchronous = NORMAL')
    this.sqlite.pragma('busy_timeout = 10000')
    this.sqlite.pragma('foreign_keys = ON')
    this._prepareSchema()
    this._prepareStatements()
    this.data = this._createDataProxy()
    this._timer = setInterval(() => this.write().catch((error) => console.error('[SQLiteDB] Error en guardado periódico:', error)), this.flushInterval)
    this._timer.unref?.()
  }

  _prepareSchema() {
    this._runWithRetry(() => {
      this.sqlite.prepare(`CREATE TABLE IF NOT EXISTS records (section TEXT NOT NULL, id TEXT NOT NULL, value BLOB NOT NULL, updated_at INTEGER NOT NULL DEFAULT (unixepoch()), PRIMARY KEY (section, id))`).run()
      this.sqlite.prepare('CREATE INDEX IF NOT EXISTS idx_records_section ON records(section)').run()
      this.sqlite.prepare(`CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)`).run()
      this.sqlite.prepare(`INSERT INTO metadata (key, value) VALUES ('schema_version', '2') ON CONFLICT(key) DO NOTHING`).run()
    })
  }

  _prepareStatements() {
    this.statements = {
      get: this.sqlite.prepare('SELECT value FROM records WHERE section = ? AND id = ?'),
      all: this.sqlite.prepare('SELECT id, value FROM records WHERE section = ?'),
      upsert: this.sqlite.prepare('INSERT INTO records (section, id, value, updated_at) VALUES (?, ?, ?, unixepoch()) ON CONFLICT(section, id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'),
      delete: this.sqlite.prepare('DELETE FROM records WHERE section = ? AND id = ?'),
      clear: this.sqlite.prepare('DELETE FROM records WHERE section = ?'),
    }
  }

  _ensureSection(section) { safeName(section, 'sección'); if (!this.sections.includes(section)) this.sections.push(section) }
  _runWithRetry(operation) { let lastError; for (let attempt = 0; attempt <= this.maxWriteRetries; attempt++) { try { return operation() } catch (error) { lastError = error; if (!RETRYABLE_SQLITE_CODES.has(error?.code) || attempt === this.maxWriteRetries) throw error } } throw lastError }
  _createDataProxy() { return new Proxy(Object.create(null), { get: (_target, prop) => { if (INTERNAL_PROPS.has(prop)) return undefined; if (prop === 'toJSON') return () => this.snapshot(); if (typeof prop !== 'string') return undefined; return this._sectionProxy(prop) }, set: (_target, prop, value) => { if (typeof prop !== 'string') return false; this.replaceSection(prop, value || {}); return true }, deleteProperty: (_target, prop) => { if (typeof prop !== 'string') return false; this.clearSection(prop); return true }, ownKeys: () => Array.from(new Set([...this.sections, ...this.sectionProxies.keys()])), has: (_target, prop) => typeof prop === 'string' && this.sections.includes(prop), getOwnPropertyDescriptor: (_target, prop) => typeof prop === 'string' ? { enumerable: true, configurable: true } : undefined }) }
  _sectionProxy(section) { this._ensureSection(section); if (this.sectionProxies.has(section)) return this.sectionProxies.get(section); const proxy = new Proxy(Object.create(null), { get: (_target, id) => { if (INTERNAL_PROPS.has(id)) return undefined; if (id === 'toJSON') return () => this.getSection(section); if (typeof id !== 'string') return undefined; return this.get(section, id) }, set: (_target, id, value) => { if (typeof id !== 'string') return false; this.set(section, id, value); return true }, deleteProperty: (_target, id) => { if (typeof id !== 'string') return false; this.delete(section, id); return true }, ownKeys: () => Object.keys(this.getSection(section)), has: (_target, id) => typeof id === 'string' && this.has(section, id), getOwnPropertyDescriptor: (_target, id) => typeof id === 'string' && this.has(section, id) ? { enumerable: true, configurable: true } : undefined }); this.sectionProxies.set(section, proxy); return proxy }
  _cacheFor(section) { if (!this.cache.has(section)) this.cache.set(section, new Map()); return this.cache.get(section) }
  _dirtyFor(section) { if (!this.dirty.has(section)) this.dirty.set(section, new Set()); return this.dirty.get(section) }
  _contextKey(section, id) { return `${section}\u0000${id}` }
  _unwrap(value) { return this.proxyToRaw.get(value) || value }
  _wrap(section, id, value) { if (!isObject(value)) return value; if (this.proxyToRaw.has(value)) return value; const contextKey = this._contextKey(section, id); let contextMap = this.rawToProxy.get(value); if (!contextMap) { contextMap = new Map(); this.rawToProxy.set(value, contextMap) } if (contextMap.has(contextKey)) return contextMap.get(contextKey); const proxy = new Proxy(value, { get: (target, prop) => { if (prop === 'toJSON') return () => target; const current = target[prop]; return isObject(current) ? this._wrap(section, id, current) : current }, set: (target, prop, incoming) => { target[prop] = this._unwrap(incoming); this._markDirty(section, id); return true }, deleteProperty: (target, prop) => { if (Object.prototype.hasOwnProperty.call(target, prop)) { delete target[prop]; this._markDirty(section, id) } return true }, defineProperty: (target, prop, descriptor) => { if ('value' in descriptor) descriptor.value = this._unwrap(descriptor.value); const ok = Reflect.defineProperty(target, prop, descriptor); if (ok) this._markDirty(section, id); return ok } }); this.proxyToRaw.set(proxy, value); contextMap.set(contextKey, proxy); return proxy }
  _markDirty(section, id) { this._dirtyFor(section).add(id); if (this.autoFlush && !this._flushing && !this._closed) this.flush() }
  _parse(row) { if (!row) return undefined; try { const parsed = decodeValue(row.value); return isObject(parsed) ? parsed : {} } catch (error) { console.error('[SQLiteDB] Valor binario inválido:', error); return {} } }
  get(section, id) { this._ensureSection(section); const cache = this._cacheFor(section); if (!cache.has(id)) { const value = this._parse(this.statements.get.get(section, id)); if (typeof value === 'undefined') return undefined; cache.set(id, value) } return this._wrap(section, id, cache.get(id)) }
  set(section, id, value) { this._ensureSection(section); this._cacheFor(section).set(id, cloneValue(this._unwrap(value) || {})); this._markDirty(section, id) }
  getUser(id) { if (!id || typeof id !== 'string') throw new TypeError('getUser requiere un id de usuario válido'); let user = this.get('users', id); if (!user) { this.set('users', id, { coin: 0, bank: 0 }); user = this.get('users', id) } return user }
  updateUser(id, patch = {}) { const current = cloneValue(this._unwrap(this.getUser(id)) || {}); const next = { ...current, ...cloneValue(this._unwrap(patch) || {}) }; this.set('users', id, next); this.flush(); return this.get('users', id) }
  _normalizeEconomyField(field = 'coin') { const aliases = { coins: 'coin', dinero: 'coin', money: 'coin', cartera: 'coin', banco: 'bank', limit: 'limit' }; const key = aliases[field] || field; safeName(key, 'campo de economía'); return key }
  setEconomy(id, field, value) { const key = this._normalizeEconomyField(field); const amount = Number(value); if (!Number.isFinite(amount)) throw new TypeError(`Valor inválido para ${key}: ${value}`); return this.updateUser(id, { [key]: amount }) }
  addMoney(id, amount, field = 'coin') { const key = this._normalizeEconomyField(field); const delta = Number(amount); if (!Number.isFinite(delta)) throw new TypeError(`Cantidad inválida para ${key}: ${amount}`); const user = this.getUser(id); const current = Number(user[key]) || 0; return this.updateUser(id, { [key]: current + delta }) }
  addEconomy(id, fieldOrAmount, maybeAmount) { if (typeof fieldOrAmount === 'string') return this.addMoney(id, maybeAmount, fieldOrAmount); return this.addMoney(id, fieldOrAmount, maybeAmount || 'coin') }
  has(section, id) { this._ensureSection(section); return this._cacheFor(section).has(id) || !!this.statements.get.get(section, id) }
  delete(section, id) { this._ensureSection(section); this._cacheFor(section).delete(id); this._dirtyFor(section).delete(id); this._runWithRetry(() => this.statements.delete.run(section, id)) }
  getSection(section) { this._ensureSection(section); const out = {}; for (const row of this.statements.all.all(section)) { const value = this._parse(row); this._cacheFor(section).set(row.id, value); out[row.id] = this._wrap(section, row.id, value) } return out }
  replaceSection(section, values) { this.clearSection(section); for (const [id, value] of Object.entries(values || {})) this.set(section, id, value) }
  clearSection(section) { this._ensureSection(section); this._runWithRetry(() => this.statements.clear.run(section)); this.cache.set(section, new Map()); this.dirty.set(section, new Set()) }
  async read() { return this.data }
  async write() { return this.flush() }
  flush() { if (this._flushing) return; const writes = []; for (const [section, ids] of this.dirty.entries()) for (const id of ids) { const value = this._cacheFor(section).get(id); if (typeof value !== 'undefined') writes.push([section, id, encodeValue(this._unwrap(value))]) } if (!writes.length) return; this._flushing = true; try { this._runWithRetry(() => this.sqlite.transaction((items) => { for (const [section, id, payload] of items) this.statements.upsert.run(section, id, payload) })(writes)); for (const [section, id] of writes) this._dirtyFor(section).delete(id) } finally { this._flushing = false } }
  snapshot() { return Object.fromEntries(this.sections.map((section) => [section, this.getSection(section)])) }
  close() { if (this._closed) return; clearInterval(this._timer); this.flush(); this.sqlite.close(); this._closed = true }
}

export default SQLiteDatabase
