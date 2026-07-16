import mongoose from 'mongoose'
import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys'

mongoose.set('bufferCommands', false)
mongoose.set('bufferTimeoutMS', 0)

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_VOLATILE_RETENTION_MS = Number(process.env.MONGO_AUTH_VOLATILE_RETENTION_MS || 7 * DAY_MS)
const DEFAULT_CLEANUP_INTERVAL_MS = Number(process.env.MONGO_AUTH_CLEANUP_INTERVAL_MS || 6 * 60 * 60 * 1000)
const DEFAULT_MAX_PRE_KEYS = Number(process.env.MONGO_AUTH_MAX_PRE_KEYS || 300)
const DEFAULT_MAX_SENDER_KEYS = Number(process.env.MONGO_AUTH_MAX_SENDER_KEYS || 500)
const DEFAULT_MAX_SESSIONS = Number(process.env.MONGO_AUTH_MAX_SESSIONS || 1500)
const AUTH_CACHE_TTL_MS = Number(process.env.MONGO_AUTH_CACHE_TTL_MS || 15 * 60 * 1000)
const AUTH_FLUSH_INTERVAL_MS = Number(process.env.MONGO_AUTH_FLUSH_INTERVAL_MS || 30_000)
const VOLATILE_CATEGORIES = new Set(['pre-key', 'sender-key', 'session'])
const cleanupTimers = new Map()
const CRITICAL_BAILEYS_KEY_TYPES = new Set(['contacts-tc-token', 'lid-mapping'])

const MONGO_AUTH_OPTIONS = {
  maxPoolSize: Number(process.env.MONGODB_AUTH_POOL_SIZE || process.env.MONGODB_POOL_SIZE || 10),
  serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5_000),
  socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 45_000),
  connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 5_000),
  heartbeatFrequencyMS: Number(process.env.MONGODB_HEARTBEAT_FREQUENCY_MS || 10_000),
  waitQueueTimeoutMS: Number(process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS || 5_000),
  maxConnecting: Number(process.env.MONGODB_MAX_CONNECTING || 2),
  retryWrites: true
  // MongoDB Node.js Driver 6+ mantiene TCP keepAlive activo por defecto y rechaza la opción keepAlive heredada.
}
const MONGO_AUTH_OPERATION_TIMEOUT_MS = Number(process.env.MONGODB_AUTH_OPERATION_TIMEOUT_MS || process.env.MONGODB_OPERATION_TIMEOUT_MS || 5_000)
const MONGO_AUTH_CIRCUIT_BREAKER_MS = Number(process.env.MONGODB_AUTH_CIRCUIT_BREAKER_MS || process.env.MONGODB_CIRCUIT_BREAKER_MS || 15_000)
const MONGO_AUTH_LISTENER_KEY = Symbol.for('ruby-hoshino.mongo-auth.listeners')

let mongoAuthUnavailableUntil = 0
function markMongoAuthUnavailable(error) {
  mongoAuthUnavailableUntil = Date.now() + MONGO_AUTH_CIRCUIT_BREAKER_MS
  if (error) console.error('[mongo-auth] circuito abierto temporalmente; se evita I/O de red', error)
}
function isMongoConnected() { return mongoose.connection.readyState === 1 && Date.now() >= mongoAuthUnavailableUntil }
function withMongoTimeout(operation, { timeoutMs = MONGO_AUTH_OPERATION_TIMEOUT_MS, label = 'operación mongo-auth', fallback, swallow = true } = {}) {
  let timer
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`[mongo-auth] ${label} excedió ${timeoutMs}ms; se omite para no bloquear Baileys`)
      error.code = 'MONGO_AUTH_OPERATION_TIMEOUT'
      ;(swallow ? resolve : reject)(typeof fallback === 'function' ? fallback(error) : fallback)
    }, Math.max(Number(timeoutMs) || 1, 1))
    timer.unref?.()
  })
  return Promise.race([Promise.resolve().then(operation), timeout]).catch(error => {
    if (!swallow) throw error
    markMongoAuthUnavailable(error)
    console.error(`[mongo-auth] ${label} falló; Baileys continuará sin esperar MongoDB`, error)
    return typeof fallback === 'function' ? fallback(error) : fallback
  }).finally(() => clearTimeout(timer))
}

