import path from 'path'
import { normalizeSessionJid } from './session-utils.js'

const DEFAULT_LIMIT = 5
const MAX_LIMIT = 50

function db() {
return global.db?.sqlite
}

function ensure() {
const sqlite = db()
if (!sqlite) return false
sqlite.exec(`
CREATE TABLE IF NOT EXISTS subbots (bot_jid TEXT PRIMARY KEY, owner_jid TEXT NOT NULL, session_id TEXT NOT NULL UNIQUE, session_path TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'stopped', paused INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'coin', created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), last_seen_at INTEGER NOT NULL DEFAULT 0, meta_json TEXT NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS group_routing (chat_id TEXT PRIMARY KEY, primary_bot_jid TEXT NOT NULL, updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000));
CREATE TABLE IF NOT EXISTS bot_chat_bans (bot_jid TEXT NOT NULL, chat_id TEXT NOT NULL, banned INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), PRIMARY KEY(bot_jid, chat_id));
CREATE TABLE IF NOT EXISTS subbot_config (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000));
CREATE INDEX IF NOT EXISTS idx_subbots_owner ON subbots(owner_jid);
CREATE INDEX IF NOT EXISTS idx_subbots_status ON subbots(status, paused);
CREATE INDEX IF NOT EXISTS idx_bot_chat_bans_chat ON bot_chat_bans(chat_id);
`)
return true
}

function now() {
return Date.now()
}

function parseJson(value, fallback = {}) {
try { return value ? JSON.parse(value) : fallback } catch { return fallback }
}

function row(row) {
if (!row) return null
return { ...row, paused: Boolean(row.paused), meta: parseJson(row.meta_json, {}) }
}

export function getSubbotLimit() {
if (!ensure()) return DEFAULT_LIMIT
const value = db().prepare("SELECT value FROM subbot_config WHERE key='limit'").get()?.value
const limit = Number(value)
return Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT
}

export function setSubbotLimit(limit) {
if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) throw new Error(`El límite debe ser un entero entre 1 y ${MAX_LIMIT}`)
ensure()
db().prepare("INSERT INTO subbot_config(key,value,updated_at) VALUES('limit',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at").run(String(limit), now())
return limit
}

export function getSubbotLimitBounds() {
return { defaultLimit: DEFAULT_LIMIT, maxLimit: MAX_LIMIT }
}

export function countActiveSubbots() {
if (!ensure()) return 0
return db().prepare("SELECT COUNT(*) count FROM subbots WHERE status IN ('connecting','open') AND paused=0").get().count || 0
}

export function upsertSubbot(data = {}) {
ensure()
const botJid = normalizeSessionJid(data.botJid || data.bot_jid || '') || `pending:${data.sessionId}`
const ownerJid = normalizeSessionJid(data.ownerJid || data.owner_jid || '')
const sessionId = String(data.sessionId || data.session_id || botJid).replace(/[^a-zA-Z0-9_.@-]/g, '_')
const sessionPath = data.sessionPath || data.session_path || path.join(process.cwd(), 'Rubyjadibot', sessionId)
const status = data.status || 'connecting'
const paused = data.paused ? 1 : 0
const currency = String(data.currency || 'coin').slice(0, 40)
const meta = JSON.stringify(data.meta || {})
if (!botJid.startsWith('pending:')) db().prepare('DELETE FROM subbots WHERE session_id=? AND bot_jid<>?').run(sessionId, botJid)
db().prepare("INSERT INTO subbots(bot_jid,owner_jid,session_id,session_path,status,paused,currency,created_at,updated_at,last_seen_at,meta_json) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(bot_jid) DO UPDATE SET owner_jid=excluded.owner_jid, session_id=excluded.session_id, session_path=excluded.session_path, status=excluded.status, paused=excluded.paused, currency=excluded.currency, updated_at=excluded.updated_at, last_seen_at=excluded.last_seen_at, meta_json=excluded.meta_json").run(botJid, ownerJid, sessionId, sessionPath, status, paused, currency, now(), now(), data.lastSeenAt || 0, meta)
return getSubbot(botJid)
}

export function updateSubbot(botJid, patch = {}) {
ensure()
const current = getSubbot(botJid)
if (!current) return null
return upsertSubbot({ ...current, ...patch, botJid: normalizeSessionJid(patch.botJid || botJid), ownerJid: patch.ownerJid || current.owner_jid, sessionId: patch.sessionId || current.session_id, sessionPath: patch.sessionPath || current.session_path, currency: patch.currency || current.currency, meta: patch.meta || current.meta })
}

export function getSubbot(botJid) {
if (!ensure()) return null
return row(db().prepare('SELECT * FROM subbots WHERE bot_jid=?').get(normalizeSessionJid(botJid)))
}

export function listSubbots({ activeOnly = false } = {}) {
if (!ensure()) return []
const sql = activeOnly ? "SELECT * FROM subbots WHERE status IN ('connecting','open') AND paused=0 ORDER BY updated_at DESC" : 'SELECT * FROM subbots ORDER BY updated_at DESC'
return db().prepare(sql).all().map(row)
}


export function deleteSubbotRecord(botJid, sessionId) {
ensure()
const normalized = normalizeSessionJid(botJid)
if (normalized) db().prepare('DELETE FROM subbots WHERE bot_jid=?').run(normalized)
if (sessionId) db().prepare('DELETE FROM subbots WHERE session_id=?').run(sessionId)
return true
}

export function deleteSubbotByOwner(ownerJid) {
ensure()
const jid = normalizeSessionJid(ownerJid)
const found = db().prepare('SELECT * FROM subbots WHERE owner_jid=? ORDER BY updated_at DESC LIMIT 1').get(jid)
if (!found) return null
db().prepare('DELETE FROM subbots WHERE bot_jid=?').run(found.bot_jid)
return row(found)
}

export function setGroupPrimaryBot(chatId, botJid) {
ensure()
const normalized = normalizeSessionJid(botJid) || 'primary'
db().prepare('INSERT INTO group_routing(chat_id,primary_bot_jid,updated_at) VALUES(?,?,?) ON CONFLICT(chat_id) DO UPDATE SET primary_bot_jid=excluded.primary_bot_jid, updated_at=excluded.updated_at').run(chatId, normalized, now())
return normalized
}

export function getGroupPrimaryBot(chatId) {
if (!ensure()) return ''
return db().prepare('SELECT primary_bot_jid FROM group_routing WHERE chat_id=?').get(chatId)?.primary_bot_jid || ''
}

export function resetGroupPrimaryBot(chatId) {
if (!ensure()) return false
return db().prepare('DELETE FROM group_routing WHERE chat_id=?').run(chatId).changes > 0
}

export function setBotChatBan(botJid, chatId, banned = true) {
ensure()
const jid = normalizeSessionJid(botJid) || 'primary'
if (banned) db().prepare('INSERT INTO bot_chat_bans(bot_jid,chat_id,banned,updated_at) VALUES(?,?,1,?) ON CONFLICT(bot_jid,chat_id) DO UPDATE SET banned=1, updated_at=excluded.updated_at').run(jid, chatId, now())
else db().prepare('DELETE FROM bot_chat_bans WHERE bot_jid=? AND chat_id=?').run(jid, chatId)
return true
}

export function isBotChatBanned(botJid, chatId) {
if (!ensure()) return false
const jid = normalizeSessionJid(botJid) || 'primary'
return Boolean(db().prepare('SELECT 1 FROM bot_chat_bans WHERE bot_jid=? AND chat_id=? AND banned=1').get(jid, chatId))
}
