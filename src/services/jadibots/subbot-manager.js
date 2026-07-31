import path from 'path'
import { mkdir, rename, rm } from 'fs/promises'
import { createManagerDatabase } from '../../library/sqliteAuthState.js'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const busyCodes = new Set(['SQLITE_BUSY', 'SQLITE_LOCKED'])
const retryDelays = [50, 100, 200, 400, 800]

function normalizeJid(jid = '') {
return String(jid || '').split(':')[0].trim().toLowerCase()
}

function encodeId(jid = '') {
const normalized = normalizeJid(jid)
return encodeURIComponent(normalized || `subbot-${Date.now()}`)
}

async function runWithRetry(task) {
for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
try {
return await task()
} catch (error) {
if (!busyCodes.has(error?.code) || attempt === retryDelays.length) throw error
await delay(retryDelays[attempt])
}
}
}

function createQueue() {
let tail = Promise.resolve()
return task => {
const run = tail.catch(() => {}).then(task)
tail = run.catch(() => {})
return run
}
}

export class SubBotManager {
constructor({ sessionsRoot, registryDbPath, tableName = 'subbot_registry' } = {}) {
this.sessionsRoot = sessionsRoot
this.registryDbPath = registryDbPath
this.tableName = tableName
this.pool = new Map()
this.states = new Map()
this.cleanupQueue = createQueue()
this.writeQueue = createQueue()
this.ready = this.open()
}
async open() {
await mkdir(this.sessionsRoot, { recursive: true })
this.db = await createManagerDatabase({ dbPath: this.registryDbPath, tableName: this.tableName })
await this.db.execAsync(`CREATE TABLE IF NOT EXISTS ${this.tableName} (
id TEXT PRIMARY KEY,
jid TEXT NOT NULL DEFAULT '',
status TEXT NOT NULL DEFAULT 'offline',
path TEXT NOT NULL DEFAULT '',
metadata TEXT NOT NULL DEFAULT '{}',
updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)`)
try { await this.db.execAsync(`ALTER TABLE ${this.tableName} ADD COLUMN path TEXT NOT NULL DEFAULT ''`) } catch (error) { if (!String(error?.message || '').includes('duplicate column')) throw error }
await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_${this.tableName}_status ON ${this.tableName}(status)`)
await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_${this.tableName}_updated_at ON ${this.tableName}(updated_at)`)
this.upsertStatement = this.db.prepare(`INSERT INTO ${this.tableName}(id,jid,status,path,metadata,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET jid=excluded.jid,status=excluded.status,path=excluded.path,metadata=excluded.metadata,updated_at=excluded.updated_at`)
this.deleteStatement = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ? OR jid = ?`)
this.getStatement = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`)
return this
}
sessionId(jid = '') {
return encodeId(jid)
}
normalizeJid(jid = '') {
return normalizeJid(jid)
}
sessionPath(id) {
return path.join(this.sessionsRoot, id)
}
legacyPath(jid = '') {
return path.join(this.sessionsRoot, normalizeJid(jid).split('@')[0])
}
async setState(id, status, metadata = {}) {
await this.ready
const jid = normalizeJid(metadata.jid || '')
const state = { ...(this.states.get(id) || {}), ...metadata, jid, status, ts: Date.now() }
this.states.set(id, state)
return this.writeQueue(() => runWithRetry(() => this.upsertStatement.runAsync(id, jid, status, metadata.path || state.path || '', JSON.stringify(state), state.ts))).then(() => state)
}
getState(id) {
return this.states.get(id) || null
}
clearState(id) {
this.states.delete(id)
}
register(id, sock, metadata = {}) {
if (!id || !sock) return
this.pool.set(id, { sock, ...metadata, updatedAt: Date.now() })
this.syncGlobalConns()
}
unregister(id, sock = null) {
const current = this.pool.get(id)
if (!current) return
if (!sock || current.sock === sock) this.pool.delete(id)
this.syncGlobalConns()
}
findByJid(jid = '') {
const normalized = normalizeJid(jid)
return [...this.pool.entries()].filter(([, item]) => normalizeJid(item?.sock?.subBotJid || item?.sock?.user?.jid || item?.sock?.authState?.creds?.me?.jid || '') === normalized)
}
syncGlobalConns() {
global.subBotPool = this.pool
const primary = Array.isArray(global.primaryConns) ? global.primaryConns : []
global.conns = [...primary, ...[...this.pool.values()].map(item => item.sock).filter(Boolean)]
}
async deleteRegistry(id, jid = '') {
await this.ready
return this.writeQueue(() => runWithRetry(() => this.deleteStatement.runAsync(id, normalizeJid(jid))))
}
async quarantineSession(sessionPath, id = '') {
if (!sessionPath) return null
const quarantine = `${sessionPath}.deleted-${Date.now()}-${Math.random().toString(16).slice(2)}`
try {
await rename(sessionPath, quarantine)
return quarantine
} catch (error) {
if (error?.code === 'ENOENT') return null
return sessionPath
}
}
cleanupSessionInBackground(sessionPath, id = '') {
if (!sessionPath) return Promise.resolve(false)
const task = async () => {
const target = await this.quarantineSession(sessionPath, id)
if (!target) return false
await rm(target, { recursive: true, force: true, maxRetries: 8, retryDelay: 500 })
return true
}
const job = this.cleanupQueue(() => task()).catch(error => {
console.error(`Error eliminando sesión Sub-Bot ${id}:`, error)
return false
})
return job
}
}

export async function getSubBotManager() {
if (!global.subBotManager) {
const sessionsRoot = global.rutaJadiBot || path.join(process.cwd(), 'RubyJadiBots')
const registryDbPath = `./${global.Rubysessions || 'sessions'}/subbots.db`
const manager = new SubBotManager({ sessionsRoot, registryDbPath })
global.subBotManager = manager
await manager.ready
}
return global.subBotManager
}
