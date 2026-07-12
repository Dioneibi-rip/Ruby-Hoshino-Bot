import mongoose from 'mongoose'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import path from 'path'

const DEFAULT_MONGO_OPTIONS = {
  maxPoolSize: Number(process.env.MONGODB_POOL_SIZE || 50),
  minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 2),
  serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10_000),
  socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 45_000),
  retryWrites: true,
  autoIndex: process.env.NODE_ENV !== 'production'
}

const USER_DEFAULTS = {
  coin: 0, bank: 0, exp: 0, level: 0, role: '*Chibi Aventurero/a V*🐙', limit: 0, health: 100, warn: 0,
  name: '', customName: '', registered: true, age: -1, regTime: -1, birth: '', genre: '', description: '',
  premium: false, premiumTime: 0, banned: false, bannedReason: '', antispam: 0, muto: false, mutoChat: '', lastBanMsg: 0,
  job: 'Ninguno', jobSince: 0, jobXp: 0, commands: 0, msg_count: 0,
  lastclaim: 0, lastmonthly: 0, monthly: 0, weekly: 0, dailyStreak: 0, lastwork: 0, lastAdventure: 0,
  lastmining: 0, lastmiming: 0, lastrob: 0, lastrob2: 0, lastHeal: 0, halloween: 0, christmas: 0,
  diamond: 0, diamonds: 0, emerald: 0, iron: 0, gold: 0, coal: 0, stone: 0, candies: 0, gifts: 0,
  joincount: 0, pickaxedurability: 100, marry: '', extras: {}
}

const NUMERIC_FIELDS = new Set(Object.entries(USER_DEFAULTS).filter(([, value]) => typeof value === 'number').map(([key]) => key))
const BOOLEAN_FIELDS = new Set(Object.entries(USER_DEFAULTS).filter(([, value]) => typeof value === 'boolean').map(([key]) => key))
const INTERNAL_PROPS = new Set(['then', 'inspect', 'toJSON', 'valueOf', Symbol.toStringTag, Symbol.iterator])
const SECTION_COLLECTIONS = ['chats', 'settings', 'stats', 'msgs', 'sticker', 'sessions', 'codes', 'groups', 'marriages', 'harem', 'gacha_market', 'claim_config', 'character_favorites']

function clone(value) { return JSON.parse(JSON.stringify(value ?? {})) }
function now() { return Date.now() }
function normalizeSearchText(text = '') { return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim() }
function findCharactersFile() { return [path.resolve('./src/database/characters.json'), path.resolve('./database/characters.json')].find(candidate => existsSync(candidate)) }
function keyFor(section, id) { return `${section}:${id}` }

class TTLMap {
  constructor(ttlMs = 30 * 60 * 1000, maxSize = 25_000) {
    this.ttlMs = ttlMs
    this.maxSize = maxSize
    this.store = new Map()
  }
  _entry(value, ttlMs = this.ttlMs) { return { value, expiresAt: Date.now() + ttlMs } }
  _evict() {
    const now = Date.now()
    for (const [key, entry] of this.store) if (entry.expiresAt <= now) this.store.delete(key)
    while (this.store.size > this.maxSize) this.store.delete(this.store.keys().next().value)
  }
  get(key) {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) { this.store.delete(key); return undefined }
    this.store.delete(key)
    this.store.set(key, entry)
    return entry.value
  }
  set(key, value, ttlMs) {
    if (this.store.has(key)) this.store.delete(key)
    this.store.set(key, this._entry(value, ttlMs))
    if (this.store.size > this.maxSize) this._evict()
    return this
  }
  has(key) { return this.get(key) !== undefined }
  delete(key) { return this.store.delete(key) }
  clear() { this.store.clear() }
  keys() { this._evict(); return this.store.keys() }
  entries() { this._evict(); return [...this.store.entries()].map(([key, entry]) => [key, entry.value])[Symbol.iterator]() }
  values() { this._evict(); return [...this.store.values()].map(entry => entry.value)[Symbol.iterator]() }
  get size() { this._evict(); return this.store.size }
}

