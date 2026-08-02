import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys'

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_CLEANUP_INTERVAL_MS = DAY_MS
const DEFAULT_RETENTION_MS = 7 * DAY_MS
const cleanupTimers = new Map()
const CRITICAL_BAILEYS_KEY_TYPES = new Set(['contacts-tc-token', 'lid-mapping'])


function stringify(value) {
return JSON.stringify(value, BufferJSON.replacer)
}

function parse(value) {
return value ? JSON.parse(value, BufferJSON.reviver) : null
}

function safeFilePart(value = '') {
return String(value).replace(/[/\\]/g, '__').replace(/:/g, '-')
}

async function openDatabase(dbPath) {
const sqlite = new Database(dbPath)
sqlite.pragma('auto_vacuum = INCREMENTAL')
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('synchronous = NORMAL')
sqlite.pragma('busy_timeout = 5000')
sqlite.pragma('temp_store = MEMORY')
sqlite.pragma('cache_size = -20000')
sqlite.pragma('mmap_size = 268435456')
sqlite.pragma('wal_autocheckpoint = 1000')
sqlite.pragma('journal_size_limit = 5242880')
await sqlite.execAsync(`
CREATE TABLE IF NOT EXISTS auth_state (
  category TEXT NOT NULL,
  id TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  last_access_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (category, id)
);
CREATE INDEX IF NOT EXISTS idx_auth_state_category_access ON auth_state(category, last_access_at);
CREATE INDEX IF NOT EXISTS idx_auth_state_updated ON auth_state(updated_at);
`)
return sqlite
}

function createMutex() {
let tail = Promise.resolve()
return fn => {
const run = tail.then(fn, fn)
tail = run.catch(() => {})
return run
}
}

function mergeAuthKeyPatch(target, patch) {
for (const [category, entries] of Object.entries(patch || {})) {
target[category] ||= {}
for (const [id, value] of Object.entries(entries || {})) target[category][id] = value
}
return target
}

function createDebouncedKeyWriter(writeKeys, delayMs = 250, maxDelayMs = 1500) {
let pending = {}
let timer
let maxTimer
let running = Promise.resolve()
const flush = () => {
if (timer) clearTimeout(timer)
if (maxTimer) clearTimeout(maxTimer)
timer = undefined
maxTimer = undefined
const batch = pending
pending = {}
if (!Object.keys(batch).length) return running
running = running.then(() => writeKeys(batch)).catch(error => console.error('[sqlite-auth] error guardando llaves:', error))
return running
}
const schedule = data => {
mergeAuthKeyPatch(pending, data)
if (timer) clearTimeout(timer)
timer = setTimeout(flush, delayMs)
timer.unref?.()
if (!maxTimer) {
maxTimer = setTimeout(flush, maxDelayMs)
maxTimer.unref?.()
}
return running
}
schedule.flush = flush
return schedule
}

function authCategory(type = '') {
return CRITICAL_BAILEYS_KEY_TYPES.has(type) ? type : String(type || '')
}

function normalizeValue(type, value) {
if (type === 'app-state-sync-key' && value) return proto.Message.AppStateSyncKeyData.fromObject(value)
return value
}

function legacyKeyFromFile(file) {
if (file === 'creds.json') return ['creds', 'creds']
if (!file.endsWith('.json')) return null
const name = file.slice(0, -5)
for (const category of ['app-state-sync-key', 'sender-key', 'pre-key', 'session', ...CRITICAL_BAILEYS_KEY_TYPES]) {
const prefix = `${category}-`
if (name.startsWith(prefix)) return [category, safeFilePart(name.slice(prefix.length))]
}
return null
}


function getOne(sqlite, sql, ...params) {
const statement = sqlite.prepare(sql)
return statement.get(...params)
}

function runOne(sqlite, sql, ...params) {
const statement = sqlite.prepare(sql)
return statement.run(...params)
}

function purgeLegacyFiles(sessionDir) {
if (!existsSync(sessionDir)) return
try {
for (const file of readdirSync(sessionDir)) {
const legacyKey = legacyKeyFromFile(file)
if (legacyKey || file === 'baileys_store.json') {
try { unlinkSync(path.join(sessionDir, file)) } catch {}
}
}
} catch (error) {
console.error('[sqlite-auth] no se pudieron purgar archivos legacy:', error)
}
}

async function migrateLegacyAuthFiles(sessionDir, sqlite) {
if (!existsSync(sessionDir)) return
let files = []
try { files = readdirSync(sessionDir) } catch (error) {
console.error('[sqlite-auth] no se pudieron leer archivos legacy:', error)
return
}
const now = Date.now()
for (const file of files) {
const legacyKey = legacyKeyFromFile(file)
if (!legacyKey) continue
const [category, id] = legacyKey
try {
if (await getOne(sqlite, 'SELECT value FROM auth_state WHERE category = ? AND id = ?', category, id)) continue
const value = JSON.parse(readFileSync(path.join(sessionDir, file), 'utf8'), BufferJSON.reviver)
runOne(sqlite, `INSERT INTO auth_state(category,id,value,created_at,updated_at,last_access_at)
VALUES(?,?,?,?,?,?)
ON CONFLICT(category,id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, last_access_at=excluded.last_access_at`, category, id, stringify(value), now, now, now)
} catch (error) {
console.error(`[sqlite-auth] no se pudo migrar ${file}:`, error)
}
}
}