function ensureMongoConnectionListeners() {
  if (mongoose.connection[MONGO_AUTH_LISTENER_KEY]) return
  mongoose.connection.on('connected', () => { mongoAuthUnavailableUntil = 0; console.info('[mongo-auth] conexión establecida') })
  mongoose.connection.on('disconnected', () => { markMongoAuthUnavailable(); console.error('[mongo-auth] conexión perdida; circuito abierto y reconexión en segundo plano') })
  mongoose.connection.on('reconnected', () => { mongoAuthUnavailableUntil = 0; console.info('[mongo-auth] conexión restaurada') })
  mongoose.connection.on('error', error => { markMongoAuthUnavailable(error); console.error('[mongo-auth] error controlado de MongoDB; no se detiene Baileys', error) })
  mongoose.connection[MONGO_AUTH_LISTENER_KEY] = true
}

class AuthMemoryCache {
  constructor(ttlMs = AUTH_CACHE_TTL_MS) {
    this.ttlMs = ttlMs
    this.rows = new Map()
  }
  _key(sessionId, category, keyId) { return `${sessionId}:${category}:${keyId}` }
  _evict(now = Date.now()) {
    for (const [key, row] of this.rows) if (row.lastAccessAt + this.ttlMs <= now) this.rows.delete(key)
  }
  get(sessionId, category, keyId) {
    this._evict()
    const key = this._key(sessionId, category, keyId)
    const row = this.rows.get(key)
    if (!row) return undefined
    row.lastAccessAt = Date.now()
    this.rows.delete(key)
    this.rows.set(key, row)
    return row.value
  }
  set(sessionId, category, keyId, value) {
    this._evict()
    this.rows.set(this._key(sessionId, category, keyId), { value, lastAccessAt: Date.now() })
  }
  delete(sessionId, category, keyId) { this.rows.delete(this._key(sessionId, category, keyId)) }
  clearSession(sessionId) { for (const key of this.rows.keys()) if (key.startsWith(`${sessionId}:`)) this.rows.delete(key) }
}

function stringify(value) { return JSON.stringify(value, BufferJSON.replacer) }
function parse(value) { return value ? JSON.parse(value, BufferJSON.reviver) : null }
function safeId(value = '') { return String(value).replace(/[$.]/g, '_') }
function authCategory(type = '') {
// Baileys puede emitir familias nuevas; los tokens críticos deben persistirse sin filtrado.
return CRITICAL_BAILEYS_KEY_TYPES.has(type) ? type : String(type || '')
}

function normalizeValue(type, value) { return type === 'app-state-sync-key' && value ? proto.Message.AppStateSyncKeyData.fromObject(value) : value }
function createMutex() {
  let tail = Promise.resolve()
  return fn => {
    const run = tail.then(fn, fn)
    tail = run.catch(() => {})
    return run
  }
}

const authStateSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  category: { type: String, required: true },
  keyId: { type: String, required: true },
  value: { type: String, default: '' },
  expiresAt: { type: Date, default: null },
  lastAccessAt: { type: Date, default: Date.now }
}, { collection: 'auth_states', strict: true, timestamps: true, versionKey: false, bufferCommands: false, autoCreate: false })
authStateSchema.index({ sessionId: 1, category: 1, keyId: 1 }, { unique: true })
authStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
authStateSchema.index({ sessionId: 1, category: 1, lastAccessAt: 1 })

function authModel() {
  return mongoose.models.AuthState || mongoose.model('AuthState', authStateSchema)
}

