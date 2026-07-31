import { parentPort, workerData } from 'worker_threads'
import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import path from 'path'

const filename = workerData?.filename || process.env.RUBY_DB_WORKER_FILE || './src/database/database.sqlite'
mkdirSync(path.dirname(filename), { recursive: true })
const db = new Database(filename)
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('busy_timeout = 5000')
db.pragma('foreign_keys = ON')
const statements = new Map()

function statement(sql) {
let st = statements.get(sql)
if (!st) {
st = db.prepare(sql)
statements.set(sql, st)
}
return st
}

function runJob(job = {}) {
const params = Array.isArray(job.params) ? job.params : []
if (job.op === 'get') return statement(job.sql).get(...params)
if (job.op === 'all') return statement(job.sql).all(...params)
if (job.op === 'run') return statement(job.sql).run(...params)
if (job.op === 'exec') return db.exec(job.sql)
if (job.op === 'incrementChatActivity') return incrementChatActivity(job.payload || {})
throw new Error(`Unsupported db op ${job.op}`)
}

function parseJson(value, fallback) {
if (!value) return fallback
try { return JSON.parse(value) } catch { return fallback }
}

function incrementChatActivity(payload = {}) {
const chatId = String(payload.chatId || '')
const jid = String(payload.jid || '')
if (!chatId || !jid) return false
const now = Number(payload.now || Date.now())
const row = statement('SELECT value FROM chats WHERE id=?').get(chatId)
const chat = parseJson(row?.value, {})
chat.users = chat.users && typeof chat.users === 'object' ? chat.users : {}
const previous = chat.users[jid] && typeof chat.users[jid] === 'object' ? chat.users[jid] : {}
const next = { ...previous }
if (payload.name) next.name = String(payload.name)
next.msgCount = (Number(next.msgCount) || 0) + 1
if (payload.isCommand) next.cmdCount = (Number(next.cmdCount) || 0) + 1
next.lastMessageTime = now
next.lastMsg = now
chat.users[jid] = next
chat.activityUpdatedAt = now
statement('INSERT INTO chats(id,value,updated_at) VALUES(?,?,unixepoch()) ON CONFLICT(id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at').run(chatId, JSON.stringify(chat))
return true
}

parentPort.on('message', job => {
try {
const result = runJob(job)
parentPort.postMessage({ id: job.id, ok: true, result })
} catch (error) {
parentPort.postMessage({ id: job.id, ok: false, error: error?.stack || error?.message || String(error) })
}
})