function startDailyCleanup(dbPath, sqlite, options = {}) {
if (cleanupTimers.has(dbPath)) return cleanupTimers.get(dbPath)
const retentionMs = Number(options.retentionMs) || DEFAULT_RETENTION_MS
const intervalMs = Number(options.cleanupIntervalMs) || DEFAULT_CLEANUP_INTERVAL_MS
const runCleanup = async () => {
try {
const now = Date.now()
const lastRow = await getOne(sqlite, 'SELECT value FROM auth_state WHERE category = ? AND id = ?', 'meta', 'last_cleanup_at')
const last = Number(parse(lastRow?.value) || 0)
if (now - last < intervalMs) return
const cutoff = now - retentionMs
runOne(sqlite, "DELETE FROM auth_state WHERE category IN ('pre-key','sender-key','session') AND last_access_at < ?", cutoff)
sqlite.exec('PRAGMA incremental_vacuum;')
runOne(sqlite, `INSERT INTO auth_state(category,id,value,created_at,updated_at,last_access_at)
VALUES('meta',?,?,?,?,?)
ON CONFLICT(category,id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, last_access_at=excluded.last_access_at`, 'last_cleanup_at', stringify(now), now, now, now)
} catch (error) {
console.error('[sqlite-auth] error en limpieza diaria:', error)
}
}
const timer = setInterval(runCleanup, intervalMs)
timer.unref?.()
cleanupTimers.set(dbPath, timer)
return timer
}

export async function useSQLiteAuthState(sessionDir, options = {}) {
if (!existsSync(sessionDir)) mkdirSync(sessionDir, { recursive: true })
const dbPath = path.join(sessionDir, options.dbName || 'auth.db')
const sqlite = await openDatabase(dbPath)
await migrateLegacyAuthFiles(sessionDir, sqlite)
if (options.cleanOldFiles !== false) purgeLegacyFiles(sessionDir)
const credsRow = await getOne(sqlite, 'SELECT value FROM auth_state WHERE category = ? AND id = ?', 'creds', 'creds')
let creds = parse(credsRow?.value) || initAuthCreds()
const writeLock = createMutex()
const writeCredsTx = async () => {
try {
const now = Date.now()
runOne(sqlite, `INSERT INTO auth_state(category,id,value,created_at,updated_at,last_access_at)
VALUES(?,?,?,?,?,?)
ON CONFLICT(category,id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, last_access_at=excluded.last_access_at`, 'creds', 'creds', stringify(creds), now, now, now)
} catch (error) {
console.error('[sqlite-auth] error guardando credenciales:', error)
throw error
}
}
const writeKeysTx = async data => {
try {
const now = Date.now()
sqlite.exec('BEGIN IMMEDIATE;')
try {
for (const category of Object.keys(data || {})) {
for (const id of Object.keys(data[category] || {})) {
const value = data[category][id]
if (value) runOne(sqlite, `INSERT INTO auth_state(category,id,value,created_at,updated_at,last_access_at)
VALUES(?,?,?,?,?,?)
ON CONFLICT(category,id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, last_access_at=excluded.last_access_at`, category, safeFilePart(id), stringify(value), now, now, now)
else runOne(sqlite, 'DELETE FROM auth_state WHERE category = ? AND id = ?', category, safeFilePart(id))
}
}
sqlite.exec('COMMIT;')
} catch (error) {
try { sqlite.exec('ROLLBACK;') } catch (rollbackError) { console.error('[sqlite-auth] error revirtiendo lote de llaves:', rollbackError) }
throw error
}
} catch (error) {
console.error('[sqlite-auth] error guardando lote de llaves:', error)
throw error
}
}
const keyWriter = createDebouncedKeyWriter(data => writeLock(() => writeKeysTx(data)), options.keyFlushDelayMs ?? 250, options.keyMaxFlushDelayMs ?? 1500)
const cleanupTimer = startDailyCleanup(dbPath, sqlite, options)
const closeAuthDb = async () => {
if (cleanupTimer) clearInterval(cleanupTimer)
cleanupTimers.delete(dbPath)
await keyWriter.flush()
sqlite.exec('PRAGMA wal_checkpoint(TRUNCATE);')
sqlite.close()
}
return {
state: {
creds,
keys: {
get: async (type, ids) => {
const now = Date.now()
const data = {}
for (const id of ids || []) {
const keyId = safeFilePart(id)
const category = authCategory(type)
let row = null
try {
row = await getOne(sqlite, 'SELECT value FROM auth_state WHERE category = ? AND id = ?', category, keyId)
if (row) runOne(sqlite, 'UPDATE auth_state SET last_access_at = ? WHERE category = ? AND id = ?', now, category, keyId)
} catch (error) {
console.error(`[sqlite-auth] error leyendo llave ${category}/${keyId}:`, error)
}
data[id] = normalizeValue(type, parse(row?.value))
}
return data
},
set: async data => keyWriter(data)
}
},
saveCreds: async () => { await keyWriter.flush(); return writeLock(() => writeCredsTx()) },
removeCreds: async () => writeLock(async () => {
try {
return runOne(sqlite, 'DELETE FROM auth_state WHERE category = ? AND id = ?', 'creds', 'creds')
} catch (error) {
console.error('[sqlite-auth] error eliminando credenciales:', error)
throw error
}
}),
clearDb: async () => {
await keyWriter.flush()
return writeLock(async () => {
try {
return runOne(sqlite, 'DELETE FROM auth_state')
} catch (error) {
console.error('[sqlite-auth] error limpiando base de autenticación:', error)
throw error
}
})
},
closeDb: closeAuthDb,
close: closeAuthDb
}
}


export default useSQLiteAuthState

export async function useOptimizedAuthState(sessionDir, options = {}) {
return useSQLiteAuthState(sessionDir, options)
}
