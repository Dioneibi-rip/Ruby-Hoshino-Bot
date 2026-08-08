import Database from 'better-sqlite3'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import path from 'path'
import { normalizeJid } from '../core/identity-utils.js'
import { attachStore as attachLidStore } from '../core/lid-registry.js'

const USER_COLUMNS = {
id: { type: 'TEXT', defaultSql: null, primary: true },
coin: { type: 'INTEGER', defaultSql: '0' }, bank: { type: 'INTEGER', defaultSql: '0' }, exp: { type: 'INTEGER', defaultSql: '0' }, level: { type: 'INTEGER', defaultSql: '0' },
role: { type: 'TEXT', defaultSql: "'🌱 Viajero Novato'" }, limit: { type: 'INTEGER', defaultSql: '0' }, health: { type: 'INTEGER', defaultSql: '100' }, warn: { type: 'INTEGER', defaultSql: '0' },
name: { type: 'TEXT', defaultSql: "''" }, customName: { type: 'TEXT', defaultSql: "''" }, registered: { type: 'INTEGER', defaultSql: '1' }, age: { type: 'INTEGER', defaultSql: '-1' }, regTime: { type: 'INTEGER', defaultSql: '-1' },
birth: { type: 'TEXT', defaultSql: "''" }, genre: { type: 'TEXT', defaultSql: "''" }, description: { type: 'TEXT', defaultSql: "''" },
premium: { type: 'INTEGER', defaultSql: '0' }, premiumTime: { type: 'INTEGER', defaultSql: '0' }, banned: { type: 'INTEGER', defaultSql: '0' }, bannedReason: { type: 'TEXT', defaultSql: "''" }, antispam: { type: 'INTEGER', defaultSql: '0' }, muto: { type: 'INTEGER', defaultSql: '0' }, mutoChat: { type: 'TEXT', defaultSql: "''" }, lastBanMsg: { type: 'INTEGER', defaultSql: '0' },
job: { type: 'TEXT', defaultSql: "'Ninguno'" }, jobSince: { type: 'INTEGER', defaultSql: '0' }, jobXp: { type: 'INTEGER', defaultSql: '0' }, commands: { type: 'INTEGER', defaultSql: '0' },
msg_count: { type: 'INTEGER', defaultSql: '0' },
lastclaim: { type: 'INTEGER', defaultSql: '0' }, lastmonthly: { type: 'INTEGER', defaultSql: '0' }, monthly: { type: 'INTEGER', defaultSql: '0' }, weekly: { type: 'INTEGER', defaultSql: '0' }, dailyStreak: { type: 'INTEGER', defaultSql: '0' }, lastwork: { type: 'INTEGER', defaultSql: '0' }, lastAdventure: { type: 'INTEGER', defaultSql: '0' }, lastmining: { type: 'INTEGER', defaultSql: '0' }, lastmiming: { type: 'INTEGER', defaultSql: '0' }, lastrob: { type: 'INTEGER', defaultSql: '0' }, lastrob2: { type: 'INTEGER', defaultSql: '0' }, lastHeal: { type: 'INTEGER', defaultSql: '0' }, halloween: { type: 'INTEGER', defaultSql: '0' }, christmas: { type: 'INTEGER', defaultSql: '0' },
diamond: { type: 'INTEGER', defaultSql: '0' }, diamonds: { type: 'INTEGER', defaultSql: '0' }, emerald: { type: 'INTEGER', defaultSql: '0' }, iron: { type: 'INTEGER', defaultSql: '0' }, gold: { type: 'INTEGER', defaultSql: '0' }, coal: { type: 'INTEGER', defaultSql: '0' }, stone: { type: 'INTEGER', defaultSql: '0' }, tokens: { type: 'INTEGER', defaultSql: '0' }, gachaTokens: { type: 'INTEGER', defaultSql: '0' }, gachaPity: { type: 'INTEGER', defaultSql: '0' }, candies: { type: 'INTEGER', defaultSql: '0' }, gifts: { type: 'INTEGER', defaultSql: '0' }, joincount: { type: 'INTEGER', defaultSql: '0' }, pickaxedurability: { type: 'INTEGER', defaultSql: '100' },
marry: { type: 'TEXT', defaultSql: "''" }, extras: { type: 'TEXT', defaultSql: "'{}'" }, updated_at: { type: 'INTEGER', defaultSql: '(unixepoch())' }
}
const BOOLEAN_FIELDS = new Set(['registered', 'premium', 'banned', 'muto'])
const NUMERIC_FIELDS = new Set(Object.entries(USER_COLUMNS).filter(([, c]) => c.type === 'INTEGER').map(([name]) => name))
const INTERNAL_PROPS = new Set(['then', 'inspect', 'toJSON', 'valueOf', Symbol.toStringTag, Symbol.iterator])
// Campos que se SUMAN al fusionar dos filas del mismo usuario humano (recursos y contadores).
const ACCUMULATED_FIELDS = new Set(['coin', 'bank', 'exp', 'diamond', 'diamonds', 'emerald', 'iron', 'gold', 'coal', 'stone', 'tokens', 'gachaTokens', 'candies', 'gifts', 'commands', 'msg_count', 'jobXp', 'joincount', 'monthly', 'weekly'])
// El resto de los campos numericos (niveles, cooldowns `last*`, flags) toman el valor MAYOR.
// Tomar el maximo en los cooldowns evita que fusionar regale un claim/daily extra.

