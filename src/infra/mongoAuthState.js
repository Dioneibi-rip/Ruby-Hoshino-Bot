import mongoose from 'mongoose'
import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys'

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_VOLATILE_RETENTION_MS = Number(process.env.MONGO_AUTH_VOLATILE_RETENTION_MS || 7 * DAY_MS)
const DEFAULT_CLEANUP_INTERVAL_MS = Number(process.env.MONGO_AUTH_CLEANUP_INTERVAL_MS || 6 * 60 * 60 * 1000)
const DEFAULT_MAX_PRE_KEYS = Number(process.env.MONGO_AUTH_MAX_PRE_KEYS || 300)
const DEFAULT_MAX_SENDER_KEYS = Number(process.env.MONGO_AUTH_MAX_SENDER_KEYS || 500)
const DEFAULT_MAX_SESSIONS = Number(process.env.MONGO_AUTH_MAX_SESSIONS || 1500)
const VOLATILE_CATEGORIES = new Set(['pre-key', 'sender-key', 'session'])
const cleanupTimers = new Map()

function stringify(value) { return JSON.stringify(value, BufferJSON.replacer) }
function parse(value) { return value ? JSON.parse(value, BufferJSON.reviver) : null }
function safeId(value = '') { return String(value).replace(/[$.]/g, '_') }
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
}, { collection: 'auth_states', strict: true, timestamps: true, versionKey: false })
authStateSchema.index({ sessionId: 1, category: 1, keyId: 1 }, { unique: true })
authStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
authStateSchema.index({ sessionId: 1, category: 1, lastAccessAt: 1 })

function authModel() {
  return mongoose.models.AuthState || mongoose.model('AuthState', authStateSchema)
}

async function ensureMongoConnection({ uri = process.env.MONGODB_URI, dbName = process.env.MONGODB_DB_NAME } = {}) {
  if (!uri) throw new Error('MONGODB_URI es obligatorio para useMongoAuthState')
  if (mongoose.connection.readyState === 0) await mongoose.connect(uri, { dbName, retryWrites: true, maxPoolSize: Number(process.env.MONGODB_AUTH_POOL_SIZE || 10) })
  const db = mongoose.connection.db
  if (db) {
    await Promise.all([
      db.collection('auth_states').createIndex({ sessionId: 1, category: 1, keyId: 1 }, { unique: true }),
      db.collection('auth_states').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection('auth_states').createIndex({ sessionId: 1, category: 1, lastAccessAt: 1 })
    ])
  }
}

async function capCategory(Model, sessionId, category, maxRows) {
  if (!Number.isFinite(maxRows) || maxRows <= 0) return 0
  const rows = await Model.find({ sessionId, category }, { _id: 1 }).sort({ lastAccessAt: -1, updatedAt: -1 }).skip(maxRows).lean()
  if (!rows.length) return 0
  const result = await Model.deleteMany({ _id: { $in: rows.map(row => row._id) } })
  return result.deletedCount || 0
}

async function cleanupVolatileKeys(Model, sessionId, options = {}) {
  const retentionMs = Number(options.volatileRetentionMs) || DEFAULT_VOLATILE_RETENTION_MS
  const cutoff = new Date(Date.now() - retentionMs)
  const expired = await Model.deleteMany({ sessionId, category: { $in: [...VOLATILE_CATEGORIES] }, lastAccessAt: { $lt: cutoff } })
  const [preKeys, senderKeys, sessions] = await Promise.all([
    capCategory(Model, sessionId, 'pre-key', Number(options.maxPreKeys) || DEFAULT_MAX_PRE_KEYS),
    capCategory(Model, sessionId, 'sender-key', Number(options.maxSenderKeys) || DEFAULT_MAX_SENDER_KEYS),
    capCategory(Model, sessionId, 'session', Number(options.maxSessions) || DEFAULT_MAX_SESSIONS)
  ])
  return (expired.deletedCount || 0) + preKeys + senderKeys + sessions
}

function startCleanupTimer(Model, sessionId, options = {}) {
  const timerKey = `${Model.collection.name}:${sessionId}`
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

export async function useMongoAuthState(sessionId = 'default', options = {}) {
  const normalizedSessionId = safeId(sessionId || 'default')
  await ensureMongoConnection(options)
  const Model = authModel()
  const writeLock = createMutex()
  const credsRow = await Model.findOne({ sessionId: normalizedSessionId, category: 'creds', keyId: 'creds' }).lean()
  const creds = parse(credsRow?.value) || initAuthCreds()
  const cleanupTimer = startCleanupTimer(Model, normalizedSessionId, options)

  const saveCreds = () => writeLock(() => Model.updateOne(
    { sessionId: normalizedSessionId, category: 'creds', keyId: 'creds' },
    { $set: { value: stringify(creds), lastAccessAt: new Date(), expiresAt: null } },
    { upsert: true }
  ))

  const close = () => {
    const timerKey = `${Model.collection.name}:${normalizedSessionId}`
    const timer = cleanupTimers.get(timerKey)
    if (timer) clearInterval(timer)
    cleanupTimers.delete(timerKey)
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids = []) => {
          const keyIds = ids.map(id => safeId(id))
          const rows = await Model.find({ sessionId: normalizedSessionId, category: type, keyId: { $in: keyIds } }).lean()
          const byKey = new Map(rows.map(row => [row.keyId, row]))
          if (keyIds.length) await Model.updateMany({ sessionId: normalizedSessionId, category: type, keyId: { $in: keyIds } }, { $set: { lastAccessAt: new Date() } })
          const output = {}
          for (const id of ids) output[id] = normalizeValue(type, parse(byKey.get(safeId(id))?.value))
          return output
        },
        set: async data => writeLock(async () => {
          const now = new Date()
          const operations = []
          for (const category of Object.keys(data || {})) {
            for (const id of Object.keys(data[category] || {})) {
              const keyId = safeId(id)
              const value = data[category][id]
              if (value) {
                operations.push({ updateOne: { filter: { sessionId: normalizedSessionId, category, keyId }, update: { $set: { value: stringify(value), lastAccessAt: now, expiresAt: volatileExpiresAt(category, options) } }, upsert: true } })
              } else {
                operations.push({ deleteOne: { filter: { sessionId: normalizedSessionId, category, keyId } } })
              }
            }
          }
          if (operations.length) await Model.bulkWrite(operations, { ordered: false })
          await cleanupVolatileKeys(Model, normalizedSessionId, options)
        })
      }
    },
    saveCreds,
    removeCreds: async () => writeLock(() => Model.deleteOne({ sessionId: normalizedSessionId, category: 'creds', keyId: 'creds' })),
    clearDb: async () => writeLock(() => Model.deleteMany({ sessionId: normalizedSessionId })),
    closeDb: close,
    close
  }
}

export default useMongoAuthState