const MONGO_CACHE_TTL_MS = Number(process.env.MONGODB_CACHE_TTL_MS || 30 * 60 * 1000)
const MONGO_USER_CACHE_MAX = Number(process.env.MONGODB_USER_CACHE_MAX || 50_000)
const MONGO_RECORD_CACHE_MAX = Number(process.env.MONGODB_RECORD_CACHE_MAX || 75_000)
const MONGO_BATCH_DELAY_MS = Number(process.env.MONGODB_BATCH_DELAY_MS || 5_000)
const CHARACTER_SEARCH_CACHE_TTL_MS = Number(process.env.CHARACTER_SEARCH_CACHE_TTL_MS || 10 * 60 * 1000)
const MONGO_LISTENER_KEY = Symbol.for('ruby-hoshino.mongo.listeners')
const MONGO_INSTANCE_SET_KEY = Symbol.for('ruby-hoshino.mongo.instances')

function normalizeUser(id, value = {}) {
  const source = { ...clone(USER_DEFAULTS), ...(clone(value) || {}), id }
  delete source._id
  source.extras = source.extras && typeof source.extras === 'object' && !Array.isArray(source.extras) ? source.extras : {}
  for (const field of NUMERIC_FIELDS) source[field] = Number.isFinite(Number(source[field])) ? Number(source[field]) : USER_DEFAULTS[field]
  for (const field of BOOLEAN_FIELDS) source[field] = Boolean(source[field])
  return source
}
function normalizeUserForInsert(id, setPatch = {}) {
  const insertData = normalizeUser(id)
  delete insertData.extras
  for (const path of Object.keys(setPatch || {})) {
    const root = path.split('.')[0]
    if (root) delete insertData[root]
  }
  return insertData
}
function splitUserPatch(patch = {}) {
  const $set = { updatedAt: new Date() }
  for (const [key, value] of Object.entries(patch || {})) {
    if (key === 'id' || key === '_id' || key === 'createdAt' || key === 'updatedAt') continue
    if (key === 'extras' && value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [extraKey, extraValue] of Object.entries(value)) $set[`extras.${extraKey}`] = extraValue
    } else if (key in USER_DEFAULTS) {
      $set[key] = value instanceof Date ? value.getTime() : value
    } else {
      $set[`extras.${key}`] = value instanceof Date ? value.getTime() : value
    }
  }
  return $set
}

function createMongoSqliteCompatibility(db) {
  const unsupported = (sql) => { throw new Error(`[mongodb] Consulta SQLite no soportada por el adaptador de compatibilidad: ${sql}`) }
  return {
    prepare(sql = '') {
      const normalized = String(sql || '').replace(/\s+/g, ' ').trim().toLowerCase()
      if (normalized.includes('from character_favorites') && normalized.includes('group by character_id')) {
        return { all: () => {
          const counts = new Map()
          for (const characterId of Object.values(db.getSection('character_favorites') || {})) if (characterId) counts.set(characterId, (counts.get(characterId) || 0) + 1)
          return [...counts.entries()].map(([character_id, total]) => ({ character_id, total })).sort((a, b) => b.total - a.total).slice(0, 11)
        } }
      }
      if (normalized.includes('select character_id from character_favorites where user_id')) {
        return { get: (userId) => {
          const character_id = db.getSection('character_favorites')?.[userId]
          return character_id ? { character_id } : undefined
        } }
      }
      if (normalized.startsWith('insert into character_favorites')) {
        return { run: (userId, characterId) => db.set('character_favorites', userId, String(characterId || '')) }
      }
      if (normalized.includes('delete from claim_config where user_id')) {
        return { run: (userId) => db.delete('claim_config', userId) }
      }
      if (normalized.startsWith('insert into claim_config')) {
        return { run: (userId, message) => db.set('claim_config', userId, String(message || '')) }
      }
      return { all: () => unsupported(sql), get: () => unsupported(sql), run: () => unsupported(sql) }
    }
  }
}