function ensureDir(filename) { const dir = path.dirname(filename); if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true }) }
function now() { return Date.now() }
function q(name) { return `"${String(name).replace(/"/g, '""')}"` }
function parseJSON(value, fallback = {}) { if (value == null || value === '') return fallback; if (typeof value === 'object') return value; try { return JSON.parse(value) } catch { return fallback } }
function stringify(value) { return JSON.stringify(value ?? {}) }
function sanitizeSqliteArg(value, { json = false } = {}) {
if (typeof value === 'undefined') return null
if (typeof value === 'boolean') return value ? 1 : 0
if (value instanceof Date) return value.getTime()
if (Buffer.isBuffer(value) || value instanceof Uint8Array) return value
if (json) return safeJsonString(value, {})
if (value && typeof value === 'object') return stringify(value)
return value
}
function sanitizeSqliteParams(params = {}) {
if (Array.isArray(params)) return params.map(value => sanitizeSqliteArg(value))
return Object.fromEntries(Object.entries(params || {}).map(([key, value]) => [key, sanitizeSqliteArg(value)]))
}
function sanitizeSqliteArgs(args = [], statement = null, { prefixNamed = false } = {}) {
if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0]) && !(args[0] instanceof Date) && !Buffer.isBuffer(args[0]) && !(args[0] instanceof Uint8Array)) {
const params = sanitizeSqliteParams(args[0])
const source = String(statement?.source || '')
const placeholders = [...source.matchAll(/[@:$][A-Za-z_][A-Za-z0-9_]*/g)].map(match => match[0])
if (!placeholders.length) return [params]
const bound = {}
for (const placeholder of [...new Set(placeholders)]) {
const key = placeholder.slice(1)
const outputKey = prefixNamed ? placeholder : key
if (Object.prototype.hasOwnProperty.call(params, placeholder)) bound[outputKey] = params[placeholder]
else if (Object.prototype.hasOwnProperty.call(params, key)) bound[outputKey] = params[key]
else bound[outputKey] = null
}
return [bound]
}
return args.map(value => sanitizeSqliteArg(value))
}
function sanitizeRowJson(row) {
if (!row || typeof row !== 'object') return row
for (const [key, value] of Object.entries(row)) {
if (typeof value !== 'string') continue
const trimmed = value.trim()
if (!trimmed || !/^(?:\{|\[)/.test(trimmed)) continue
try { row[key] = JSON.parse(trimmed) } catch {}
}
return row
}
function patchSQLiteStatement(statement) {
if (!statement || statement.__rubySanitized) return statement
for (const method of ['run', 'get', 'all', 'runAsync', 'getAsync', 'allAsync']) {
if (typeof statement[method] !== 'function') continue
const original = statement[method].bind(statement)
statement[method] = (...args) => {
let result
try {
result = original(...sanitizeSqliteArgs(args, statement))
} catch (error) {
if (error?.message !== 'Invalid argument') throw error
result = original(...sanitizeSqliteArgs(args, statement, { prefixNamed: true }))
}
if (method === 'get') return sanitizeRowJson(result)
if (method === 'all') return Array.isArray(result) ? result.map(sanitizeRowJson) : result
if (method === 'getAsync') return Promise.resolve(result).then(sanitizeRowJson)
if (method === 'allAsync') return Promise.resolve(result).then(rows => Array.isArray(rows) ? rows.map(sanitizeRowJson) : rows)
return result
}
}
Object.defineProperty(statement, '__rubySanitized', { value: true })
return statement
}
function patchSQLiteConnection(sqlite) {
if (!sqlite || sqlite.__rubySanitizedPrepare || typeof sqlite.prepare !== 'function') return sqlite
const prepare = sqlite.prepare.bind(sqlite)
sqlite.prepare = (...args) => patchSQLiteStatement(prepare(...args))
Object.defineProperty(sqlite, '__rubySanitizedPrepare', { value: true })
return sqlite
}
function safeJsonString(value, fallback = {}) {
if (value == null || value === '') return stringify(fallback)
if (typeof value === 'string') {
const trimmed = value.trim()
if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return stringify(fallback)
try {
const parsed = JSON.parse(trimmed)
return stringify(parsed ?? fallback)
} catch {
return stringify(value)
}
}
return stringify(value || fallback)
}

function normalizeSearchText(text = '') {
return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}
function ftsEscapeToken(token = '') { return String(token).replace(/"/g, '""') }
function buildFtsQuery(query = '') {
const tokens = normalizeSearchText(query).split(' ').filter(Boolean).slice(0, 8)
if (!tokens.length) return ''
return tokens.map(token => `"${ftsEscapeToken(token)}"*`).join(' OR ')
}
function typoVariants(token = '') {
const normalized = normalizeSearchText(token)
if (normalized.length < 4 || normalized.length > 16) return []
const variants = new Set()
for (let i = 0; i < normalized.length; i++) variants.add(normalized.slice(0, i) + normalized.slice(i + 1))
return [...variants].filter(value => value.length >= 3)
}
function characterFtsAttributes(character = {}) {
const values = []
for (const key of ['gender', 'birthday', 'age', 'status', 'species', 'role']) if (character[key]) values.push(character[key])
if (Array.isArray(character.aliases)) values.push(...character.aliases)
if (Array.isArray(character.tags)) values.push(...character.tags)
if (Array.isArray(character.img)) values.push(...character.img)
const source = normalizeSearchText([character.name, character.anime, ...values].join(' '))
values.push(...source.split(' ').flatMap(typoVariants))
return values.filter(Boolean).join(' ')
}
function findCharactersFile() {
return [path.resolve('./src/database/characters.json'), path.resolve('./database/characters.json')].find(candidate => existsSync(candidate))
}
function normalizeCharacterRow(character = {}) {
return {
id: String(character.id ?? '').trim(),
name: String(character.name ?? '').trim(),
anime: String(character.anime ?? character.source ?? '').trim(),
attributes: characterFtsAttributes(character)
}
}
function addColumnIfMissing(sqlite, table, column, definition) {
const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all().map(col => col.name)
if (columns.includes(column)) return columns
try {
sqlite.prepare(`ALTER TABLE ${table} ADD COLUMN ${definition}`).run()
} catch {
}
return sqlite.prepare(`PRAGMA table_info(${table})`).all().map(col => col.name)
}
function sqlDefault(name) { return USER_COLUMNS[name]?.defaultSql ?? "''" }
function jsDefault(name) { const raw = sqlDefault(name); if (raw === "''") return ''; if (raw === "'{}'") return {}; if (/^'.*'$/.test(raw)) return raw.slice(1, -1); if (/^\(?unixepoch\(\)\)?$/.test(raw)) return 0; return Number(raw) || 0 }
function normalizeValue(name, value) {
if (value instanceof Date) return value.getTime()
if (BOOLEAN_FIELDS.has(name)) return value ? 1 : 0
if (NUMERIC_FIELDS.has(name)) return Number.isFinite(Number(value)) ? Number(value) : jsDefault(name)
if (name === 'extras') return typeof value === 'string' ? value : stringify(value || {})
return value == null ? '' : String(value)
}
function publicValue(name, value) {
if (name === 'extras') return parseJSON(value, {})
if (BOOLEAN_FIELDS.has(name)) return Boolean(value)
if (NUMERIC_FIELDS.has(name)) return Number(value) || 0
return value ?? ''
}


class LruTtlCache extends Map {
constructor({ max = 10000, ttlMs = 30 * 60 * 1000, onEvict = null, shouldEvict = null } = {}) {
super()
this.max = Math.max(1, Number(max) || 10000)
this.ttlMs = Math.max(0, Number(ttlMs) || 0)
this.onEvict = typeof onEvict === 'function' ? onEvict : null
this.shouldEvict = typeof shouldEvict === 'function' ? shouldEvict : null
this.hits = 0
this.misses = 0
}
_now() { return Date.now() }
_isExpired(entry, now = this._now()) { return Boolean(entry && this.ttlMs > 0 && now - entry.touchedAt > this.ttlMs) }
_evict(key, entry) {
super.delete(key)
try { this.onEvict?.(key, entry?.value) } catch {}
}
get(key) {
const entry = super.get(key)
if (!entry) { this.misses++; return undefined }
const now = this._now()
if (this._isExpired(entry, now) && this._canEvict(key, entry.value)) { this._evict(key, entry); this.misses++; return undefined }
entry.touchedAt = now
super.delete(key)
super.set(key, entry)
this.hits++
return entry.value
}
set(key, value) {
const entry = { value, touchedAt: this._now() }
if (super.has(key)) super.delete(key)
super.set(key, entry)
this.prune()
return this
}
has(key) { return typeof this.get(key) !== 'undefined' }
delete(key) {
const entry = super.get(key)
const deleted = super.delete(key)
if (deleted) { try { this.onEvict?.(key, entry?.value) } catch {} }
return deleted
}
_canEvict(key, value) { return !this.shouldEvict || this.shouldEvict(key, value) !== false }
prune() {
const now = this._now()
for (const [key, entry] of super.entries()) {
if (!this._isExpired(entry, now)) continue
if (!this._canEvict(key, entry.value)) { entry.touchedAt = now; continue }
this._evict(key, entry)
}
let guard = this.size
while (this.size > this.max && guard-- > 0) {
const oldest = super.entries().next()
if (oldest.done) break
const [key, entry] = oldest.value
if (!this._canEvict(key, entry.value)) {
  super.delete(key)
  super.set(key, entry)
  continue
}
this._evict(key, entry)
}
}
clear() {
for (const [key, entry] of super.entries()) this._evict(key, entry)
return undefined
}
entries() { return Array.from(super.entries(), ([key, entry]) => [key, entry.value])[Symbol.iterator]() }
values() { return Array.from(super.values(), entry => entry.value)[Symbol.iterator]() }
keys() { return super.keys() }
[Symbol.iterator]() { return this.entries() }
}

export class SQLiteDatabase {
constructor(filename = './src/database/database.sqlite') {
this.filename = filename
ensureDir(filename)
this.sqlite = patchSQLiteConnection(new Database(filename))
this.sqlite.pragma('journal_mode = WAL')
this.sqlite.pragma('synchronous = NORMAL')
this.sqlite.pragma('cache_size = -20000')
this.sqlite.pragma('temp_store = MEMORY')
this.sqlite.pragma('mmap_size = 3000000000')
this.sqlite.pragma('busy_timeout = 5000')
this.sqlite.pragma('foreign_keys = ON')
this.dirtyUsers = new Set()
this.userProxyCache = new LruTtlCache({
  max: Number(process.env.SQLITE_USER_PROXY_CACHE_MAX || process.env.SQLITE_USER_CACHE_MAX || 10000),
  ttlMs: Number(process.env.SQLITE_USER_CACHE_TTL_MS || 30 * 60 * 1000)
})
this.userCache = new LruTtlCache({
  max: Number(process.env.SQLITE_USER_CACHE_MAX || 10000),
  ttlMs: Number(process.env.SQLITE_USER_CACHE_TTL_MS || 30 * 60 * 1000),
  shouldEvict: id => !this.dirtyUsers.has(id),
  onEvict: id => this.userProxyCache.delete(id)
})
this.recordProxyCache = new Map()
this.userWriteLocks = new Map()
this.positionalUpdateUserRow = null
this.flushIntervalMs = 60_000
this.flushDebounceMs = Number(process.env.SQLITE_BATCH_DELAY_MS || 5_000)
this.flushScheduled = false
this.flushTimerHandle = null
this.flushTimer = setInterval(() => this.flush(), this.flushIntervalMs)
this.flushTimer.unref?.()
this.tempCleanupIntervalMs = Number(process.env.SQLITE_TEMP_CLEANUP_INTERVAL_MS || 60 * 60 * 1000)
this.tempCleanupTimer = setInterval(() => this.cleanupExpiredTemporaryStates(), this.tempCleanupIntervalMs)
this.tempCleanupTimer.unref?.()
this.userCacheGcIntervalMs = Number(process.env.SQLITE_USER_CACHE_GC_INTERVAL_MS || 5 * 60 * 1000)
this.userCacheGcTimer = setInterval(() => {
  this.userCache.prune()
  this.userProxyCache.prune()
}, this.userCacheGcIntervalMs)
this.userCacheGcTimer.unref?.()
this._prepareSchema()
this._prepareStatements()
this._migrateJsonSectionsToTables()
this._bindPublicApi()
// Debe ir despues de `_bindPublicApi` para que `mergeUserRows` ya este ligado.
this._attachLidRegistry()
this.data = this._createDataFacade()
}

_userColumnSql(name, spec, { forAlter = false } = {}) {
const defaultSql = forAlter && /[()]/.test(String(spec.defaultSql)) ? '0' : spec.defaultSql
return `${q(name)} ${spec.type}${spec.primary ? ' PRIMARY KEY' : ` NOT NULL DEFAULT ${defaultSql}`}`
}
_prepareSchema() {
const userColumnsSql = Object.entries(USER_COLUMNS).map(([name, spec]) => this._userColumnSql(name, spec)).join(',\n  ')
this.sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
${userColumnsSql}
);
CREATE TABLE IF NOT EXISTS harem (group_id TEXT NOT NULL, character_id TEXT NOT NULL, user_id TEXT NOT NULL, last_claim_time INTEGER NOT NULL DEFAULT 0, protection_json TEXT NOT NULL DEFAULT '{}', PRIMARY KEY(group_id, character_id));
CREATE TABLE IF NOT EXISTS marriages (group_id TEXT NOT NULL DEFAULT 'global', user_id TEXT NOT NULL, partner_id TEXT NOT NULL DEFAULT '', married_at TEXT DEFAULT CURRENT_TIMESTAMP, data TEXT NOT NULL DEFAULT '{}', PRIMARY KEY(group_id, user_id));
CREATE VIRTUAL TABLE IF NOT EXISTS characters_fts USING fts5(id, name, anime, attributes, tokenize='unicode61 remove_diacritics 2');
CREATE TABLE IF NOT EXISTS character_favorites (user_id TEXT PRIMARY KEY, character_id TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS claim_config (user_id TEXT PRIMARY KEY, message TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS waifus_venta (group_id TEXT NOT NULL, character_id TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', precio INTEGER NOT NULL DEFAULT 0, vendedor TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT 0, extra_json TEXT NOT NULL DEFAULT '{}', PRIMARY KEY(group_id, character_id));
CREATE TABLE IF NOT EXISTS gacha_market (id_sale INTEGER PRIMARY KEY AUTOINCREMENT, seller_jid TEXT NOT NULL, character_id TEXT NOT NULL, price INTEGER NOT NULL DEFAULT 0, group_id TEXT NOT NULL DEFAULT 'global', created_at INTEGER NOT NULL DEFAULT 0);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gacha_market_group_character ON gacha_market(group_id, character_id);
CREATE TABLE IF NOT EXISTS groups (id TEXT PRIMARY KEY, subject TEXT NOT NULL DEFAULT '', owner TEXT NOT NULL DEFAULT '', participants_json TEXT NOT NULL DEFAULT '[]', metadata_json TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS chats (id TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS json_records (section TEXT NOT NULL, id TEXT NOT NULL, value TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL DEFAULT (unixepoch()), PRIMARY KEY(section,id));
CREATE TABLE IF NOT EXISTS sticker_cmds (hash TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS temporary_states (scope TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL DEFAULT '{}', expire_at INTEGER NOT NULL, updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), PRIMARY KEY(scope, key));
CREATE TABLE IF NOT EXISTS subbots (bot_jid TEXT PRIMARY KEY, owner_jid TEXT NOT NULL, session_id TEXT NOT NULL UNIQUE, session_path TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'stopped', paused INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'coin', created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), last_seen_at INTEGER NOT NULL DEFAULT 0, meta_json TEXT NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS group_routing (chat_id TEXT PRIMARY KEY, primary_bot_jid TEXT NOT NULL, updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000));
CREATE TABLE IF NOT EXISTS bot_chat_bans (bot_jid TEXT NOT NULL, chat_id TEXT NOT NULL, banned INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), PRIMARY KEY(bot_jid, chat_id));
CREATE TABLE IF NOT EXISTS subbot_config (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000));
CREATE TABLE IF NOT EXISTS timelock_cooldown (jid TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, value TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000));
CREATE TABLE IF NOT EXISTS jid_aliases (lid TEXT PRIMARY KEY, pn TEXT NOT NULL, merged_at INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE INDEX IF NOT EXISTS idx_jid_aliases_pn ON jid_aliases(pn);
CREATE INDEX IF NOT EXISTS idx_users_jid ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
CREATE INDEX IF NOT EXISTS idx_users_coin ON users(coin);
CREATE INDEX IF NOT EXISTS idx_users_bank ON users(bank);
CREATE INDEX IF NOT EXISTS idx_users_exp_rank ON users(exp DESC, level DESC, id ASC);
CREATE INDEX IF NOT EXISTS idx_users_level_rank ON users(level DESC, exp DESC, id ASC);
CREATE INDEX IF NOT EXISTS idx_users_coin_rank ON users(coin DESC, id ASC);
CREATE INDEX IF NOT EXISTS idx_users_bank_rank ON users(bank DESC, id ASC);
CREATE INDEX IF NOT EXISTS idx_users_premium_time ON users(premiumTime);
CREATE INDEX IF NOT EXISTS idx_users_marry ON users(marry);
CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at);
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_json_records_section_updated_at ON json_records(section, updated_at);
CREATE INDEX IF NOT EXISTS idx_sticker_cmds_updated_at ON sticker_cmds(updated_at);
CREATE INDEX IF NOT EXISTS idx_temporary_states_expire_at ON temporary_states(expire_at);
CREATE INDEX IF NOT EXISTS idx_subbots_owner ON subbots(owner_jid);
CREATE INDEX IF NOT EXISTS idx_subbots_status ON subbots(status, paused);
CREATE INDEX IF NOT EXISTS idx_bot_chat_bans_chat ON bot_chat_bans(chat_id);
CREATE INDEX IF NOT EXISTS idx_timelock_cooldown_expires_at ON timelock_cooldown(expires_at);
CREATE INDEX IF NOT EXISTS idx_marriages_partner ON marriages(group_id, partner_id);
CREATE INDEX IF NOT EXISTS idx_harem_user ON harem(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_waifus_venta_seller ON waifus_venta(group_id, vendedor);
CREATE INDEX IF NOT EXISTS idx_gacha_market_seller ON gacha_market(group_id, seller_jid);
CREATE INDEX IF NOT EXISTS idx_gacha_market_group_sale ON gacha_market(group_id, id_sale);
INSERT INTO metadata(key,value) VALUES('schema_version','4-relational-users-expanded') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
`)
try {
this.sqlite.prepare("ALTER TABLE harem ADD COLUMN group_id TEXT NOT NULL DEFAULT 'global'").run()
} catch {
}
try {
this.sqlite.prepare("ALTER TABLE marriages ADD COLUMN group_id TEXT NOT NULL DEFAULT 'global'").run()
} catch {
}
try {
this.sqlite.prepare('ALTER TABLE marriages ADD COLUMN married_at TEXT DEFAULT CURRENT_TIMESTAMP').run()
} catch {
}
this._migrateUserColumns()
this._ensureJsonSectionTables()
this._migrateRelationalTables()
this._syncCharactersFtsFromJson()
this.sqlite.prepare("INSERT INTO gacha_market(seller_jid,character_id,price,group_id,created_at) SELECT vendedor,character_id,precio,group_id,created_at FROM waifus_venta WHERE vendedor<>'' AND character_id<>'' ON CONFLICT(group_id,character_id) DO NOTHING").run()
try {
this.sqlite.prepare('CREATE INDEX IF NOT EXISTS idx_harem_user ON harem(group_id, user_id)').run()
} catch {
}
this._migrateJsonSectionsToTables()
this._migrateStickerCommands()
}
_ensureJsonSectionTables() {
for (const table of ['chats', 'settings']) {
let columns = addColumnIfMissing(this.sqlite, table, 'value', `value TEXT NOT NULL DEFAULT '{}'`)
columns = addColumnIfMissing(this.sqlite, table, 'updated_at', 'updated_at INTEGER NOT NULL DEFAULT 0')
if (columns.includes('data')) {
try {
this.sqlite.prepare(`UPDATE ${table} SET value=CASE WHEN value IS NULL OR value='' OR value='{}' THEN COALESCE(NULLIF(data, ''), '{}') ELSE value END, data=CASE WHEN data IS NULL OR data='' THEN COALESCE(NULLIF(value, ''), '{}') ELSE data END`).run()
} catch (error) {
console.error(`[sqlite] no se pudieron normalizar columnas JSON en ${table}`, error)
}
}
}
}
_migrateJsonSectionsToTables() {
this._ensureJsonSectionTables()
for (const section of ['chats', 'settings']) {
let rows = []
try {
rows = this.statements?.allJson ? this.statements.allJson.all(section) : this.sqlite.prepare('SELECT id,value FROM json_records WHERE section=?').all(section)
} catch (error) {
console.error(`[sqlite] no se pudo leer json_records para migrar ${section}`, error)
continue
}
const st = this._jsonSectionUpsertStatement(section, { ignoreExisting: true })
for (const row of rows) {
try {
st.run(this._jsonSectionPayload(section, row.id, row.value))
} catch (error) {
console.error(`[sqlite] no se pudo migrar ${section} ${row?.id || '<sin-id>'}`, error)
}
}
}
this._migrateJsonUsersToTable()
}
_jsonSectionPayload(section, id, value) {
const payload = {
id: sanitizeSqliteArg(id),
value: sanitizeSqliteArg(value, { json: true }),
updated_at: sanitizeSqliteArg(Math.floor(Date.now() / 1000))
}
const columns = new Set(this.sqlite.prepare(`PRAGMA table_info(${section})`).all().map(col => col.name))
if (columns.has('data')) payload.data = payload.value
return sanitizeSqliteParams(payload)
}
_jsonSectionUpsertStatement(section, { ignoreExisting = false } = {}) {
const columns = new Set(this.sqlite.prepare(`PRAGMA table_info(${section})`).all().map(col => col.name))
const insertColumns = ['id']
if (columns.has('value')) insertColumns.push('value')
if (columns.has('data')) insertColumns.push('data')
if (columns.has('updated_at')) insertColumns.push('updated_at')
const placeholders = insertColumns.map(column => `@${column}`).join(',')
const updates = []
if (!ignoreExisting) {
if (columns.has('value')) updates.push('value=excluded.value')
if (columns.has('data')) updates.push('data=excluded.data')
if (columns.has('updated_at')) updates.push('updated_at=excluded.updated_at')
}
const conflict = ignoreExisting || !updates.length ? 'DO NOTHING' : `DO UPDATE SET ${updates.join(', ')}`
return this.sqlite.prepare(`INSERT INTO ${section}(${insertColumns.join(',')}) VALUES(${placeholders}) ON CONFLICT(id) ${conflict}`)
}
_migrateJsonUsersToTable() {
let rows = []
try {
rows = this.statements?.allJson ? this.statements.allJson.all('users') : this.sqlite.prepare('SELECT id,value FROM json_records WHERE section=?').all('users')
} catch (error) {
console.error('[sqlite] no se pudo leer json_records para migrar users', error)
return
}
for (const row of rows) {
try {
this.updateUser(row.id, parseJSON(safeJsonString(row.value), {}))
} catch (error) {
console.error(`[sqlite] no se pudo migrar users ${row?.id || '<sin-id>'}`, error)
}
}
}

_migrateStickerCommands() {
let rows = []
try {
rows = this.statements?.allJson ? this.statements.allJson.all('sticker') : this.sqlite.prepare('SELECT id,value FROM json_records WHERE section=?').all('sticker')
} catch (error) {
console.error('[sqlite] no se pudo leer json_records para migrar sticker', error)
return
}
const st = this.sqlite.prepare("INSERT INTO sticker_cmds(hash,value,updated_at) VALUES(?,COALESCE(NULLIF(?, ''), '{}'),unixepoch()) ON CONFLICT(hash) DO NOTHING")
for (const row of rows) {
try {
st.run(row.id, safeJsonString(row.value || '{}', {}))
} catch (error) {
console.error(`[sqlite] no se pudo migrar sticker ${row?.id || '<sin-id>'}`, error)
}
}
}

getStickerCommands() {
try {
return Object.fromEntries(this.sqlite.prepare('SELECT hash,value FROM sticker_cmds').all().map(r => [r.hash, parseJSON(r.value || '{}', {})]))
} catch (error) {
console.error('[sqlite] no se pudo leer sticker_cmds', error)
return {}
}
}
replaceStickerCommands(values = {}) {
const tx = this.sqlite.transaction(obj => {
this.sqlite.prepare('DELETE FROM sticker_cmds').run()
const st = this.sqlite.prepare("INSERT OR REPLACE INTO sticker_cmds(hash,value,updated_at) VALUES(?,COALESCE(NULLIF(?, ''), '{}'),unixepoch())")
for (const [hash, value] of Object.entries(obj || {})) st.run(hash, safeJsonString(value || '{}', {}))
})
return tx(values || {})
}
getStickerCommand(hash) {
try {
const row = this.sqlite.prepare('SELECT value FROM sticker_cmds WHERE hash=?').get(hash)
return row ? parseJSON(row.value || '{}', {}) : undefined
} catch (error) {
console.error('[sqlite] no se pudo consultar sticker_cmds', error)
return undefined
}
}
setStickerCommand(hash, value = {}) {
return this.sqlite.prepare("INSERT OR REPLACE INTO sticker_cmds(hash,value,updated_at) VALUES(?,COALESCE(NULLIF(?, ''), '{}'),unixepoch())").run(hash, safeJsonString(value || '{}', {}))
}

_migrateUserColumns() {
const existing = new Set(this.sqlite.prepare('PRAGMA table_info(users)').all().map(col => col.name))
for (const [name, spec] of Object.entries(USER_COLUMNS)) {
if (existing.has(name)) continue
if (spec.primary) continue
this.sqlite.prepare(`ALTER TABLE users ADD COLUMN ${this._userColumnSql(name, spec, { forAlter: true })}`).run()
}
this.sqlite.prepare(`UPDATE users SET ${Object.entries(USER_COLUMNS).filter(([name, spec]) => !spec.primary && spec.defaultSql !== null).map(([name]) => `${q(name)} = COALESCE(${q(name)}, ${sqlDefault(name)})`).join(', ')}`).run()
this.sqlite.prepare(`UPDATE users SET role=${sqlDefault('role')} WHERE role IS NULL OR role='' OR role='Nuv' OR role='*Chibi Aventurero/a V*🐙'`).run()
}
_migrateRelationalTables() {
const ensureUserIdColumn = table => {
const cols = this.sqlite.prepare(`PRAGMA table_info(${table})`).all().map(col => col.name)
if (cols.includes('user_id')) return
const source = cols.includes('id') ? 'id' : cols.includes('owner_jid') ? 'owner_jid' : ''
if (!source) return
this.sqlite.prepare(`ALTER TABLE ${table} ADD COLUMN user_id TEXT NOT NULL DEFAULT ''`).run()
this.sqlite.prepare(`UPDATE ${table} SET user_id=${q(source)} WHERE user_id=''`).run()
}
for (const table of ['marriages', 'character_favorites', 'claim_config']) ensureUserIdColumn(table)
let marriageCols = addColumnIfMissing(this.sqlite, 'marriages', 'group_id', "group_id TEXT NOT NULL DEFAULT 'global'")
marriageCols = addColumnIfMissing(this.sqlite, 'marriages', 'married_at', 'married_at TEXT DEFAULT CURRENT_TIMESTAMP')
marriageCols = addColumnIfMissing(this.sqlite, 'marriages', 'data', "data TEXT NOT NULL DEFAULT '{}'")
this.sqlite.prepare("UPDATE marriages SET data='{}' WHERE data IS NULL OR data=''").run()
if (!marriageCols.includes('partner_id')) {
marriageCols = addColumnIfMissing(this.sqlite, 'marriages', 'partner_id', "partner_id TEXT NOT NULL DEFAULT ''")
const source = marriageCols.includes('partner') ? 'partner' : marriageCols.includes('marry') ? 'marry' : marriageCols.includes('casado') ? 'casado' : ''
if (source) this.sqlite.prepare(`UPDATE marriages SET partner_id=${q(source)} WHERE partner_id=''`).run()
}
let haremCols = addColumnIfMissing(this.sqlite, 'harem', 'group_id', "group_id TEXT NOT NULL DEFAULT 'global'")
haremCols = addColumnIfMissing(this.sqlite, 'harem', 'character_id', "character_id TEXT NOT NULL DEFAULT ''")
haremCols = addColumnIfMissing(this.sqlite, 'harem', 'last_claim_time', 'last_claim_time INTEGER NOT NULL DEFAULT 0')
haremCols = addColumnIfMissing(this.sqlite, 'harem', 'protection_json', "protection_json TEXT NOT NULL DEFAULT '{}'")
if (!haremCols.includes('user_id')) {
const source = haremCols.includes('owner_jid') ? 'owner_jid' : haremCols.includes('id') ? 'id' : ''
haremCols = addColumnIfMissing(this.sqlite, 'harem', 'user_id', "user_id TEXT NOT NULL DEFAULT ''")
if (source) this.sqlite.prepare(`UPDATE harem SET user_id=${q(source)} WHERE user_id=''`).run()
}
}
_prepareStatements() {
this.statements = {
getJson: this.sqlite.prepare('SELECT value FROM json_records WHERE section=? AND id=?'),
allJson: this.sqlite.prepare('SELECT id,value FROM json_records WHERE section=?'),
upsertJson: this.sqlite.prepare('INSERT INTO json_records(section,id,value,updated_at) VALUES(?,?,?,unixepoch()) ON CONFLICT(section,id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at'),
getUserById: this.sqlite.prepare('SELECT * FROM users WHERE id=?'),
insertUser: this.sqlite.prepare('INSERT OR IGNORE INTO users(id) VALUES(?)'),
userExists: this.sqlite.prepare('SELECT 1 FROM users WHERE id=?'),
listUsers: this.sqlite.prepare('SELECT * FROM users'),
updateNumericUserField: new Map(),
topUsers: new Map(),
userRank: new Map(),
transferEconomy: new Map(),
transferBetweenUsersDebit: new Map(),
transferBetweenUsersCredit: new Map(),
settleUserBet: new Map(),
updateUserRow: this.sqlite.prepare(`UPDATE users SET ${Object.keys(USER_COLUMNS).filter(key => key !== 'id' && key !== 'updated_at').map(key => `${q(key)} = @${key}`).join(', ')}, updated_at = unixepoch() WHERE id = @id`),
addUserActivity: this.sqlite.prepare('UPDATE users SET exp = COALESCE(exp, 0) + ?, coin = COALESCE(coin, 0) + ?, msg_count = COALESCE(msg_count, 0) + ?, updated_at = unixepoch() WHERE id = ?')
}
}


_bindPublicApi() {
for (const name of ['topUsers', 'getTopUsers', 'userRank', 'countUsers', 'countRegisteredUsers', 'getUserAsync', 'getRecord', 'setRecord', 'countSection', 'getUser', 'getGroup', 'upsertGroupMetadata', 'listGroups', 'updateUser', 'updateUserAsync', 'userExists', 'getChat', 'updateChat', 'listUsers', 'listUserRows', 'addMoney', 'addEconomy', 'setEconomy', 'incrementUserField', 'incrementUserActivity', 'incrementUserActivityFast', 'transferBetweenUsers', 'mergeUserRows', 'settleUserBet', 'buyGachaMarketSale', 'syncCharactersFts', 'searchCharacter', 'getSection', 'replaceSection', 'setMarriagePair', 'divorcePair', 'getMarriages', 'replaceMarriages', 'getHarem', 'replaceHarem', 'upsertHaremClaim', 'getGachaMarket', 'replaceGachaMarket', 'addGachaMarketSale', 'removeGachaMarketSale', 'getStickerCommands', 'replaceStickerCommands', 'getStickerCommand', 'setStickerCommand', 'get', 'set', 'has', 'delete', 'read', 'write', 'flush', 'scheduleFlush', 'save', 'close', 'snapshot']) {
this[name] = this[name].bind(this)
}
}

_rowToUser(row) {
if (!row) return undefined
const user = {}
for (const name of Object.keys(USER_COLUMNS)) if (name !== 'updated_at') user[name] = publicValue(name, row[name])
return this._hydrateUser(user)
}
_hydrateUser(user) {
if (!user || typeof user !== 'object') user = {}
for (const name of Object.keys(USER_COLUMNS)) if (name !== 'id' && name !== 'updated_at' && typeof user[name] === 'undefined') user[name] = jsDefault(name)
if (!user.job) user.job = 'Ninguno'
if (!user.extras || typeof user.extras !== 'object' || Array.isArray(user.extras)) user.extras = {}
if (typeof user.registered === 'undefined') user.registered = true
return user
}
_rawUser(id, { bypassCache = false } = {}) { return !bypassCache && this.userCache.get(id) || this._rowToUser(this.statements.getUserById.get(id)) }
async _getUserRowAsync(id) {
const statement = this.statements.getUserById
if (typeof statement.getAsync === 'function') return this._rowToUser(await statement.getAsync(id))
return this._rowToUser(statement.get(id))
}
async _runUserRowAsync(id, user) {
return this._writeUserRow(id, user)
}
/**
 * Conecta este almacen al registro de alias LID<->PN.
 * A partir de aqui `normalizeJid()` puede resolver LIDs de forma sincrona y
 * cada mapeo nuevo dispara la fusion de las filas duplicadas.
 */
_attachLidRegistry() {
const loadAliases = this.sqlite.prepare('SELECT lid, pn, merged_at FROM jid_aliases')
const saveAlias = this.sqlite.prepare('INSERT INTO jid_aliases(lid,pn,merged_at,updated_at) VALUES(?,?,0,unixepoch()) ON CONFLICT(lid) DO UPDATE SET pn=excluded.pn, updated_at=unixepoch()')
const markMerged = this.sqlite.prepare('UPDATE jid_aliases SET merged_at=unixepoch() WHERE lid=?')
attachLidStore({
load: () => loadAliases.all(),
save: (lid, pn) => saveAlias.run(lid, pn),
merge: (fromId, toId) => this.mergeUserRows(fromId, toId),
markMerged: lid => markMerged.run(lid),
})
}

/** Reapunta hacia `target` todas las tablas relacionales que guardan un JID de usuario. */
_repointUserReferences(source, target) {
// Tablas donde el JID no forma parte de la PK: update directo.
const plainUpdates = [
'UPDATE harem SET user_id=? WHERE user_id=?',
'UPDATE marriages SET partner_id=? WHERE partner_id=?',
'UPDATE gacha_market SET seller_jid=? WHERE seller_jid=?',
'UPDATE waifus_venta SET vendedor=? WHERE vendedor=?',
'UPDATE users SET marry=? WHERE marry=?',
'UPDATE subbots SET owner_jid=? WHERE owner_jid=?',
]
for (const sql of plainUpdates) {
try { this.sqlite.prepare(sql).run(target, source) } catch {}
}
// Tablas donde el JID SI forma parte de la PK: `UPDATE OR IGNORE` y luego se
// descarta el sobrante, de modo que la fila del destino siempre gana.
const keyedUpdates = [
['UPDATE OR IGNORE marriages SET user_id=? WHERE user_id=?', 'DELETE FROM marriages WHERE user_id=?'],
['UPDATE OR IGNORE character_favorites SET user_id=? WHERE user_id=?', 'DELETE FROM character_favorites WHERE user_id=?'],
['UPDATE OR IGNORE claim_config SET user_id=? WHERE user_id=?', 'DELETE FROM claim_config WHERE user_id=?'],
['UPDATE OR IGNORE timelock_cooldown SET jid=? WHERE jid=?', 'DELETE FROM timelock_cooldown WHERE jid=?'],
]
for (const [updateSql, deleteSql] of keyedUpdates) {
try {
this.sqlite.prepare(updateSql).run(target, source)
this.sqlite.prepare(deleteSql).run(source)
} catch {}
}
}

/** Combina dos filas hidratadas segun la politica de campos acumulables / maximos / texto. */
_combineUserRows(sourceRow, targetRow) {
const source = this._hydrateUser(sourceRow || {})
const target = this._hydrateUser(targetRow || {})
const merged = { ...target }
for (const name of Object.keys(USER_COLUMNS)) {
if (name === 'id' || name === 'updated_at') continue
if (name === 'extras') continue
const a = source[name]
const b = target[name]
if (NUMERIC_FIELDS.has(name) && !BOOLEAN_FIELDS.has(name)) {
const na = Number(a) || 0
const nb = Number(b) || 0
merged[name] = ACCUMULATED_FIELDS.has(name) ? na + nb : Math.max(na, nb)
continue
}
if (BOOLEAN_FIELDS.has(name)) {
merged[name] = Boolean(a) || Boolean(b)
continue
}
// Texto: gana el destino si ya tiene contenido; si esta vacio se hereda del origen.
const emptyTarget = b == null || b === ''
merged[name] = emptyTarget ? a : b
}
merged.extras = { ...(source.extras || {}), ...(target.extras || {}) }
return this._hydrateUser(merged)
}

/**
 * Fusiona la fila `fromId` dentro de `toId` sin perder datos y en una sola transaccion.
 * Se usa como puente en vivo entre los `@lid` nuevos, los `@s.whatsapp.net` viejos y
 * las filas fantasma que genero el bug anterior de `normalizeJid`.
 *
 * Ojo: se trabaja con los ids TAL CUAL, sin pasar por `normalizeJid`, porque el
 * objetivo es precisamente reconciliar identificadores que no son canonicos.
 * @returns {boolean} true si hubo algo que fusionar
 */
mergeUserRows(fromId, toId) {
const source = String(fromId || '').trim().toLowerCase()
const target = String(toId || '').trim().toLowerCase()
if (!source || !target || source === target) return false
const selectRow = this.sqlite.prepare('SELECT * FROM users WHERE id=?')
const tx = this.sqlite.transaction(() => {
const sourceRow = this._rowToUser(selectRow.get(source))
// Reapuntamos siempre: puede haber harem/marriages del id viejo aunque su fila
// de `users` ya no exista.
this._repointUserReferences(source, target)
if (!sourceRow) return false
this.statements.insertUser.run(target)
const targetRow = this._rowToUser(selectRow.get(target))
const merged = this._combineUserRows(sourceRow, targetRow)
this._writeUserRow(target, merged)
this.sqlite.prepare('DELETE FROM users WHERE id=?').run(source)
return true
})
let changed = false
try {
changed = tx()
} catch (error) {
console.error('[sqlite] no se pudo fusionar', source, '->', target, error?.message || error)
return false
}
// Invalidamos las caches de AMBOS ids: el origen desaparecio y el destino cambio.
for (const id of [source, target]) {
this.userCache.delete(id)
this.userProxyCache.delete(id)
this.dirtyUsers.delete(id)
}
if (changed) console.log('[v0][sqlite] usuario fusionado', source, '->', target)
return changed
}

_withUserWriteLock(id, task) {
const previous = this.userWriteLocks.get(id) || Promise.resolve()
const next = previous.catch(() => {}).then(task)
this.userWriteLocks.set(id, next.finally(() => {
if (this.userWriteLocks.get(id) === next) this.userWriteLocks.delete(id)
}))
return next
}
_createUser(id) { this.statements.insertUser.run(id); const user = this._rowToUser(this.statements.getUserById.get(id)); if (user) this.userCache.set(id, user); return user }
userExists(id) { const userId = normalizeJid(id); return Boolean(userId && (this.userCache.has(userId) || this.statements.userExists.get(userId))) }
listUserRows() { return this.statements.listUsers.all().map(row => { const user = this._rowToUser(row); if (user) this.userCache.set(user.id, user); return user }) }
listUsers() { const out = {}; for (const user of this.listUserRows()) out[user.id] = this.getUser(user.id); return out }
getUser(id) { const userId = normalizeJid(id); if (!userId) throw new TypeError('getUser requiere un id de usuario válido'); if (!this.userCache.has(userId)) { const row = this._rowToUser(this.statements.getUserById.get(userId)) || this._createUser(userId); if (row) this.userCache.set(userId, row) } return this.userCache.has(userId) ? this._userProxy(userId) : {} }
async getUserAsync(id, { bypassCache = false } = {}) {
const userId = normalizeJid(id)
if (!userId) throw new TypeError('getUserAsync requiere un id de usuario válido')
const pending = this.userWriteLocks.get(userId)
if (pending) await pending.catch(() => {})
if (bypassCache || !this.userCache.has(userId)) {
let row = await this._getUserRowAsync(userId)
if (!row) row = this._createUser(userId)
if (row) this.userCache.set(userId, row)
}
return this.getUser(userId)
}
_userProxy(id) {
if (this.userProxyCache.has(id)) return this.userProxyCache.get(id)
const proxy = new Proxy({}, {
get: (_target, prop) => {
if (INTERNAL_PROPS.has(prop)) return undefined
if (prop === 'toJSON') return () => this.userCache.get(id) || this._rawUser(id)
if (typeof prop !== 'string') return undefined
const user = this.userCache.get(id) || this._rawUser(id) || this._createUser(id) || {}
return Object.prototype.hasOwnProperty.call(user, prop) ? user[prop] : user.extras?.[prop]
},
set: (_target, prop, value) => {
if (typeof prop !== 'string') return false
this.updateUser(id, { [prop]: value })
return true
},
deleteProperty: (_target, prop) => {
if (typeof prop !== 'string') return false
this.updateUser(id, { [prop]: jsDefault(prop) })
return true
},
ownKeys: () => Object.keys(this.userCache.get(id) || this._rawUser(id) || this._createUser(id)),
getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true })
})
this.userProxyCache.set(id, proxy)
return proxy
}
_markUserDirty(id) {
if (id && typeof id === 'string') {
this.dirtyUsers.add(id)
this.scheduleFlush()
}
}
scheduleFlush() {
if (this.flushScheduled) return
this.flushScheduled = true
this.flushTimerHandle = setTimeout(() => {
this.flushScheduled = false
this.flushTimerHandle = null
try { this.flush() } catch (error) { console.error('[sqlite] flush error', error) }
}, this.flushDebounceMs)
this.flushTimerHandle.unref?.()
}
_writeUserRow(id, user) {
const columns = Object.keys(USER_COLUMNS).filter(key => key !== 'id' && key !== 'updated_at')
const values = columns.map(key => key === 'extras' ? stringify(user?.extras || {}) : normalizeValue(key, user?.[key]))
if (!this.positionalUpdateUserRow) {
this.positionalUpdateUserRow = this.sqlite.prepare(`UPDATE users SET ${columns.map(key => `${q(key)} = ?`).join(', ')}, updated_at = unixepoch() WHERE id = ?`)
}
this.positionalUpdateUserRow.run(...values, id)
}
_mergeUserPatch(current = {}, patch = {}) {
const next = this._hydrateUser({ ...current, extras: { ...(current?.extras || {}) } })
const safePatch = patch && typeof patch === 'object' ? patch : {}
const patchExtras = safePatch.extras || {}
for (const [key, value] of Object.entries(safePatch)) {
if (key === 'id' || key === 'updated_at' || typeof value === 'undefined') continue
if (key === 'extras') next.extras = { ...next.extras, ...(typeof patchExtras === 'object' && patchExtras !== null ? patchExtras : {}) }
else if (key in USER_COLUMNS) next[key] = publicValue(key, normalizeValue(key, value))
else next.extras[key] = value instanceof Date ? value.getTime() : value
}
return next
}
updateUser(id, patch = {}) {
const userId = normalizeJid(id)
if (!userId) throw new TypeError('updateUser requiere un id de usuario válido')
const current = this._hydrateUser(this._rawUser(userId, { bypassCache: true }) || this._createUser(userId) || { id: userId, extras: {} })
const next = this._mergeUserPatch(current, patch)
this.userCache.set(userId, next)
this._writeUserRow(userId, next)
return this.getUser(userId)
}
async updateUserAsync(id, patch = {}) {
const userId = normalizeJid(id)
if (!userId) throw new TypeError('updateUserAsync requiere un id de usuario válido')
return this._withUserWriteLock(userId, async () => {
let current = await this._getUserRowAsync(userId)
if (!current) current = this._createUser(userId)
current = this._hydrateUser(current || { id: userId, extras: {} })
const next = this._mergeUserPatch(current, patch)
this.userCache.set(userId, next)
await this._runUserRowAsync(userId, next)
return this.getUser(userId)
})
}

transferUserEconomy(id, { from = 'coin', to = 'bank', amount } = {}) {
const userId = normalizeJid(id)
if (!userId) throw new TypeError('transferUserEconomy requiere un id de usuario válido')
const safeAmount = Math.trunc(Number(amount) || 0)
if (!safeAmount || safeAmount <= 0) throw new TypeError('transferUserEconomy requiere una cantidad positiva')
for (const field of [from, to]) {
if (!(field in USER_COLUMNS) || !NUMERIC_FIELDS.has(field)) throw new Error(`Campo de economía no permitido: ${field}`)
}
this._createUser(userId)
const tx = this.sqlite.transaction(() => {
const key = `${from}:${to}`
let statement = this.statements.transferEconomy.get(key)
if (!statement) {
statement = this.sqlite.prepare(`UPDATE users SET ${q(from)} = COALESCE(${q(from)}, 0) - ?, ${q(to)} = COALESCE(${q(to)}, 0) + ?, updated_at = unixepoch() WHERE id = ? AND COALESCE(${q(from)}, 0) >= ?`)
this.statements.transferEconomy.set(key, statement)
}
const result = statement.run(safeAmount, safeAmount, userId, safeAmount)
if (!result.changes) return null
const user = this._rowToUser(this.statements.getUserById.get(userId))
if (user) this.userCache.set(userId, user)
return this.getUser(userId)
})
return tx()
}

transferBetweenUsers(fromId, toId, { debitField = 'bank', creditField = 'coin', amount, creditAmount = amount } = {}) {
const senderId = normalizeJid(fromId)
const targetId = normalizeJid(toId)
if (!senderId || !targetId) throw new TypeError('transferBetweenUsers requiere usuarios válidos')
if (senderId === targetId) throw new Error('No se puede transferir al mismo usuario')
const debit = Math.trunc(Number(amount) || 0)
const credit = Math.trunc(Number(creditAmount) || 0)
if (debit <= 0 || credit < 0) throw new TypeError('transferBetweenUsers requiere cantidades válidas')
for (const field of [debitField, creditField]) if (!(field in USER_COLUMNS) || !NUMERIC_FIELDS.has(field)) throw new Error(`Campo de economía no permitido: ${field}`)
this._createUser(senderId)
if (!this.userExists(targetId)) return null
const tx = this.sqlite.transaction(() => {
let debitStatement = this.statements.transferBetweenUsersDebit.get(debitField)
if (!debitStatement) {
debitStatement = this.sqlite.prepare(`UPDATE users SET ${q(debitField)} = COALESCE(${q(debitField)}, 0) - ?, updated_at = unixepoch() WHERE id = ? AND COALESCE(${q(debitField)}, 0) >= ?`)
this.statements.transferBetweenUsersDebit.set(debitField, debitStatement)
}
let creditStatement = this.statements.transferBetweenUsersCredit.get(creditField)
if (!creditStatement) {
creditStatement = this.sqlite.prepare(`UPDATE users SET ${q(creditField)} = COALESCE(${q(creditField)}, 0) + ?, updated_at = unixepoch() WHERE id = ?`)
this.statements.transferBetweenUsersCredit.set(creditField, creditStatement)
}
const debitResult = debitStatement.run(debit, senderId, debit)
if (!debitResult.changes) return null
creditStatement.run(credit, targetId)
const sender = this._rowToUser(this.statements.getUserById.get(senderId))
const target = this._rowToUser(this.statements.getUserById.get(targetId))
if (sender) this.userCache.set(senderId, sender)
if (target) this.userCache.set(targetId, target)
return { sender: this.getUser(senderId), target: this.getUser(targetId) }
})
return tx()
}
settleUserBet(id, { field = 'coin', bet, payout = 0 } = {}) {
const userId = normalizeJid(id)
if (!userId) throw new TypeError('settleUserBet requiere un id de usuario válido')
const safeBet = Math.trunc(Number(bet) || 0)
const safePayout = Math.trunc(Number(payout) || 0)
if (safeBet <= 0 || safePayout < 0) throw new TypeError('settleUserBet requiere cantidades válidas')
if (!(field in USER_COLUMNS) || !NUMERIC_FIELDS.has(field)) throw new Error(`Campo de economía no permitido: ${field}`)
this._createUser(userId)
const tx = this.sqlite.transaction(() => {
let statement = this.statements.settleUserBet.get(field)
if (!statement) {
statement = this.sqlite.prepare(`UPDATE users SET ${q(field)} = COALESCE(${q(field)}, 0) - ? + ?, updated_at = unixepoch() WHERE id = ?`)
this.statements.settleUserBet.set(field, statement)
}
const result = statement.run(safeBet, safePayout, userId)
if (!result.changes) return null
const user = this._rowToUser(this.statements.getUserById.get(userId))
if (user) this.userCache.set(userId, user)
return this.getUser(userId)
})
return tx()
}

addMoney(id, amount, field = 'coin') { return this.incrementUserField(id, field, amount) }
addEconomy(id, fieldOrAmount, maybeAmount) { return typeof fieldOrAmount === 'string' ? this.addMoney(id, maybeAmount, fieldOrAmount) : this.addMoney(id, fieldOrAmount, maybeAmount || 'coin') }
incrementUserField(id, field, delta) {
const userId = normalizeJid(id)
if (!userId) throw new TypeError('incrementUserField requiere un id de usuario válido')
const amount = Number(delta) || 0
if (!(field in USER_COLUMNS) || !NUMERIC_FIELDS.has(field)) return this.updateUser(userId, { [field]: (Number(this.getUser(userId)[field]) || 0) + amount })
this._createUser(userId)
let statement = this.statements.updateNumericUserField.get(field)
if (!statement) {
statement = this.sqlite.prepare(`UPDATE users SET ${q(field)} = COALESCE(${q(field)}, 0) + ?, updated_at = unixepoch() WHERE id = ?`)
this.statements.updateNumericUserField.set(field, statement)
}
statement.run(amount, userId)
const user = this._rowToUser(this.statements.getUserById.get(userId))
if (user) this.userCache.set(userId, user)
return this.getUser(userId)
}
setEconomy(id, field, value) { return this.updateUser(id, { [field]: value }) }

incrementUserActivityFast(id, { exp = 0, coin = 0, messages = 1 } = {}) {
const userId = normalizeJid(id)
if (!userId) throw new TypeError('incrementUserActivityFast requiere un id de usuario válido')
const safeExp = Number(exp) || 0
const safeCoin = Number(coin) || 0
const safeMessages = Math.trunc(Number(messages) || 0)
this.statements.insertUser.run(userId)
this.statements.addUserActivity.run(safeExp, safeCoin, safeMessages, userId)
const cached = this.userCache.get(userId)
if (cached) {
  const next = { ...cached }
  next.exp = (Number(next.exp) || 0) + safeExp
  next.coin = (Number(next.coin) || 0) + safeCoin
  next.msg_count = (Number(next.msg_count) || 0) + safeMessages
  next.updated_at = Math.floor(Date.now() / 1000)
  this.userCache.set(userId, next)
}
return this._userProxy(userId)
}

incrementUserActivity(id, { exp = 0, coin = 0, messages = 1 } = {}) {
const userId = normalizeJid(id)
if (!userId) throw new TypeError('incrementUserActivity requiere un id de usuario válido')
this.incrementUserActivityFast(userId, { exp, coin, messages })
const user = this._rowToUser(this.statements.getUserById.get(userId))
if (user) this.userCache.set(userId, user)
return this.getUser(userId)
}

topUsers({ field = 'coin', limit = 10, offset = 0 } = {}) {
const safeField = String(field || '').trim()
if (!(safeField in USER_COLUMNS) || !NUMERIC_FIELDS.has(safeField)) throw new Error(`Campo de ranking no permitido: ${safeField}`)
const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100)
const safeOffset = Math.max(Number(offset) || 0, 0)
let statement = this.statements.topUsers.get(safeField)
if (!statement) {
statement = this.sqlite.prepare(`SELECT id, exp, level, coin, bank, ${q(safeField)} AS ${q(safeField)} FROM users ORDER BY ${q(safeField)} DESC, id ASC LIMIT ? OFFSET ?`)
this.statements.topUsers.set(safeField, statement)
}
return statement.all(safeLimit, safeOffset)
}
getTopUsers(options = {}) { return this.topUsers(options) }
topUsersByIds(ids = [], { field = 'coin' } = {}) {
const safeField = String(field || '').trim()
if (!(safeField in USER_COLUMNS) || !NUMERIC_FIELDS.has(safeField)) throw new Error(`Campo de ranking no permitido: ${safeField}`)
const userIds = [...new Set((Array.isArray(ids) ? ids : []).map(normalizeJid).filter(Boolean))]
if (!userIds.length) return []
const rows = []
for (let index = 0; index < userIds.length; index += 999) {
const batch = userIds.slice(index, index + 999)
rows.push(...this.sqlite.prepare(`SELECT id, exp, level, coin, bank, ${q(safeField)} AS ${q(safeField)} FROM users WHERE id IN (${batch.map(() => '?').join(',')})`).all(...batch))
}
return rows.sort((a, b) => Number(b[safeField] || 0) - Number(a[safeField] || 0) || String(a.id).localeCompare(String(b.id)))
}
countUsers() { return Number(this.sqlite.prepare('SELECT COUNT(*) AS total FROM users').get()?.total) || 0 }
countRegisteredUsers() { return Number(this.sqlite.prepare('SELECT COUNT(*) AS total FROM users WHERE registered = 1').get()?.total) || 0 }
userRank(id, { field = 'level' } = {}) {
const userId = normalizeJid(id)
const safeField = String(field || '').trim()
if (!userId || !(safeField in USER_COLUMNS) || !NUMERIC_FIELDS.has(safeField)) return 0
const user = this.statements.getUserById.get(userId)
if (!user) return 0
let statement = this.statements.userRank.get(safeField)
if (!statement) {
statement = this.sqlite.prepare(`SELECT COUNT(*) + 1 AS rank FROM users WHERE ${q(safeField)} > ?`)
this.statements.userRank.set(safeField, statement)
}
return Number(statement.get(Number(user[safeField]) || 0)?.rank) || 0
}


_syncCharactersFtsFromJson() {
try { this.syncCharactersFts() } catch { }
}
syncCharactersFts(characters) {
let rows = characters
if (!Array.isArray(rows)) {
const file = findCharactersFile()
if (!file) return 0
const parsed = JSON.parse(readFileSync(file, 'utf8'))
rows = Array.isArray(parsed) ? parsed : Object.values(parsed || {})
}
const normalized = rows.map(normalizeCharacterRow).filter(row => row.id && row.name)
const tx = this.sqlite.transaction(list => {
this.sqlite.prepare('DELETE FROM characters_fts').run()
const st = this.sqlite.prepare('INSERT INTO characters_fts(id,name,anime,attributes) VALUES(@id,@name,@anime,@attributes)')
for (const row of list) st.run(row)
this.sqlite.prepare("INSERT INTO metadata(key,value) VALUES('characters_fts_synced_at', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(now()))
})
tx(normalized)
return normalized.length
}
searchCharacter(query, { limit = 10 } = {}) {
const match = buildFtsQuery(query)
if (!match) return []
const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50)
return this.sqlite.prepare(`SELECT id, name, anime, bm25(characters_fts, 8.0, 5.0, 2.0, 1.0) AS score FROM characters_fts WHERE characters_fts MATCH ? ORDER BY score ASC LIMIT ?`).all(match, safeLimit)
}

normalizeChatDefaults(chat = {}) {
if (typeof chat.welcome === 'undefined') chat.welcome = true
if (typeof chat.antiLink === 'undefined') chat.antiLink = true
if (typeof chat.antilink === 'undefined') chat.antilink = true
if (typeof chat.detect === 'undefined') chat.detect = true
if (!chat.botSettings || typeof chat.botSettings !== 'object' || Array.isArray(chat.botSettings)) chat.botSettings = {}
if (chat.isBanned === true) chat.isBanned = { '*': true }
else if (!chat.isBanned || typeof chat.isBanned !== 'object') chat.isBanned = {}
for (const [jid, banned] of Object.entries(chat.isBanned)) {
if (jid !== '*' && banned === true) {
chat.botSettings[jid] ||= {}
if (typeof chat.botSettings[jid].isBanned === 'undefined') chat.botSettings[jid].isBanned = true
}
}
chat.id ||= ''
return chat
}
getChat(id) { if (!id || typeof id !== 'string') throw new TypeError('getChat requiere un id de chat válido'); const row = this.sqlite.prepare('SELECT value FROM chats WHERE id=?').get(id); return this.normalizeChatDefaults({ id, ...parseJSON(row?.value, {}) }) }
updateChat(id, patch = {}) {
const args = { id: sanitizeSqliteArg(id), patch: sanitizeSqliteArg(patch, { json: true }) }
try {
const chat = this.normalizeChatDefaults({ ...this.getChat(id), ...(patch || {}) })
this.set('chats', id, chat)
return chat
} catch (error) {
console.error('[sqlite] no se pudo actualizar chat', { args, error })
return this.normalizeChatDefaults({ ...(patch || {}) })
}
}
getGroup(id) { const row = this.sqlite.prepare('SELECT metadata_json FROM groups WHERE id=?').get(id); return parseJSON(row?.metadata_json, {}) }
upsertGroupMetadata(id, metadata = {}) { if (!id || typeof id !== 'string') return null; const payload = { ...(metadata || {}), id }; const participants = Array.isArray(payload.participants) ? payload.participants : []; this.sqlite.prepare('INSERT INTO groups(id,subject,owner,participants_json,metadata_json,updated_at) VALUES(?,?,?,?,?,unixepoch()) ON CONFLICT(id) DO UPDATE SET subject=excluded.subject, owner=excluded.owner, participants_json=excluded.participants_json, metadata_json=excluded.metadata_json, updated_at=excluded.updated_at').run(id, String(payload.subject || ''), String(payload.owner || ''), stringify(participants), stringify(payload)); return payload }
listGroups() { return Object.fromEntries(this.sqlite.prepare('SELECT id,metadata_json FROM groups').all().map(r => [r.id, parseJSON(r.metadata_json, {})])) }

getMarriages(groupId = 'global') { return Object.fromEntries(this.sqlite.prepare('SELECT user_id,partner_id,married_at,data FROM marriages WHERE group_id=?').all(groupId).map(r => [r.user_id, { partner: r.partner_id, date: Number(r.married_at) || 0, data: parseJSON(r.data, {}) }])) }
replaceMarriages(values = {}, groupId = 'global') { const tx = this.sqlite.transaction(obj => { this.sqlite.prepare('DELETE FROM marriages WHERE group_id=?').run(groupId); const st = this.sqlite.prepare("INSERT OR REPLACE INTO marriages(group_id,user_id,partner_id,married_at,data) VALUES(?,?,?,?,COALESCE(?, '{}'))"); for (const [userId, value] of Object.entries(obj || {})) { const partner = typeof value === 'string' ? value : value?.partner; const date = typeof value === 'object' ? value?.date : 0; const data = typeof value === 'object' ? stringify(value?.data || {}) : '{}'; if (partner) st.run(groupId, userId, partner, Number(date) || now(), data) } }); tx(values) }
setMarriagePair(userId, partnerId, date = now(), groupId = 'global') { const st = this.sqlite.prepare("INSERT INTO marriages(group_id,user_id,partner_id,married_at,data) VALUES(?,?,?,?, '{}') ON CONFLICT(group_id,user_id) DO UPDATE SET partner_id=excluded.partner_id, married_at=excluded.married_at, data=COALESCE(marriages.data, '{}')"); const tx = this.sqlite.transaction(() => { st.run(groupId, userId, partnerId, Number(date) || now()); st.run(groupId, partnerId, userId, Number(date) || now()); this.updateUser(userId, { marry: partnerId }); this.updateUser(partnerId, { marry: userId }) }); tx(); return this.getMarriages(groupId) }
divorcePair(userId, groupId = 'global') { const current = this.getMarriages(groupId); const partnerId = current[userId]?.partner || ''; const tx = this.sqlite.transaction(() => { this.sqlite.prepare('DELETE FROM marriages WHERE group_id=? AND user_id IN (?,?)').run(groupId, userId, partnerId); this.updateUser(userId, { marry: '' }); if (partnerId) this.updateUser(partnerId, { marry: '' }) }); tx(); return partnerId }

getHarem() { return this.sqlite.prepare('SELECT * FROM harem').all().map(r => ({ groupId: r.group_id, characterId: r.character_id, userId: r.user_id, lastClaimTime: Number(r.last_claim_time) || 0, protection: parseJSON(r.protection_json, {}) })) }
replaceHarem(list = []) { const tx = this.sqlite.transaction(rows => { this.sqlite.prepare('DELETE FROM harem').run(); const st = this.sqlite.prepare('INSERT OR REPLACE INTO harem(group_id,character_id,user_id,last_claim_time,protection_json) VALUES(?,?,?,?,?)'); for (const e of rows) st.run(e.groupId, e.characterId, e.userId, Number(e.lastClaimTime) || now(), stringify(e.protection || {})) }); tx(list) }
upsertHaremClaim(e) { this.sqlite.prepare('INSERT INTO harem(group_id,character_id,user_id,last_claim_time,protection_json) VALUES(?,?,?,?,?) ON CONFLICT(group_id,character_id) DO UPDATE SET user_id=excluded.user_id,last_claim_time=excluded.last_claim_time,protection_json=excluded.protection_json').run(e.groupId, e.characterId, e.userId, Number(e.lastClaimTime) || now(), stringify(e.protection || {})) }
getGachaMarket(groupId = '') {
const sql = groupId ? 'SELECT * FROM gacha_market WHERE group_id=? ORDER BY id_sale ASC' : 'SELECT * FROM gacha_market ORDER BY id_sale ASC'
const rows = groupId ? this.sqlite.prepare(sql).all(groupId) : this.sqlite.prepare(sql).all()
return rows.map(r => ({ idSale: r.id_sale, id: r.character_id, characterId: r.character_id, vendedor: r.seller_jid, sellerJid: r.seller_jid, precio: Number(r.price) || 0, price: Number(r.price) || 0, groupId: r.group_id, fecha: Number(r.created_at) || 0, createdAt: Number(r.created_at) || 0 }))
}
replaceGachaMarket(list = []) {
const tx = this.sqlite.transaction(rows => {
this.sqlite.prepare('DELETE FROM gacha_market').run()
const st = this.sqlite.prepare('INSERT INTO gacha_market(seller_jid,character_id,price,group_id,created_at) VALUES(?,?,?,?,?) ON CONFLICT(group_id,character_id) DO UPDATE SET seller_jid=excluded.seller_jid,price=excluded.price,created_at=excluded.created_at')
for (const e of rows) st.run(String(e.vendedor || e.sellerJid || ''), String(e.id || e.characterId || ''), Math.max(0, Number(e.precio || e.price || 0)), String(e.groupId || e.group_id || 'global'), Number(e.fecha || e.createdAt || now()))
})
tx(list)
}
addGachaMarketSale(e) {
const payload = { seller: String(e.vendedor || e.sellerJid || ''), character: String(e.id || e.characterId || ''), price: Math.max(0, Number(e.precio || e.price || 0)), group: String(e.groupId || e.group_id || 'global'), created: Number(e.fecha || e.createdAt || now()) }
if (!payload.seller || !payload.character || !payload.group) return null
const result = this.sqlite.prepare('INSERT INTO gacha_market(seller_jid,character_id,price,group_id,created_at) VALUES(@seller,@character,@price,@group,@created) ON CONFLICT(group_id,character_id) DO UPDATE SET seller_jid=excluded.seller_jid,price=excluded.price,created_at=excluded.created_at RETURNING *').get(payload)
return { idSale: result.id_sale, id: result.character_id, characterId: result.character_id, vendedor: result.seller_jid, sellerJid: result.seller_jid, precio: Number(result.price) || 0, price: Number(result.price) || 0, groupId: result.group_id, fecha: Number(result.created_at) || 0, createdAt: Number(result.created_at) || 0 }
}
removeGachaMarketSale(groupId, characterId) {
const row = this.sqlite.prepare('SELECT * FROM gacha_market WHERE group_id=? AND character_id=?').get(groupId, String(characterId))
if (!row) return null
this.sqlite.prepare('DELETE FROM gacha_market WHERE id_sale=?').run(row.id_sale)
return { idSale: row.id_sale, id: row.character_id, characterId: row.character_id, vendedor: row.seller_jid, sellerJid: row.seller_jid, precio: Number(row.price) || 0, price: Number(row.price) || 0, groupId: row.group_id, fecha: Number(row.created_at) || 0, createdAt: Number(row.created_at) || 0 }
}
buyGachaMarketSale({ groupId, characterId, buyerId, sellerId, price, tax = 0 } = {}) {
const group = String(groupId || '')
const character = String(characterId || '')
const buyer = normalizeJid(buyerId)
const seller = normalizeJid(sellerId)
const safePrice = Math.trunc(Number(price) || 0)
const safeTax = Math.trunc(Number(tax) || 0)
const total = safePrice + safeTax
if (!group || !character || !buyer || !seller || buyer === seller) return null
if (safePrice <= 0 || safeTax < 0 || total <= 0) throw new TypeError('buyGachaMarketSale requiere cantidades válidas')
this._createUser(buyer)
this._createUser(seller)
const tx = this.sqlite.transaction(() => {
const sale = this.sqlite.prepare('SELECT * FROM gacha_market WHERE group_id=? AND character_id=? AND seller_jid=? AND price=?').get(group, character, seller, safePrice)
if (!sale) return null
const debit = this.sqlite.prepare('UPDATE users SET coin = COALESCE(coin, 0) - ?, updated_at = unixepoch() WHERE id = ? AND COALESCE(coin, 0) >= ?').run(total, buyer, total)
if (!debit.changes) return null
this.sqlite.prepare('UPDATE users SET coin = COALESCE(coin, 0) + ?, updated_at = unixepoch() WHERE id = ?').run(safePrice, seller)
this.sqlite.prepare('INSERT INTO harem(group_id,character_id,user_id,last_claim_time,protection_json) VALUES(?,?,?,?,?) ON CONFLICT(group_id,character_id) DO UPDATE SET user_id=excluded.user_id,last_claim_time=excluded.last_claim_time,protection_json=excluded.protection_json').run(group, character, buyer, now(), '{}')
this.sqlite.prepare('DELETE FROM gacha_market WHERE id_sale=?').run(sale.id_sale)
const buyerRow = this._rowToUser(this.statements.getUserById.get(buyer))
const sellerRow = this._rowToUser(this.statements.getUserById.get(seller))
if (buyerRow) this.userCache.set(buyer, buyerRow)
if (sellerRow) this.userCache.set(seller, sellerRow)
return { buyer: this.getUser(buyer), seller: this.getUser(seller), sale: { idSale: sale.id_sale, id: sale.character_id, characterId: sale.character_id, vendedor: sale.seller_jid, sellerJid: sale.seller_jid, precio: Number(sale.price) || 0, price: Number(sale.price) || 0, groupId: sale.group_id, fecha: Number(sale.created_at) || 0, createdAt: Number(sale.created_at) || 0 } }
})
return tx()
}
getSection(section) { if (section === 'sticker') return this.getStickerCommands(); if (section === 'users') return this.listUsers(); if (section === 'groups') return this.listGroups(); if (section === 'chats' || section === 'settings') { const out = {}; for (const r of this.sqlite.prepare(`SELECT id,value FROM ${section}`).all()) out[r.id] = parseJSON(r.value, {}); return out } if (section === 'marriages') return this.getMarriages(); if (section === 'harem') return Object.fromEntries(this.getHarem().map(e => [`${e.groupId}:${e.characterId}`, e])); if (section === 'waifus_venta' || section === 'gacha_market') return Object.fromEntries(this.getGachaMarket().map(e => [`${e.groupId}:${e.id}`, e])); if (section === 'claim_config') return Object.fromEntries(this.sqlite.prepare('SELECT user_id,message FROM claim_config').all().map(r => [r.user_id, r.message])); if (section === 'character_favorites') return Object.fromEntries(this.sqlite.prepare('SELECT user_id,character_id FROM character_favorites').all().map(r => [r.user_id, r.character_id])); const out = {}; for (const r of this.statements.allJson.all(section)) out[r.id] = parseJSON(r.value, {}); return out }
replaceSection(section, values = {}) { if (section === 'sticker') return this.replaceStickerCommands(values); if (section === 'marriages') return this.replaceMarriages(values); if (section === 'harem') return this.replaceHarem(Object.values(values)); if (section === 'waifus_venta' || section === 'gacha_market') return this.replaceGachaMarket(Object.values(values)); if (section === 'users') { const tx = this.sqlite.transaction(entries => { for (const [id, value] of entries) this.updateUser(id, value || {}) }); return tx(Object.entries(values || {})) } if (section === 'groups') { const tx = this.sqlite.transaction(entries => { this.sqlite.prepare('DELETE FROM groups').run(); for (const [id, value] of entries) this.upsertGroupMetadata(id, value || {}) }); return tx(Object.entries(values || {})) } if (section === 'chats' || section === 'settings') { const tx = this.sqlite.transaction(obj => { this.sqlite.prepare(`DELETE FROM ${section}`).run(); const st = this._jsonSectionUpsertStatement(section); for (const [id, val] of Object.entries(obj || {})) st.run(this._jsonSectionPayload(section, id, val)) }); return tx(values) } if (section === 'claim_config') { const tx = this.sqlite.transaction(obj => { this.sqlite.prepare('DELETE FROM claim_config').run(); const st = this.sqlite.prepare('INSERT INTO claim_config(user_id,message,updated_at) VALUES(?,?,?)'); for (const [k, v] of Object.entries(obj)) st.run(k, String(v), now()) }); return tx(values) } if (section === 'character_favorites') { const tx = this.sqlite.transaction(obj => { this.sqlite.prepare('DELETE FROM character_favorites').run(); const st = this.sqlite.prepare('INSERT INTO character_favorites(user_id,character_id,updated_at) VALUES(?,?,?)'); for (const [k, v] of Object.entries(obj)) st.run(k, String(v), now()) }); return tx(values) } const tx = this.sqlite.transaction(obj => { this.sqlite.prepare('DELETE FROM json_records WHERE section=?').run(section); for (const [id, val] of Object.entries(obj || {})) this.statements.upsertJson.run(section, id, stringify(val)) }); tx(values) }
_recordProxy(section, id, value) {
if (!id || value == null || typeof value !== 'object') return value
const cacheKey = `${section}:${id}`
const cached = this.recordProxyCache.get(cacheKey)
if (cached?.target === value) return cached.proxy
const persist = () => this.set(section, id, value)
const wrap = (target) => {
if (target == null || typeof target !== 'object') return target
return new Proxy(target, {
get: (obj, prop) => {
if (INTERNAL_PROPS.has(prop)) return undefined
if (prop === 'toJSON') return () => obj
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
let value = this.getRecord(section, id)
if (typeof value === 'undefined' && ['chats', 'settings', 'stats', 'msgs', 'sessions', 'codes'].includes(section)) {
value = section === 'chats' ? this.normalizeChatDefaults({}) : {}
this.set(section, id, value)
}
return this._recordProxy(section, id, value)
}

setTemporaryState(scope, key, value = {}, ttlMs = 60 * 60 * 1000) {
const safeScope = String(scope || '').trim()
const safeKey = String(key || '').trim()
if (!safeScope || !safeKey) throw new TypeError('setTemporaryState requiere scope y key válidos')
const expireAt = Date.now() + Math.max(Number(ttlMs) || 0, 1000)
this.sqlite.prepare('INSERT INTO temporary_states(scope,key,value,expire_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(scope,key) DO UPDATE SET value=excluded.value, expire_at=excluded.expire_at, updated_at=excluded.updated_at').run(safeScope, safeKey, stringify(value), expireAt, now())
return { scope: safeScope, key: safeKey, value, expireAt }
}
getTemporaryState(scope, key) {
const row = this.sqlite.prepare('SELECT value, expire_at FROM temporary_states WHERE scope=? AND key=?').get(String(scope || ''), String(key || ''))
if (!row) return undefined
if (Number(row.expire_at) <= Date.now()) { this.deleteTemporaryState(scope, key); return undefined }
return parseJSON(row.value, undefined)
}
deleteTemporaryState(scope, key) { return this.sqlite.prepare('DELETE FROM temporary_states WHERE scope=? AND key=?').run(String(scope || ''), String(key || '')) }
setTimelockCooldown(jid, value = {}, ttlMs = 24 * 60 * 60 * 1000) {
const safeJid = String(jid || '').trim()
if (!safeJid) throw new TypeError('setTimelockCooldown requiere un jid válido')
const expiresAt = Date.now() + Math.max(Number(ttlMs) || 0, 1000)
this.sqlite.prepare('INSERT INTO timelock_cooldown(jid,expires_at,value,updated_at) VALUES(?,?,?,?) ON CONFLICT(jid) DO UPDATE SET expires_at=excluded.expires_at, value=excluded.value, updated_at=excluded.updated_at').run(safeJid, expiresAt, stringify(value), now())
return { jid: safeJid, value, expiresAt }
}
getTimelockCooldown(jid) {
const safeJid = String(jid || '').trim()
const row = this.sqlite.prepare('SELECT value, expires_at FROM timelock_cooldown WHERE jid=?').get(safeJid)
if (!row) return undefined
if (Number(row.expires_at) <= Date.now()) { this.deleteTimelockCooldown(safeJid); return undefined }
return parseJSON(row.value, undefined)
}
deleteTimelockCooldown(jid) { return this.sqlite.prepare('DELETE FROM timelock_cooldown WHERE jid=?').run(String(jid || '')) }
cleanupExpiredTemporaryStates() {
const cutoff = Date.now()
this.sqlite.prepare('DELETE FROM timelock_cooldown WHERE expires_at <= ?').run(cutoff)
return this.sqlite.prepare('DELETE FROM temporary_states WHERE expire_at <= ?').run(cutoff)
}

getRecord(section, id) { if (section === 'users') return this.getUser(id); if (section === 'sticker') return this.getStickerCommand(id); if (section === 'groups') return this.getGroup(id); if (section === 'claim_config') return this.sqlite.prepare('SELECT message FROM claim_config WHERE user_id=?').get(id)?.message; if (section === 'character_favorites') return this.sqlite.prepare('SELECT character_id FROM character_favorites WHERE user_id=?').get(id)?.character_id; if (section === 'chats') return this.getChat(id); if (section === 'settings') { const row = this.sqlite.prepare('SELECT value FROM settings WHERE id=?').get(id); return parseJSON(row?.value, undefined) } const row = this.statements.getJson.get(section, id); return parseJSON(row?.value, undefined) }
setRecord(section, id, value) { return this.set(section, id, value) }
countSection(section, filter = {}) { if (section === 'users') return this.sqlite.prepare('SELECT COUNT(*) AS total FROM users').get().total; if (section === 'chats' || section === 'settings') return this.sqlite.prepare(`SELECT COUNT(*) AS total FROM ${section}`).get().total; if (section === 'groups') return this.sqlite.prepare('SELECT COUNT(*) AS total FROM groups').get().total; if (section === 'claim_config') return this.sqlite.prepare('SELECT COUNT(*) AS total FROM claim_config').get().total; if (section === 'character_favorites') return this.sqlite.prepare('SELECT COUNT(*) AS total FROM character_favorites').get().total; return this.sqlite.prepare('SELECT COUNT(*) AS total FROM json_records WHERE section=?').get(section).total }
set(section, id, value) {
const safeSection = sanitizeSqliteArg(section)
const safeId = sanitizeSqliteArg(id)
const safeTextValue = sanitizeSqliteArg(value == null ? '' : String(value))
const safeJsonValue = sanitizeSqliteArg(value, { json: true })
try {
if (section === 'sticker') return this.setStickerCommand(safeId, value)
if (section === 'users') return this.updateUser(safeId, value)
if (section === 'groups') return this.upsertGroupMetadata(safeId, value)
if (section === 'claim_config') return this.sqlite.prepare('INSERT INTO claim_config(user_id,message,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET message=excluded.message, updated_at=excluded.updated_at').run(safeId, safeTextValue, sanitizeSqliteArg(now()))
if (section === 'character_favorites') return this.sqlite.prepare('INSERT INTO character_favorites(user_id,character_id,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET character_id=excluded.character_id, updated_at=excluded.updated_at').run(safeId, safeTextValue, sanitizeSqliteArg(now()))
if (section === 'chats' || section === 'settings') {
const payload = this._jsonSectionPayload(section, safeId, value)
const columns = Object.keys(payload)
const placeholders = columns.map(() => '?').join(',')
const updates = columns.filter(column => column !== 'id').map(column => `${column}=excluded.${column}`)
const sql = `INSERT INTO ${section}(${columns.join(',')}) VALUES(${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates.join(', ')}`
return this.sqlite.prepare(sql).run(...Object.values(payload).map(arg => sanitizeSqliteArg(arg)))
}
return this.statements.upsertJson.run(safeSection, safeId, safeJsonValue)
} catch (error) {
console.error('[sqlite] no se pudo guardar registro', { args: { section: safeSection, id: safeId, value: safeJsonValue }, error })
return undefined
}
}
has(section, id) { if (section === 'users') return this.userExists(id); return this.get(section, id) !== undefined }
delete(section, id) { if (section === 'sticker') return this.sqlite.prepare('DELETE FROM sticker_cmds WHERE hash=?').run(id); if (section === 'claim_config') return this.sqlite.prepare('DELETE FROM claim_config WHERE user_id=?').run(id); if (section === 'character_favorites') return this.sqlite.prepare('DELETE FROM character_favorites WHERE user_id=?').run(id); if (section === 'chats' || section === 'settings' || section === 'groups') { const table = section === 'groups' ? 'groups' : section; return this.sqlite.prepare(`DELETE FROM ${table} WHERE id=?`).run(id) } if (section === 'users') { for (const [cachedId, cachedUser] of this.userCache.entries()) if (cachedUser?.marry === id) { cachedUser.marry = ''; this.userCache.set(cachedId, cachedUser) } this.userCache.delete(id); this.userProxyCache.delete(id); this.dirtyUsers.delete(id); const tx = this.sqlite.transaction(userId => { this.sqlite.prepare('DELETE FROM marriages WHERE user_id=? OR partner_id=?').run(userId, userId); this.sqlite.prepare("UPDATE users SET marry='' WHERE marry=?").run(userId); this.sqlite.prepare("UPDATE harem SET user_id='', protection_json='{}' WHERE user_id=?").run(userId); return this.sqlite.prepare('DELETE FROM users WHERE id=?').run(userId) }); return tx(id) } this.sqlite.prepare('DELETE FROM json_records WHERE section=? AND id=?').run(section, id) }
_createDataFacade() { return { users: this._sectionFacade('users'), chats: this._sectionFacade('chats'), settings: this._sectionFacade('settings'), stats: this._sectionFacade('stats'), msgs: this._sectionFacade('msgs'), sticker: this._sectionFacade('sticker'), sessions: this._sectionFacade('sessions'), codes: this._sectionFacade('codes') } }
_sectionFacade(section) { return new Proxy({}, { get: (_target, id) => { if (INTERNAL_PROPS.has(id)) return undefined; if (id === 'toJSON') return () => this.getSection(section); if (typeof id !== 'string') return undefined; return this.get(section, id) }, set: (_target, id, value) => { if (typeof id !== 'string') return false; this.recordProxyCache.delete(`${section}:${id}`); this.set(section, id, value); return true }, deleteProperty: (_target, id) => { if (typeof id !== 'string') return false; this.recordProxyCache.delete(`${section}:${id}`); this.delete(section, id); return true }, ownKeys: () => Object.keys(this.getSection(section)), getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }) }) }
async read() { return this.data }
async write() { if (this.flushTimerHandle) { clearTimeout(this.flushTimerHandle); this.flushTimerHandle = null; this.flushScheduled = false }; this.flush() }
async save() { await this.write() }
flush() {
const ids = [...this.dirtyUsers]
if (ids.length) {
const tx = this.sqlite.transaction(rows => { for (const [id, user] of rows) this._writeUserRow(id, user) })
tx(ids.map(id => [id, this.userCache.get(id)]).filter(([, user]) => user))
for (const id of ids) this.dirtyUsers.delete(id)
}
}
forceSave() { return this.write() }
close() { if (this.flushTimerHandle) clearTimeout(this.flushTimerHandle); this.flush(); if (this.flushTimer) clearInterval(this.flushTimer); if (this.tempCleanupTimer) clearInterval(this.tempCleanupTimer); if (this.userCacheGcTimer) clearInterval(this.userCacheGcTimer); this.sqlite.pragma('wal_checkpoint(PASSIVE)'); this.sqlite.close() } snapshot() { return { users: this.getSection('users'), marriages: this.getSection('marriages'), harem: this.getSection('harem'), gacha_market: this.getSection('gacha_market'), claim_config: this.getSection('claim_config'), character_favorites: this.getSection('character_favorites') } }
}
export { SQLiteDatabase as DbManager }
export default SQLiteDatabase