async function ensureMongoConnection({ uri = process.env.MONGODB_URI, dbName = process.env.MONGODB_DB_NAME } = {}) {
  if (!uri) throw new Error('MONGODB_URI es obligatorio para useMongoAuthState')
  ensureMongoConnectionListeners()
  if (mongoose.connection.readyState === 0) await withMongoTimeout(() => mongoose.connect(uri, { ...MONGO_AUTH_OPTIONS, dbName }), { label: 'conexión inicial', swallow: false })
  const db = mongoose.connection.db
  if (db) {
    await withMongoTimeout(() => Promise.all([
      db.collection('auth_states').createIndex({ sessionId: 1, category: 1, keyId: 1 }, { unique: true }),
      db.collection('auth_states').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection('auth_states').createIndex({ sessionId: 1, category: 1, lastAccessAt: 1 })
    ]), { label: 'creación de índices', fallback: null })
  }
}

async function capCategory(Model, sessionId, category, maxRows) {
  if (!Number.isFinite(maxRows) || maxRows <= 0) return 0
  const rows = await withMongoTimeout(() => Model.find({ sessionId, category }, { _id: 1 }).sort({ lastAccessAt: -1, updatedAt: -1 }).skip(maxRows).lean(), { label: `cap ${category}`, fallback: [] })
  if (!rows.length) return 0
  const result = await withMongoTimeout(() => Model.deleteMany({ _id: { $in: rows.map(row => row._id) } }), { label: `cap delete ${category}`, fallback: { deletedCount: 0 } })
  return result.deletedCount || 0
}

async function cleanupVolatileKeys(Model, sessionId, options = {}) {
  const retentionMs = Number(options.volatileRetentionMs) || DEFAULT_VOLATILE_RETENTION_MS
  const cutoff = new Date(Date.now() - retentionMs)
  const expired = await withMongoTimeout(() => Model.deleteMany({ sessionId, category: { $in: [...VOLATILE_CATEGORIES] }, lastAccessAt: { $lt: cutoff } }), { label: 'limpieza de claves volátiles', fallback: { deletedCount: 0 } })
  const [preKeys, senderKeys, sessions] = await Promise.all([
    capCategory(Model, sessionId, 'pre-key', Number(options.maxPreKeys) || DEFAULT_MAX_PRE_KEYS),
    capCategory(Model, sessionId, 'sender-key', Number(options.maxSenderKeys) || DEFAULT_MAX_SENDER_KEYS),
    capCategory(Model, sessionId, 'session', Number(options.maxSessions) || DEFAULT_MAX_SESSIONS)
  ])
  return (expired.deletedCount || 0) + preKeys + senderKeys + sessions
}

function startCleanupTimer(Model, sessionId, options = {}) {
  const timerKey = `${Model.collection.name}:${sessionId}:cleanup`
  if (cleanupTimers.has(timerKey)) return cleanupTimers.get(timerKey)
  const intervalMs = Number(options.cleanupIntervalMs) || DEFAULT_CLEANUP_INTERVAL_MS
  const run = () => cleanupVolatileKeys(Model, sessionId, options).catch(error => console.error('[mongo-auth] limpieza fallida:', error))
  run()
  const timer = setInterval(run, intervalMs)
  timer.unref?.()
  cleanupTimers.set(timerKey, timer)
  return timer
}

function volatileExpiresAt(category, options = {}) {
  if (!VOLATILE_CATEGORIES.has(category)) return null
  const retentionMs = Number(options.volatileRetentionMs) || DEFAULT_VOLATILE_RETENTION_MS
  return new Date(Date.now() + retentionMs)
}

function startAuthFlushWorker(Model, sessionId, pendingWrites, options = {}) {
  const timerKey = `${Model.collection.name}:${sessionId}:write-behind`
  if (cleanupTimers.has(timerKey)) return cleanupTimers.get(timerKey)
  const flush = async () => {
    if (!pendingWrites.size || !isMongoConnected()) return
    const entries = [...pendingWrites.entries()]
    const now = new Date()
    const operations = entries.map(([, entry]) => entry.value
      ? { updateOne: { filter: { sessionId, category: entry.category, keyId: entry.keyId }, update: { $set: { value: stringify(entry.value), lastAccessAt: now, expiresAt: volatileExpiresAt(entry.category, options) } }, upsert: true } }
      : { deleteOne: { filter: { sessionId, category: entry.category, keyId: entry.keyId } } })
    const result = await withMongoTimeout(() => Model.bulkWrite(operations, { ordered: false }), { label: 'flush auth write-behind', fallback: null })
    if (result) for (const [key] of entries) pendingWrites.delete(key)
  }
  const timer = setInterval(() => flush().catch(error => console.error('[mongo-auth] write-behind falló:', error)), Number(options.flushIntervalMs) || AUTH_FLUSH_INTERVAL_MS)
  timer.unref?.()
  cleanupTimers.set(timerKey, timer)
  return { timer, flush }
}

