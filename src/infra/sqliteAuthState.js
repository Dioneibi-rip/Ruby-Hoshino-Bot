import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys'

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_CLEANUP_INTERVAL_MS = DAY_MS
const DEFAULT_RETENTION_MS = 30 * DAY_MS
const cleanupTimers = new Map()

function stringify(value) {
return JSON.stringify(value, BufferJSON.replacer)
}

function parse(value) {
return value ? JSON.parse(value, BufferJSON.reviver) : null
}

function safeFilePart(value = '') {
return String(value).replace(/[/\\]/g, '__').replace(/:/g, '-')
}

function openDatabase(dbPath) {
const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('synchronous = NORMAL')
sqlite.pragma('temp_store = MEMORY')
sqlite.pragma('busy_timeout = 10000')
sqlite.exec(`
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

function normalizeValue(type, value) {
if (type === 'app-state-sync-key' && value) return proto.Message.AppStateSyncKeyData.fromObject(value)
return value
}

function legacyKeyFromFile(file) {
if (file === 'creds.json') return ['creds', 'creds']
if (!file.endsWith('.json')) return null
const name = file.slice(0, -5)
for (const category of ['app-state-sync-key', 'sender-key', 'pre-key', 'session']) {
const prefix = `${category}-`
if (name.startsWith(prefix)) return [category, safeFilePart(name.slice(prefix.length))]
}
return null
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

function migrateLegacyAuthFiles(sessionDir, statements) {
if (!existsSync(sessionDir)) return
let files = []
try { files = readdirSync(sessionDir) } catch { return }
const now = Date.now()
for (const file of files) {
const legacyKey = legacyKeyFromFile(file)
if (!legacyKey) continue
const [category, id] = legacyKey
if (statements.get.get(category, id)) continue
try {
const value = JSON.parse(readFileSync(path.join(sessionDir, file), 'utf8'), BufferJSON.reviver)
statements.upsert.run(category, id, stringify(value), now, now, now)
} catch (error) {
console.error(`[sqlite-auth] no se pudo migrar ${file}:`, error)
}
}
}

function buildStatements(sqlite) {
return {
get: sqlite.prepare('SELECT value FROM auth_state WHERE category = ? AND id = ?'),
touch: sqlite.prepare('UPDATE auth_state SET last_access_at = ? WHERE category = ? AND id = ?'),
upsert: sqlite.prepare(`INSERT INTO auth_state(category,id,value,created_at,updated_at,last_access_at)
VALUES(?,?,?,?,?,?)
ON CONFLICT(category,id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, last_access_at=excluded.last_access_at`),
remove: sqlite.prepare('DELETE FROM auth_state WHERE category = ? AND id = ?'),
cleanup: sqlite.prepare("DELETE FROM auth_state WHERE category IN ('pre-key','sender-key','session') AND last_access_at < ?"),
getMeta: sqlite.prepare('SELECT value FROM auth_state WHERE category = ? AND id = ?'),
setMeta: sqlite.prepare(`INSERT INTO auth_state(category,id,value,created_at,updated_at,last_access_at)
VALUES('meta',?,?,?,?,?)
ON CONFLICT(category,id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, last_access_at=excluded.last_access_at`)
}
}

function startDailyCleanup(dbPath, statements, options = {}) {
if (cleanupTimers.has(dbPath)) return cleanupTimers.get(dbPath)
const retentionMs = Number(options.retentionMs) || DEFAULT_RETENTION_MS
const intervalMs = Number(options.cleanupIntervalMs) || DEFAULT_CLEANUP_INTERVAL_MS
const runCleanup = () => {
try {
const now = Date.now()
const last = Number(parse(statements.getMeta.get('meta', 'last_cleanup_at')?.value) || 0)
if (now - last < intervalMs) return
const cutoff = now - retentionMs
const result = statements.cleanup.run(cutoff)
statements.setMeta.run('last_cleanup_at', stringify(now), now, now, now)
if (result.changes) console.log(`[sqlite-auth] limpieza silenciosa: ${result.changes} llaves Signal antiguas eliminadas`)
} catch (error) {
console.error('[sqlite-auth] error en limpieza diaria:', error)
}
}
runCleanup()
const timer = setInterval(runCleanup, intervalMs)
timer.unref?.()
cleanupTimers.set(dbPath, timer)
return timer
}

export function useSQLiteAuthState(sessionDir, options = {}) {
if (!existsSync(sessionDir)) mkdirSync(sessionDir, { recursive: true })
const dbPath = path.join(sessionDir, options.dbName || 'auth.db')
const sqlite = openDatabase(dbPath)
const statements = buildStatements(sqlite)
migrateLegacyAuthFiles(sessionDir, statements)
if (options.cleanOldFiles !== false) purgeLegacyFiles(sessionDir)
let creds = parse(statements.get.get('creds', 'creds')?.value) || initAuthCreds()
const writeLock = createMutex()
const writeCredsTx = sqlite.transaction(() => {
const now = Date.now()
statements.upsert.run('creds', 'creds', stringify(creds), now, now, now)
})
const writeKeysTx = sqlite.transaction(data => {
const now = Date.now()
for (const category of Object.keys(data || {})) {
for (const id of Object.keys(data[category] || {})) {
const value = data[category][id]
if (value) statements.upsert.run(category, safeFilePart(id), stringify(value), now, now, now)
else statements.remove.run(category, safeFilePart(id))
}
}
})
const cleanupTimer = startDailyCleanup(dbPath, statements, options)
const closeAuthDb = () => {
if (cleanupTimer) clearInterval(cleanupTimer)
cleanupTimers.delete(dbPath)
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
const row = statements.get.get(type, keyId)
if (row) statements.touch.run(now, type, keyId)
data[id] = normalizeValue(type, parse(row?.value))
}
return data
},
set: async data => writeLock(() => writeKeysTx(data))
}
},
saveCreds: async () => writeLock(() => writeCredsTx()),
removeCreds: async () => writeLock(() => statements.remove.run('creds', 'creds')),
clearDb: async () => writeLock(() => sqlite.prepare('DELETE FROM auth_state').run()),
closeDb: closeAuthDb,
close: closeAuthDb
}
}

export function createManagerDatabase({ dbPath = './sessions/system.db', tableName = 'bot_registry' } = {}) {
if (!/^[A-Za-z0-9_]+$/.test(tableName)) throw new Error('tableName inválido para createManagerDatabase')
const dir = path.dirname(dbPath)
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('synchronous = NORMAL')
sqlite.pragma('busy_timeout = 10000')
sqlite.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (
  id TEXT PRIMARY KEY,
  jid TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'offline',
  metadata TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`)
return sqlite
}

export default useSQLiteAuthState

export async function useOptimizedAuthState(sessionDir, options = {}) {
const useMongo = Boolean(options.mongo || (process.env.MONGODB_URI && process.env.AUTH_STATE_DRIVER !== 'sqlite'))
if (!useMongo) return useSQLiteAuthState(sessionDir, options)
const { useMongoAuthState } = await import('./mongoAuthState.js')
const sessionId = options.sessionId || path.basename(path.resolve(sessionDir || 'default'))
return useMongoAuthState(sessionId, options)
}
