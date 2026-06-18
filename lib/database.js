import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const DEFAULT_SECTIONS = ['users', 'chats', 'settings', 'stats', 'msgs', 'sticker', 'sessions']
const INTERNAL = new Set(['then', 'inspect', 'toJSON', 'valueOf', Symbol.toStringTag, Symbol.iterator])

function isObject(value) {
  return value !== null && typeof value === 'object'
}

function cloneJSON(value) {
  if (!isObject(value)) return value
  return JSON.parse(JSON.stringify(value))
}

export class SQLiteDatabase {
  constructor(filename = './src/database/database.sqlite', options = {}) {
    this.filename = filename
    this.sections = options.sections || DEFAULT_SECTIONS
    this.flushInterval = options.flushInterval || 5000
    this.cache = new Map()
    this.dirty = new Map()
    this.objectProxyCache = new WeakMap()
    this.sectionProxies = new Map()
    this.READ = null
    this.chain = null
    this._closed = false
    this._timer = null

    const dir = path.dirname(filename)
    if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true })

    this.sqlite = new Database(filename)
    this.sqlite.pragma('journal_mode = WAL')
    this.sqlite.pragma('synchronous = NORMAL')
    this.sqlite.pragma('busy_timeout = 5000')
    this.sqlite.pragma('foreign_keys = ON')
    this._prepareSchema()
    this._prepareStatements()

    this.data = this._createDataProxy()
    this._timer = setInterval(() => this.write().catch((error) => console.error('[SQLiteDB] Error en guardado periódico:', error)), this.flushInterval)
    this._timer.unref?.()
  }

  _prepareSchema() {
    const create = this.sqlite.transaction(() => {
      for (const section of this.sections) {
        this.sqlite.prepare(`CREATE TABLE IF NOT EXISTS ${this._table(section)} (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run()
      }
    })
    create()
  }

  _prepareStatements() {
    this.statements = new Map()
    for (const section of this.sections) {
      const table = this._table(section)
      this.statements.set(section, {
        get: this.sqlite.prepare(`SELECT data FROM ${table} WHERE id = ?`),
        all: this.sqlite.prepare(`SELECT id, data FROM ${table}`),
        upsert: this.sqlite.prepare(`INSERT INTO ${table} (id, data, updated_at) VALUES (?, ?, unixepoch()) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`),
        delete: this.sqlite.prepare(`DELETE FROM ${table} WHERE id = ?`),
      })
    }
  }

  _table(section) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(section)) throw new Error(`Nombre de tabla inválido: ${section}`)
    return section
  }

  _createDataProxy() {
    return new Proxy({}, {
      get: (_target, prop) => {
        if (INTERNAL.has(prop)) return undefined
        if (prop === 'toJSON') return () => this.snapshot()
        if (typeof prop !== 'string') return undefined
        return this._sectionProxy(prop)
      },
      set: (_target, prop, value) => {
        if (typeof prop !== 'string') return false
        this.replaceSection(prop, value || {})
        return true
      },
      deleteProperty: (_target, prop) => {
        if (typeof prop !== 'string') return false
        this.clearSection(prop)
        return true
      },
      ownKeys: () => Array.from(new Set([...this.sections, ...this.sectionProxies.keys()])),
      has: (_target, prop) => typeof prop === 'string' && this.sections.includes(prop),
      getOwnPropertyDescriptor: (_target, prop) => typeof prop === 'string' ? { enumerable: true, configurable: true } : undefined,
    })
  }

  _sectionProxy(section) {
    if (!this.sections.includes(section)) this.sections.push(section)
    if (!this.statements?.has(section)) {
      this._prepareSchema()
      this._prepareStatements()
    }
    if (this.sectionProxies.has(section)) return this.sectionProxies.get(section)
    const proxy = new Proxy({}, {
      get: (_target, id) => {
        if (INTERNAL.has(id)) return undefined
        if (id === 'toJSON') return () => this.getSection(section)
        if (typeof id !== 'string') return undefined
        return this.get(section, id)
      },
      set: (_target, id, value) => {
        if (typeof id !== 'string') return false
        this.set(section, id, value)
        return true
      },
      deleteProperty: (_target, id) => {
        if (typeof id !== 'string') return false
        this.delete(section, id)
        return true
      },
      ownKeys: () => Object.keys(this.getSection(section)),
      has: (_target, id) => typeof id === 'string' && this.has(section, id),
      getOwnPropertyDescriptor: (_target, id) => typeof id === 'string' && this.has(section, id) ? { enumerable: true, configurable: true } : undefined,
    })
    this.sectionProxies.set(section, proxy)
    return proxy
  }

  _cacheFor(section) {
    if (!this.cache.has(section)) this.cache.set(section, new Map())
    return this.cache.get(section)
  }

  _dirtyFor(section) {
    if (!this.dirty.has(section)) this.dirty.set(section, new Set())
    return this.dirty.get(section)
  }

  _wrap(section, id, value) {
    if (!isObject(value)) return value
    if (this.objectProxyCache.has(value)) return this.objectProxyCache.get(value)
    const proxy = new Proxy(value, {
      get: (target, prop, receiver) => {
        const current = Reflect.get(target, prop, receiver)
        return isObject(current) ? this._wrap(section, id, current) : current
      },
      set: (target, prop, val, receiver) => {
        const ok = Reflect.set(target, prop, val, receiver)
        if (ok) this._markDirty(section, id)
        return ok
      },
      deleteProperty: (target, prop) => {
        const ok = Reflect.deleteProperty(target, prop)
        if (ok) this._markDirty(section, id)
        return ok
      },
    })
    this.objectProxyCache.set(value, proxy)
    return proxy
  }

  _markDirty(section, id) {
    this._dirtyFor(section).add(id)
  }

  _parse(row, section, id) {
    if (!row) return undefined
    try { return JSON.parse(row.data) } catch (error) {
      console.error(`[SQLiteDB] JSON inválido en ${section}.${id}:`, error)
      return {}
    }
  }

  get(section, id) {
    const cache = this._cacheFor(section)
    if (!cache.has(id)) {
      const value = this._parse(this.statements.get(section).get.get(id), section, id)
      if (typeof value === 'undefined') return undefined
      cache.set(id, value)
    }
    return this._wrap(section, id, cache.get(id))
  }

  set(section, id, value) {
    this._cacheFor(section).set(id, cloneJSON(value || {}))
    this._markDirty(section, id)
  }

  has(section, id) {
    return this._cacheFor(section).has(id) || !!this.statements.get(section).get.get(id)
  }

  delete(section, id) {
    this._cacheFor(section).delete(id)
    this._dirtyFor(section).delete(id)
    this.statements.get(section).delete.run(id)
  }

  getSection(section) {
    const out = {}
    for (const row of this.statements.get(section).all.all()) {
      const value = this._parse(row, section, row.id)
      this._cacheFor(section).set(row.id, value)
      out[row.id] = this._wrap(section, row.id, value)
    }
    return out
  }

  replaceSection(section, values) {
    this.clearSection(section)
    for (const [id, value] of Object.entries(values || {})) this.set(section, id, value)
  }

  clearSection(section) {
    this.sqlite.prepare(`DELETE FROM ${this._table(section)}`).run()
    this.cache.set(section, new Map())
    this.dirty.set(section, new Set())
  }

  async read() { return this.data }

  async write() { return this.flush() }

  flush() {
    const writes = []
    for (const [section, ids] of this.dirty.entries()) {
      for (const id of ids) writes.push([section, id])
    }
    if (!writes.length) return
    const tx = this.sqlite.transaction((items) => {
      for (const [section, id] of items) {
        const value = this._cacheFor(section).get(id)
        if (typeof value !== 'undefined') this.statements.get(section).upsert.run(id, JSON.stringify(value))
      }
    })
    tx(writes)
    this.dirty.clear()
  }

  snapshot() {
    return Object.fromEntries(this.sections.map((section) => [section, this.getSection(section)]))
  }

  close() {
    if (this._closed) return
    clearInterval(this._timer)
    this.flush()
    this.sqlite.close()
    this._closed = true
  }
}

export default SQLiteDatabase