export async function useMongoAuthState(sessionId = 'default', options = {}) {
  const normalizedSessionId = safeId(sessionId || 'default')
  await ensureMongoConnection(options)
  const Model = authModel()
  const writeLock = createMutex()
  const keyCache = new AuthMemoryCache(Number(options.cacheTtlMs) || AUTH_CACHE_TTL_MS)
  const pendingWrites = new Map()
  const credsRow = await withMongoTimeout(() => Model.findOne({ sessionId: normalizedSessionId, category: 'creds', keyId: 'creds' }).lean(), { label: 'lectura de credenciales', fallback: null })
  const creds = parse(credsRow?.value) || initAuthCreds()
  keyCache.set(normalizedSessionId, 'creds', 'creds', creds)
  startCleanupTimer(Model, normalizedSessionId, options)
  const writeBehind = startAuthFlushWorker(Model, normalizedSessionId, pendingWrites, options)
  const pendingKey = (category, keyId) => `${category}:${keyId}`

  const queueAuthWrite = (category, keyId, value) => {
    if (value) keyCache.set(normalizedSessionId, category, keyId, value)
    else keyCache.delete(normalizedSessionId, category, keyId)
    pendingWrites.set(pendingKey(category, keyId), { category, keyId, value })
  }

  const saveCreds = () => writeLock(() => {
    queueAuthWrite('creds', 'creds', creds)
    return Promise.resolve()
  })

  const close = () => {
    for (const suffix of ['cleanup', 'write-behind']) {
      const timerKey = `${Model.collection.name}:${normalizedSessionId}:${suffix}`
      const timer = cleanupTimers.get(timerKey)
      if (timer?.timer) clearInterval(timer.timer)
      else if (timer) clearInterval(timer)
      cleanupTimers.delete(timerKey)
    }
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids = []) => {
          const category = authCategory(type)
          const output = {}
          const missing = []
          for (const id of ids) {
            const cached = keyCache.get(normalizedSessionId, category, safeId(id))
            if (typeof cached === 'undefined') missing.push(id)
            else output[id] = normalizeValue(type, cached)
          }
          if (missing.length && isMongoConnected()) {
            const keyIds = missing.map(id => safeId(id))
            const rows = await withMongoTimeout(() => Model.find({ sessionId: normalizedSessionId, category, keyId: { $in: keyIds } }).lean(), { label: `lectura keys ${category}`, fallback: [] })
            const byKey = new Map(rows.map(row => [row.keyId, row]))
            for (const id of missing) {
              const keyId = safeId(id)
              const value = parse(byKey.get(keyId)?.value)
              if (typeof value !== 'undefined' && value !== null) keyCache.set(normalizedSessionId, category, keyId, value)
              output[id] = normalizeValue(type, value)
            }
          } else {
            for (const id of missing) output[id] = null
          }
          return output
        },
        set: async data => writeLock(async () => {
          for (const category of Object.keys(data || {})) {
            for (const id of Object.keys(data[category] || {})) queueAuthWrite(category, safeId(id), data[category][id] || null)
          }
        })
      }
    },
    saveCreds,
    removeCreds: async () => writeLock(() => { queueAuthWrite('creds', 'creds', null); return Promise.resolve() }),
    clearDb: async () => writeLock(() => {
      keyCache.clearSession(normalizedSessionId)
      pendingWrites.clear()
      return withMongoTimeout(() => Model.deleteMany({ sessionId: normalizedSessionId }), { label: 'limpieza de auth state', fallback: null })
    }),
    flushDb: () => writeBehind.flush(),
    closeDb: close,
    close
  }
}

export default useMongoAuthState