function applyPatchToUser(id, current, patch = {}) {
  const next = normalizeUser(id, current)
  for (const [key, value] of Object.entries(patch || {})) {
    if (key === 'id' || key === '_id') continue
    if (key === 'extras' && value && typeof value === 'object' && !Array.isArray(value)) next.extras = { ...next.extras, ...value }
    else if (key in USER_DEFAULTS) next[key] = value instanceof Date ? value.getTime() : value
    else next.extras[key] = value instanceof Date ? value.getTime() : value
  }
  return normalizeUser(id, next)
}

const userSchema = new mongoose.Schema({
  _id: { type: String, alias: 'id' },
  ...Object.fromEntries(Object.entries(USER_DEFAULTS).map(([key, value]) => [key, { type: mongoose.Schema.Types.Mixed, default: clone(value) }]))
}, { strict: false, timestamps: true, minimize: false, versionKey: false })
userSchema.index({ level: -1 })
userSchema.index({ coin: -1 })
userSchema.index({ bank: -1 })
userSchema.index({ premiumTime: 1 })
userSchema.index({ marry: 1 })

const recordSchema = new mongoose.Schema({
  section: { type: String, required: true, index: true },
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { strict: false, timestamps: true, minimize: false, versionKey: false })
recordSchema.index({ section: 1, key: 1 }, { unique: true })

export class MongoDatabase {
  constructor(_legacySqliteFilename = './src/database/database.sqlite', { uri = process.env.MONGODB_URI, dbName = process.env.MONGODB_DB_NAME } = {}) {
    if (!uri) throw new Error('MONGODB_URI es obligatorio; configúralo como variable de entorno y no lo hardcodees')
    this.uri = uri
    this.dbName = dbName
    this.connected = false
    this.userCache = new TTLMap(MONGO_CACHE_TTL_MS, MONGO_USER_CACHE_MAX)
    this.userProxyCache = new TTLMap(MONGO_CACHE_TTL_MS, MONGO_USER_CACHE_MAX)
    this.userCacheVersions = new TTLMap(MONGO_CACHE_TTL_MS, MONGO_USER_CACHE_MAX)
    this.userDirtyFields = new TTLMap(MONGO_CACHE_TTL_MS, MONGO_USER_CACHE_MAX)
    this.sectionCache = new TTLMap(MONGO_CACHE_TTL_MS, MONGO_RECORD_CACHE_MAX)
    this.recordProxyCache = new TTLMap(MONGO_CACHE_TTL_MS, MONGO_RECORD_CACHE_MAX)
    this.pendingWrites = new Set()
    this.pendingUserPatches = new Map()
    this.pendingRecordWrites = new Map()
    this.pendingRecordDeletes = new Map()
    this.batchFlushTimer = null
    this.batchDelayMs = MONGO_BATCH_DELAY_MS
    this.characterSearchCache = { file: '', loadedAt: 0, rows: [], promise: null }
    this.User = mongoose.models.User || mongoose.model('User', userSchema, 'users')
    this.Record = mongoose.models.DbRecord || mongoose.model('DbRecord', recordSchema, 'records')
    this.sqlite = createMongoSqliteCompatibility(this)
    this.ready = this.connect()
    this.data = this._createDataFacade()
    globalThis[MONGO_INSTANCE_SET_KEY] ||= new Set()
    globalThis[MONGO_INSTANCE_SET_KEY].add(this)
  }

  _ensureConnectionListeners() {
    if (mongoose.connection[MONGO_LISTENER_KEY]) return
    const onDisconnected = () => {
      for (const instance of globalThis[MONGO_INSTANCE_SET_KEY] || []) instance.connected = false
      console.error('[mongodb] conexión perdida; mongoose intentará reconectar')
    }
    const onReconnected = () => {
      for (const instance of globalThis[MONGO_INSTANCE_SET_KEY] || []) instance.connected = true
      console.info('[mongodb] conexión restaurada')
    }
    mongoose.connection.on('disconnected', onDisconnected)
    mongoose.connection.on('reconnected', onReconnected)
    mongoose.connection[MONGO_LISTENER_KEY] = { onDisconnected, onReconnected }
  }

  async connect() {
    try {
      if (mongoose.connection.readyState === 0) await mongoose.connect(this.uri, { ...DEFAULT_MONGO_OPTIONS, dbName: this.dbName })
      this.connected = true
      this._ensureConnectionListeners()
      return mongoose.connection
    } catch (error) {
      this.connected = false
      console.error('[mongodb] no se pudo conectar a MongoDB', error)
      throw error
    }
  }

  _userVersion(id) { return this.userCacheVersions.get(id) || 0 }
  _bumpUserVersion(id) { const version = this._userVersion(id) + 1; this.userCacheVersions.set(id, version); return version }
  _markUserDirty(id, patch = {}) {
    const dirty = this.userDirtyFields.get(id) || new Set()
    for (const key of Object.keys(patch || {})) dirty.add(key in USER_DEFAULTS ? key : 'extras')
    this.userDirtyFields.set(id, dirty)
  }
  _mergeUserDocument(id, doc, preferCache = false) {
    if (!doc) return this.userCache.get(id) || normalizeUser(id)
    const fromDb = normalizeUser(id, doc)
    if (!preferCache) return fromDb
    const current = normalizeUser(id, this.userCache.get(id))
    const dirty = this.userDirtyFields.get(id) || new Set()
    const merged = { ...fromDb }
    for (const field of dirty) {
      if (field === 'extras') merged.extras = { ...(fromDb.extras || {}), ...(current.extras || {}) }
      else merged[field] = current[field]
    }
    return normalizeUser(id, merged)
  }

  _trackWrite(promise) {
    const tracked = Promise.resolve(promise).catch(error => {
      console.error('[mongodb] escritura fallida', error)
      return null
    }).finally(() => this.pendingWrites.delete(tracked))
    this.pendingWrites.add(tracked)
    return tracked
  }

  _scheduleBatchFlush() {
    if (this.batchFlushTimer) return
    this.batchFlushTimer = setTimeout(() => {
      this.batchFlushTimer = null
      this._flushBatches().catch(error => console.error('[mongodb] batch flush fallido', error))
    }, this.batchDelayMs)
    this.batchFlushTimer.unref?.()
  }

  _queueUserWrite(id, patch = {}) {
    const current = this.pendingUserPatches.get(id) || {}
    this.pendingUserPatches.set(id, { ...current, ...(patch || {}) })
    this._scheduleBatchFlush()
    return Promise.resolve(this._userProxy(id))
  }

  _queueRecordWrite(section, id, value) {
    const cacheKey = keyFor(section, id)
    this.pendingRecordDeletes.delete(cacheKey)
    this.pendingRecordWrites.set(cacheKey, { section, id, value: clone(value) })
    this._scheduleBatchFlush()
    return Promise.resolve(value)
  }

  _queueRecordDelete(section, id) {
    const cacheKey = keyFor(section, id)
    this.pendingRecordWrites.delete(cacheKey)
    this.pendingRecordDeletes.set(cacheKey, { section, id })
    this._scheduleBatchFlush()
    return Promise.resolve(null)
  }

  async _flushBatches() {
    await this.ready
    const userEntries = [...this.pendingUserPatches.entries()]
    const recordWrites = [...this.pendingRecordWrites.values()]
    const recordDeletes = [...this.pendingRecordDeletes.values()]
    if (!userEntries.length && !recordWrites.length && !recordDeletes.length) return
    this.pendingUserPatches.clear()
    this.pendingRecordWrites.clear()
    this.pendingRecordDeletes.clear()
    const operations = []
    if (userEntries.length) {
      operations.push(this.User.bulkWrite(userEntries.map(([id, patch]) => {
        const $set = splitUserPatch(patch)
        return { updateOne: { filter: { _id: id }, update: { $setOnInsert: normalizeUserForInsert(id, $set), $set }, upsert: true } }
      }), { ordered: false }))
      for (const [id] of userEntries) this.userDirtyFields.delete(id)
    }
    if (recordWrites.length) {
      operations.push(this.Record.bulkWrite(recordWrites.map(({ section, id, value }) => ({ updateOne: { filter: { section, key: id }, update: { $set: { value } }, upsert: true } })), { ordered: false }))
    }
    if (recordDeletes.length) {
      operations.push(this.Record.bulkWrite(recordDeletes.map(({ section, id }) => ({ deleteOne: { filter: { section, key: id } } })), { ordered: false }))
    }
    await Promise.all(operations.map(operation => this._trackWrite(operation)))
  }

  async read() {
    await this.ready
    const [users, records] = await Promise.all([
      this.User.find({}).lean(),
      this.Record.find({ section: { $in: SECTION_COLLECTIONS } }).lean()
    ])
    for (const row of users) this.userCache.set(row._id, normalizeUser(row._id, row))
    for (const row of records) this.sectionCache.set(keyFor(row.section, row.key), clone(row.value))
    return this.data
  }
  async write() { if (this.batchFlushTimer) { clearTimeout(this.batchFlushTimer); this.batchFlushTimer = null }; await this._flushBatches(); await Promise.allSettled([...this.pendingWrites]) }
  async save() { return this.write() }
  async flush() { return this.write() }
  async close() { await this.write(); globalThis[MONGO_INSTANCE_SET_KEY]?.delete(this); try { await mongoose.connection.close(false) } catch (error) { console.error('[mongodb] error cerrando conexión', error) } }

  getUser(id) {
    if (!id || typeof id !== 'string') throw new TypeError('getUser requiere un id de usuario válido')
    if (!this.userCache.has(id)) {
      this.userCache.set(id, normalizeUser(id))
      this._queueUserWrite(id, {})
    }
    return this._userProxy(id)
  }
  async getUserAsync(id) { await this.ready; if (!this.userCache.has(id)) await this.updateUser(id, {}); return this.getUser(id) }

  updateUser(id, patch = {}) {
    if (!id || typeof id !== 'string') throw new TypeError('updateUser requiere un id de usuario válido')
    const next = applyPatchToUser(id, this.userCache.get(id), patch)
    this.userCache.set(id, next)
    this._markUserDirty(id, patch)
    this._bumpUserVersion(id)
    return this._queueUserWrite(id, patch)
  }

  incrementUserField(id, field, delta) {
    const amount = Number(delta) || 0
    const user = this.getUser(id)
    const current = Number(user[field]) || 0
    user[field] = current + amount
    return user
  }
  addMoney(id, amount, field = 'coin') { return this.incrementUserField(id, field, amount) }
  addEconomy(id, fieldOrAmount, maybeAmount) { return typeof fieldOrAmount === 'string' ? this.addMoney(id, maybeAmount, fieldOrAmount) : this.addMoney(id, fieldOrAmount, maybeAmount || 'coin') }
  setEconomy(id, field, value) { return this.updateUser(id, { [field]: value }) }
  async userExists(id) { await this.ready; return this.userCache.has(id) || Boolean(await this.User.exists({ _id: id })) }
  listUsers() { return Object.fromEntries([...this.userCache.entries()].map(([id, user]) => [id, normalizeUser(id, user)])) }
  listUserRows() { return Object.entries(this.listUsers()).map(([id, user]) => ({ ...user, id })) }
  async listUsersAsync() { await this.ready; const rows = await this.User.find({}).lean(); for (const row of rows) this.userCache.set(row._id, normalizeUser(row._id, row)); return this.listUsers() }

  _userProxy(id) {
    if (this.userProxyCache.has(id)) return this.userProxyCache.get(id)
    const proxy = new Proxy({}, {
      get: (_target, prop) => {
        if (INTERNAL_PROPS.has(prop)) return undefined
        if (prop === 'id') return id
        if (prop === 'toJSON') return () => clone(this.userCache.get(id) || normalizeUser(id))
        const user = this.userCache.get(id) || normalizeUser(id)
        return Object.prototype.hasOwnProperty.call(user, prop) ? user[prop] : user.extras?.[prop]
      },
      set: (_target, prop, value) => {
        if (typeof prop !== 'string') return false
        const user = normalizeUser(id, this.userCache.get(id))
        if (prop in USER_DEFAULTS) user[prop] = value
        else user.extras[prop] = value
        this.userCache.set(id, normalizeUser(id, user))
        this.updateUser(id, { [prop]: value })
        return true
      },
      deleteProperty: (_target, prop) => {
        if (typeof prop !== 'string') return false
        const user = normalizeUser(id, this.userCache.get(id))
        if (prop in USER_DEFAULTS) user[prop] = USER_DEFAULTS[prop]
        else delete user.extras[prop]
        this.userCache.set(id, normalizeUser(id, user))
        const update = prop in USER_DEFAULTS ? { [prop]: USER_DEFAULTS[prop] } : { extras: user.extras }
        this.updateUser(id, update)
        return true
      },
      ownKeys: () => Object.keys(this.userCache.get(id) || normalizeUser(id)),
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true })
    })
    this.userProxyCache.set(id, proxy)
    return proxy
  }

  getChat(id) { return this.normalizeChatDefaults(this.get('chats', id) || {}) }
  updateChat(id, patch = {}) { const chat = this.normalizeChatDefaults({ ...this.getChat(id), ...(patch || {}) }); this.set('chats', id, chat); return chat }
  normalizeChatDefaults(chat = {}) {
    if (typeof chat.welcome === 'undefined') chat.welcome = true
    if (typeof chat.antiLink === 'undefined') chat.antiLink = true
    if (typeof chat.antilink === 'undefined') chat.antilink = true
    if (typeof chat.detect === 'undefined') chat.detect = true
    const primary = chat.primaryBot ?? chat.botPrimario ?? null
if (primary) {
chat.primaryBot = primary
chat.botPrimario = primary
} else {
if (typeof chat.primaryBot === 'undefined') chat.primaryBot = null
if (typeof chat.botPrimario === 'undefined') chat.botPrimario = null
}
if (!chat.botSettings || typeof chat.botSettings !== 'object' || Array.isArray(chat.botSettings)) chat.botSettings = {}
    if (chat.isBanned === true) chat.isBanned = { '*': true }
    else if (!chat.isBanned || typeof chat.isBanned !== 'object') chat.isBanned = {}
    chat.bannedBots = Object.entries(chat.botSettings).filter(([, value]) => value?.isBanned === true).map(([jid]) => jid)
    return chat
  }

  getSection(section) {
    if (section === 'users') return this.listUsers()
    const prefix = `${section}:`
    return Object.fromEntries([...this.sectionCache.entries()].filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key.slice(prefix.length), clone(value)]))
  }
  async getSectionAsync(section) { await this.ready; const rows = await this.Record.find({ section }).lean(); for (const row of rows) this.sectionCache.set(keyFor(section, row.key), clone(row.value)); return this.getSection(section) }
  replaceSection(section, values = {}) {
    for (const key of [...this.sectionCache.keys()]) if (key.startsWith(`${section}:`)) this.sectionCache.delete(key)
    for (const [id, value] of Object.entries(values || {})) this.sectionCache.set(keyFor(section, id), clone(value))
    return this._trackWrite(this.Record.deleteMany({ section }).then(() => {
      const entries = Object.entries(values || {})
      if (!entries.length) return null
      return this.Record.bulkWrite(entries.map(([key, value]) => ({ updateOne: { filter: { section, key }, update: { $set: { value } }, upsert: true } })), { ordered: false })
    }))
  }
  _recordProxy(section, id, value) {
    if (!id || value == null || typeof value !== 'object') return value
    const cacheKey = keyFor(section, id)
    const cached = this.recordProxyCache.get(cacheKey)
    if (cached?.target === value) return cached.proxy
    const persist = () => this.set(section, id, value)
    const wrap = (target) => {
      if (target == null || typeof target !== 'object') return target
      return new Proxy(target, {
        get: (obj, prop) => {
          if (INTERNAL_PROPS.has(prop)) return undefined
          if (prop === 'toJSON') return () => clone(obj)
          return wrap(obj[prop])
        },
        set: (obj, prop, newValue) => {
          if (typeof prop !== 'string') return false
          obj[prop] = newValue
          persist()
          return true
        },
        deleteProperty: (obj, prop) => {
          if (typeof prop !== 'string') return false
          delete obj[prop]
          persist()
          return true
        },
        ownKeys: (obj) => Reflect.ownKeys(obj),
        getOwnPropertyDescriptor: (obj, prop) => Object.getOwnPropertyDescriptor(obj, prop) || { enumerable: true, configurable: true }
      })
    }
    const proxy = wrap(value)
    this.recordProxyCache.set(cacheKey, { target: value, proxy })
    return proxy
  }
  get(section, id) {
    if (section === 'users') return this.getUser(id)
    let value = this.sectionCache.get(keyFor(section, id))
    if (typeof value === 'undefined' && ['chats', 'settings', 'stats', 'msgs', 'sessions', 'codes'].includes(section)) {
      value = section === 'chats' ? this.normalizeChatDefaults({}) : {}
      this.set(section, id, value)
    }
    return this._recordProxy(section, id, value)
  }
  set(section, id, value) {
    if (section === 'users') return this.updateUser(id, value)
    this.recordProxyCache.delete(keyFor(section, id))
    const stored = value && typeof value === 'object' ? value : clone(value)
    this.sectionCache.set(keyFor(section, id), stored)
    return this._queueRecordWrite(section, id, stored)
  }
  async has(section, id) { if (section === 'users') return this.userExists(id); if (this.sectionCache.has(keyFor(section, id))) return true; await this.ready; return Boolean(await this.Record.exists({ section, key: id })) }
  delete(section, id) {
    if (section === 'users') {
      this.userCache.delete(id)
      this.userProxyCache.delete(id)
      this.pendingUserPatches.delete(id)
      return this._trackWrite(this.User.deleteOne({ _id: id }))
    }
    this.recordProxyCache.delete(keyFor(section, id))
    this.sectionCache.delete(keyFor(section, id))
    return this._queueRecordDelete(section, id)
  }

  _createDataFacade() {
    return Object.fromEntries(['users', ...SECTION_COLLECTIONS].map(section => [section, this._sectionFacade(section)]))
  }
  _sectionFacade(section) {
    return new Proxy({}, {
      get: (_target, id) => {
        if (INTERNAL_PROPS.has(id)) return undefined
        if (id === 'toJSON') return () => this.getSection(section)
        if (typeof id !== 'string') return undefined
        return this.get(section, id)
      },
      set: (_target, id, value) => { if (typeof id !== 'string') return false; this.set(section, id, value); return true },
      deleteProperty: (_target, id) => { if (typeof id !== 'string') return false; this.delete(section, id); return true },
      ownKeys: () => Object.keys(this.getSection(section)),
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true })
    })
  }

  getGroup(id) { return this.get('groups', id) || {} }
  upsertGroupMetadata(id, metadata = {}) { const payload = { ...(metadata || {}), id }; this.set('groups', id, payload); return payload }
  listGroups() { return this.getSection('groups') }
  getMarriages(groupId = 'global') { return this.get('marriages', groupId) || {} }
  replaceMarriages(values = {}, groupId = 'global') { return this.set('marriages', groupId, values) }
  setMarriagePair(userId, partnerId, date = now(), groupId = 'global') { const current = this.getMarriages(groupId); current[userId] = { partner: partnerId, date }; current[partnerId] = { partner: userId, date }; this.replaceMarriages(current, groupId); this.updateUser(userId, { marry: partnerId }); this.updateUser(partnerId, { marry: userId }); return current }
  divorcePair(userId, groupId = 'global') { const current = this.getMarriages(groupId); const partnerId = current[userId]?.partner || ''; delete current[userId]; if (partnerId) delete current[partnerId]; this.replaceMarriages(current, groupId); this.updateUser(userId, { marry: '' }); if (partnerId) this.updateUser(partnerId, { marry: '' }); return partnerId }
  getHarem() { return Object.values(this.getSection('harem')) }
  replaceHarem(list = []) { return this.replaceSection('harem', Object.fromEntries(list.map(e => [`${e.groupId}:${e.characterId}`, e]))) }
  upsertHaremClaim(e) { return this.set('harem', `${e.groupId}:${e.characterId}`, e) }
  getGachaMarket(groupId = '') { const all = Object.values(this.getSection('gacha_market')); return groupId ? all.filter(e => e.groupId === groupId || e.group_id === groupId) : all }
  replaceGachaMarket(list = []) { return this.replaceSection('gacha_market', Object.fromEntries(list.map(e => [`${e.groupId || e.group_id || 'global'}:${e.id || e.characterId}`, e]))) }
  addGachaMarketSale(e) { const payload = { ...e, idSale: e.idSale || now(), groupId: e.groupId || e.group_id || 'global', characterId: e.characterId || e.id }; this.set('gacha_market', `${payload.groupId}:${payload.characterId}`, payload); return payload }
  removeGachaMarketSale(groupId, characterId) { const key = `${groupId}:${characterId}`; const sale = this.get('gacha_market', key); this.delete('gacha_market', key); return sale || null }

  syncCharactersFts() { return 0 }
  async _loadCharacterSearchRows() {
    const file = findCharactersFile()
    if (!file) return []
    const nowMs = now()
    if (this.characterSearchCache.file === file && this.characterSearchCache.rows.length && nowMs - this.characterSearchCache.loadedAt < CHARACTER_SEARCH_CACHE_TTL_MS) return this.characterSearchCache.rows
    if (this.characterSearchCache.promise) return this.characterSearchCache.promise
    this.characterSearchCache.promise = readFile(file, 'utf8').then(content => {
      const parsed = JSON.parse(content)
      const rows = (Array.isArray(parsed) ? parsed : Object.values(parsed || {})).map(character => ({
        character,
        searchText: normalizeSearchText([character.id, character.name, character.anime, character.source, ...(character.aliases || []), ...(character.tags || [])].join(' '))
      }))
      this.characterSearchCache = { file, loadedAt: now(), rows, promise: null }
      return rows
    }).catch(error => {
      this.characterSearchCache.promise = null
      console.error('[mongodb] no se pudo cargar índice de personajes', error)
      return this.characterSearchCache.rows || []
    })
    return this.characterSearchCache.promise
  }
  async searchCharacter(query, { limit = 10 } = {}) {
    const term = normalizeSearchText(query)
    if (!term) return []
    const rows = await this._loadCharacterSearchRows()
    return rows.filter(row => row.searchText.includes(term)).slice(0, Math.min(Math.max(Number(limit) || 10, 1), 50)).map(({ character }) => ({ id: String(character.id || ''), name: character.name || '', anime: character.anime || character.source || '', score: 0 }))
  }
  async snapshot() { await this.write(); return { users: this.listUsers(), marriages: this.getSection('marriages'), harem: this.getSection('harem'), gacha_market: this.getSection('gacha_market'), claim_config: this.getSection('claim_config'), character_favorites: this.getSection('character_favorites') } }
}

export { MongoDatabase as DbManager }
export default MongoDatabase
