import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const USER_COLUMNS = {
id: { type: 'TEXT', defaultSql: null, primary: true },
coin: { type: 'INTEGER', defaultSql: '0' }, bank: { type: 'INTEGER', defaultSql: '0' }, exp: { type: 'INTEGER', defaultSql: '0' }, level: { type: 'INTEGER', defaultSql: '0' },
role: { type: 'TEXT', defaultSql: "''" }, limit: { type: 'INTEGER', defaultSql: '0' }, health: { type: 'INTEGER', defaultSql: '100' }, warn: { type: 'INTEGER', defaultSql: '0' },
name: { type: 'TEXT', defaultSql: "''" }, customName: { type: 'TEXT', defaultSql: "''" }, registered: { type: 'INTEGER', defaultSql: '1' }, age: { type: 'INTEGER', defaultSql: '-1' }, regTime: { type: 'INTEGER', defaultSql: '-1' },
birth: { type: 'TEXT', defaultSql: "''" }, genre: { type: 'TEXT', defaultSql: "''" }, description: { type: 'TEXT', defaultSql: "''" },
premium: { type: 'INTEGER', defaultSql: '0' }, premiumTime: { type: 'INTEGER', defaultSql: '0' }, banned: { type: 'INTEGER', defaultSql: '0' }, bannedReason: { type: 'TEXT', defaultSql: "''" }, antispam: { type: 'INTEGER', defaultSql: '0' }, muto: { type: 'INTEGER', defaultSql: '0' }, mutoChat: { type: 'TEXT', defaultSql: "''" }, lastBanMsg: { type: 'INTEGER', defaultSql: '0' },
job: { type: 'TEXT', defaultSql: "'Ninguno'" }, jobSince: { type: 'INTEGER', defaultSql: '0' }, jobXp: { type: 'INTEGER', defaultSql: '0' }, commands: { type: 'INTEGER', defaultSql: '0' },
lastclaim: { type: 'INTEGER', defaultSql: '0' }, lastmonthly: { type: 'INTEGER', defaultSql: '0' }, monthly: { type: 'INTEGER', defaultSql: '0' }, weekly: { type: 'INTEGER', defaultSql: '0' }, dailyStreak: { type: 'INTEGER', defaultSql: '0' }, lastwork: { type: 'INTEGER', defaultSql: '0' }, lastAdventure: { type: 'INTEGER', defaultSql: '0' }, lastmining: { type: 'INTEGER', defaultSql: '0' }, lastmiming: { type: 'INTEGER', defaultSql: '0' }, lastrob: { type: 'INTEGER', defaultSql: '0' }, lastrob2: { type: 'INTEGER', defaultSql: '0' }, lastHeal: { type: 'INTEGER', defaultSql: '0' }, halloween: { type: 'INTEGER', defaultSql: '0' }, christmas: { type: 'INTEGER', defaultSql: '0' },
diamond: { type: 'INTEGER', defaultSql: '0' }, diamonds: { type: 'INTEGER', defaultSql: '0' }, emerald: { type: 'INTEGER', defaultSql: '0' }, iron: { type: 'INTEGER', defaultSql: '0' }, gold: { type: 'INTEGER', defaultSql: '0' }, coal: { type: 'INTEGER', defaultSql: '0' }, stone: { type: 'INTEGER', defaultSql: '0' }, candies: { type: 'INTEGER', defaultSql: '0' }, gifts: { type: 'INTEGER', defaultSql: '0' }, joincount: { type: 'INTEGER', defaultSql: '0' }, pickaxedurability: { type: 'INTEGER', defaultSql: '100' },
marry: { type: 'TEXT', defaultSql: "''" }, extras: { type: 'TEXT', defaultSql: "'{}'" }, updated_at: { type: 'INTEGER', defaultSql: '(unixepoch())' }
}
const BOOLEAN_FIELDS = new Set(['registered', 'premium', 'banned', 'muto'])
const NUMERIC_FIELDS = new Set(Object.entries(USER_COLUMNS).filter(([, c]) => c.type === 'INTEGER').map(([name]) => name))
const INTERNAL_PROPS = new Set(['then', 'inspect', 'toJSON', 'valueOf', Symbol.toStringTag, Symbol.iterator])

function ensureDir(filename) { const dir = path.dirname(filename); if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true }) }
function now() { return Date.now() }
function q(name) { return `"${String(name).replace(/"/g, '""')}"` }
function parseJSON(value, fallback = {}) { if (value == null || value === '') return fallback; try { return JSON.parse(value) } catch { return fallback } }
function stringify(value) { return JSON.stringify(value ?? {}) }
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

export class SQLiteDatabase {
constructor(filename = './src/database/database.sqlite') {
this.filename = filename
ensureDir(filename)
this.sqlite = new Database(filename)
this.sqlite.pragma('synchronous = NORMAL')
this.sqlite.pragma('journal_mode = WAL')
this.sqlite.pragma('temp_store = MEMORY')
this.sqlite.pragma('mmap_size = 3000000000')
this.sqlite.pragma('busy_timeout = 10000')
this.sqlite.pragma('foreign_keys = ON')
this.userCache = new Map()
this.userProxyCache = new Map()
this.dirtyUsers = new Set()
this.flushIntervalMs = 15000
this.flushTimer = setInterval(() => this.flush(), this.flushIntervalMs)
this.flushTimer.unref?.()
this._prepareSchema()
this._prepareStatements()
this._bindPublicApi()
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
CREATE TABLE IF NOT EXISTS marriages (group_id TEXT NOT NULL DEFAULT 'global', user_id TEXT NOT NULL, partner_id TEXT NOT NULL DEFAULT '', married_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(group_id, user_id));
CREATE TABLE IF NOT EXISTS character_favorites (user_id TEXT PRIMARY KEY, character_id TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS claim_config (user_id TEXT PRIMARY KEY, message TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS waifus_venta (group_id TEXT NOT NULL, character_id TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', precio INTEGER NOT NULL DEFAULT 0, vendedor TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT 0, extra_json TEXT NOT NULL DEFAULT '{}', PRIMARY KEY(group_id, character_id));
CREATE TABLE IF NOT EXISTS gacha_market (id_sale INTEGER PRIMARY KEY AUTOINCREMENT, seller_jid TEXT NOT NULL, character_id TEXT NOT NULL, price INTEGER NOT NULL DEFAULT 0, group_id TEXT NOT NULL DEFAULT 'global', created_at INTEGER NOT NULL DEFAULT 0);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gacha_market_group_character ON gacha_market(group_id, character_id);
CREATE TABLE IF NOT EXISTS json_records (section TEXT NOT NULL, id TEXT NOT NULL, value TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL DEFAULT (unixepoch()), PRIMARY KEY(section,id));
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
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
this._migrateRelationalTables()
this.sqlite.prepare("INSERT INTO gacha_market(seller_jid,character_id,price,group_id,created_at) SELECT vendedor,character_id,precio,group_id,created_at FROM waifus_venta WHERE vendedor<>'' AND character_id<>'' ON CONFLICT(group_id,character_id) DO NOTHING").run()
try {
this.sqlite.prepare('CREATE INDEX IF NOT EXISTS idx_harem_user ON harem(group_id, user_id)').run()
} catch {
}
}
_migrateUserColumns() {
const existing = new Set(this.sqlite.prepare('PRAGMA table_info(users)').all().map(col => col.name))
for (const [name, spec] of Object.entries(USER_COLUMNS)) {
if (existing.has(name)) continue
if (spec.primary) continue
this.sqlite.prepare(`ALTER TABLE users ADD COLUMN ${this._userColumnSql(name, spec, { forAlter: true })}`).run()
}
this.sqlite.prepare(`UPDATE users SET ${Object.entries(USER_COLUMNS).filter(([name, spec]) => !spec.primary && spec.defaultSql !== null).map(([name]) => `${q(name)} = COALESCE(${q(name)}, ${sqlDefault(name)})`).join(', ')}`).run()
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
upsertJson: this.sqlite.prepare('INSERT INTO json_records(section,id,value,updated_at) VALUES(?,?,?,unixepoch()) ON CONFLICT(section,id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at')
}
}


_bindPublicApi() {
for (const name of ['getUser', 'updateUser', 'userExists', 'getChat', 'updateChat', 'listUsers', 'listUserRows', 'addMoney', 'addEconomy', 'setEconomy', 'incrementUserField', 'getSection', 'replaceSection', 'setMarriagePair', 'divorcePair', 'getMarriages', 'replaceMarriages', 'getHarem', 'replaceHarem', 'upsertHaremClaim', 'getGachaMarket', 'replaceGachaMarket', 'addGachaMarketSale', 'removeGachaMarketSale', 'get', 'set', 'has', 'delete', 'read', 'write', 'flush', 'close', 'snapshot']) {
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
_rawUser(id) { return this.userCache.get(id) || this._rowToUser(this.sqlite.prepare('SELECT * FROM users WHERE id=?').get(id)) }
_createUser(id) { this.sqlite.prepare('INSERT OR IGNORE INTO users(id) VALUES(?)').run(id); const user = this._rowToUser(this.sqlite.prepare('SELECT * FROM users WHERE id=?').get(id)); if (user) this.userCache.set(id, user); return user }
userExists(id) { return Boolean(id && typeof id === 'string' && (this.userCache.has(id) || this.sqlite.prepare('SELECT 1 FROM users WHERE id=?').get(id))) }
listUserRows() { return this.sqlite.prepare('SELECT * FROM users').all().map(row => { const user = this._rowToUser(row); if (user) this.userCache.set(user.id, user); return user }) }
listUsers() { const out = {}; for (const user of this.listUserRows()) out[user.id] = this.getUser(user.id); return out }
getUser(id) { if (!id || typeof id !== 'string') throw new TypeError('getUser requiere un id de usuario válido'); if (!this.userCache.has(id)) { const row = this._rowToUser(this.sqlite.prepare('SELECT * FROM users WHERE id=?').get(id)) || this._createUser(id); if (row) this.userCache.set(id, row) } return this.userCache.has(id) ? this._userProxy(id) : {} }
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
_markUserDirty(id) { if (id && typeof id === 'string') this.dirtyUsers.add(id) }
_writeUserRow(id, user) {
const values = {}
for (const key of Object.keys(USER_COLUMNS)) if (key !== 'id' && key !== 'updated_at') values[key] = normalizeValue(key, user?.[key])
values.extras = stringify(user?.extras || {})
const assignments = Object.keys(values).map(key => `${q(key)} = @${key}`).join(', ')
this.sqlite.prepare(`UPDATE users SET ${assignments}, updated_at = unixepoch() WHERE id = @id`).run({ id, ...values })
}
updateUser(id, patch = {}) {
if (!id || typeof id !== 'string') throw new TypeError('updateUser requiere un id de usuario válido')
const current = this._hydrateUser(this.userCache.get(id) || this._rawUser(id) || this._createUser(id) || { id, extras: {} })
const next = this._hydrateUser({ ...current, extras: { ...(current?.extras || {}) } })
const safePatch = patch || {}
const patchExtras = safePatch.extras || {}
for (const [key, value] of Object.entries(safePatch)) {
if (key === 'id' || key === 'updated_at') continue
if (key === 'extras') next.extras = { ...next.extras, ...(typeof patchExtras === 'object' && patchExtras !== null ? patchExtras : {}) }
else if (key in USER_COLUMNS) next[key] = publicValue(key, normalizeValue(key, value))
else next.extras[key] = value instanceof Date ? value.getTime() : value
}
this.userCache.set(id, next)
this._markUserDirty(id)
return this.getUser(id)
}
addMoney(id, amount, field = 'coin') { return this.incrementUserField(id, field, amount) }
addEconomy(id, fieldOrAmount, maybeAmount) { return typeof fieldOrAmount === 'string' ? this.addMoney(id, maybeAmount, fieldOrAmount) : this.addMoney(id, fieldOrAmount, maybeAmount || 'coin') }
incrementUserField(id, field, delta) {
if (!(field in USER_COLUMNS) || !NUMERIC_FIELDS.has(field)) return this.updateUser(id, { [field]: (Number(this.getUser(id)[field]) || 0) + (Number(delta) || 0) })
if (!this.userCache.has(id)) this._createUser(id)
const user = this.userCache.get(id) || this._rawUser(id) || this._createUser(id)
user[field] = (Number(user[field]) || 0) + (Number(delta) || 0)
this.userCache.set(id, user)
this._markUserDirty(id)
return this.getUser(id)
}
setEconomy(id, field, value) { return this.updateUser(id, { [field]: value }) }

getChat(id) { if (!id || typeof id !== 'string') throw new TypeError('getChat requiere un id de chat válido'); const chats = this.getSection('chats'); const chat = chats[id] || {}; if (chat.isBanned === true) chat.isBanned = { '*': true }; else if (!chat.isBanned || typeof chat.isBanned !== 'object') chat.isBanned = {}; chat.bannedBots = Array.isArray(chat.bannedBots) ? chat.bannedBots : Object.entries(chat.isBanned).filter(([, value]) => value === true).map(([jid]) => jid); if (!chats[id]) this.set('chats', id, chat); return chat }
updateChat(id, patch = {}) { const chat = { ...this.getChat(id), ...(patch || {}) }; if (chat.isBanned === true) chat.isBanned = { '*': true }; else if (!chat.isBanned || typeof chat.isBanned !== 'object') chat.isBanned = {}; chat.bannedBots = Array.isArray(chat.bannedBots) ? chat.bannedBots : Object.entries(chat.isBanned).filter(([, value]) => value === true).map(([jid]) => jid); this.set('chats', id, chat); return chat }

getMarriages(groupId = 'global') { return Object.fromEntries(this.sqlite.prepare('SELECT user_id,partner_id,married_at FROM marriages WHERE group_id=?').all(groupId).map(r => [r.user_id, { partner: r.partner_id, date: Number(r.married_at) || 0 }])) }
replaceMarriages(values = {}, groupId = 'global') { const tx = this.sqlite.transaction(obj => { this.sqlite.prepare('DELETE FROM marriages WHERE group_id=?').run(groupId); const st = this.sqlite.prepare('INSERT OR REPLACE INTO marriages(group_id,user_id,partner_id,married_at) VALUES(?,?,?,?)'); for (const [userId, value] of Object.entries(obj || {})) { const partner = typeof value === 'string' ? value : value?.partner; const date = typeof value === 'object' ? value?.date : 0; if (partner) st.run(groupId, userId, partner, Number(date) || now()) } }); tx(values) }
setMarriagePair(userId, partnerId, date = now(), groupId = 'global') { const st = this.sqlite.prepare('INSERT OR REPLACE INTO marriages(group_id,user_id,partner_id,married_at) VALUES(?,?,?,?)'); const tx = this.sqlite.transaction(() => { st.run(groupId, userId, partnerId, Number(date) || now()); st.run(groupId, partnerId, userId, Number(date) || now()); this.updateUser(userId, { marry: partnerId }); this.updateUser(partnerId, { marry: userId }) }); tx(); return this.getMarriages(groupId) }
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
getSection(section) { if (section === 'users') return this.listUsers(); if (section === 'marriages') return this.getMarriages(); if (section === 'harem') return Object.fromEntries(this.getHarem().map(e => [`${e.groupId}:${e.characterId}`, e])); if (section === 'waifus_venta' || section === 'gacha_market') return Object.fromEntries(this.getGachaMarket().map(e => [`${e.groupId}:${e.id}`, e])); if (section === 'claim_config') return Object.fromEntries(this.sqlite.prepare('SELECT user_id,message FROM claim_config').all().map(r => [r.user_id, r.message])); if (section === 'character_favorites') return Object.fromEntries(this.sqlite.prepare('SELECT user_id,character_id FROM character_favorites').all().map(r => [r.user_id, r.character_id])); const out = {}; for (const r of this.statements.allJson.all(section)) out[r.id] = parseJSON(r.value, {}); return out }
replaceSection(section, values = {}) { if (section === 'marriages') return this.replaceMarriages(values); if (section === 'harem') return this.replaceHarem(Object.values(values)); if (section === 'waifus_venta' || section === 'gacha_market') return this.replaceGachaMarket(Object.values(values)); if (section === 'users') { const tx = this.sqlite.transaction(entries => { for (const [id, value] of entries) this.updateUser(id, value || {}) }); return tx(Object.entries(values || {})) } if (section === 'claim_config') { const tx = this.sqlite.transaction(obj => { this.sqlite.prepare('DELETE FROM claim_config').run(); const st = this.sqlite.prepare('INSERT INTO claim_config(user_id,message,updated_at) VALUES(?,?,?)'); for (const [k, v] of Object.entries(obj)) st.run(k, String(v), now()) }); return tx(values) } if (section === 'character_favorites') { const tx = this.sqlite.transaction(obj => { this.sqlite.prepare('DELETE FROM character_favorites').run(); const st = this.sqlite.prepare('INSERT INTO character_favorites(user_id,character_id,updated_at) VALUES(?,?,?)'); for (const [k, v] of Object.entries(obj)) st.run(k, String(v), now()) }); return tx(values) } const tx = this.sqlite.transaction(obj => { this.sqlite.prepare('DELETE FROM json_records WHERE section=?').run(section); for (const [id, val] of Object.entries(obj || {})) this.statements.upsertJson.run(section, id, stringify(val)) }); tx(values) }
get(section, id) { if (section === 'users') return this.getUser(id); return this.getSection(section)[id] }
set(section, id, value) { if (section === 'users') return this.updateUser(id, value); this.statements.upsertJson.run(section, id, stringify(value)) }
has(section, id) { if (section === 'users') return this.userExists(id); return this.get(section, id) !== undefined }
delete(section, id) { if (section === 'users') { for (const [cachedId, cachedUser] of this.userCache.entries()) if (cachedUser?.marry === id) { cachedUser.marry = ''; this.userCache.set(cachedId, cachedUser) } this.userCache.delete(id); this.userProxyCache.delete(id); this.dirtyUsers.delete(id); const tx = this.sqlite.transaction(userId => { this.sqlite.prepare('DELETE FROM marriages WHERE user_id=? OR partner_id=?').run(userId, userId); this.sqlite.prepare("UPDATE users SET marry='' WHERE marry=?").run(userId); this.sqlite.prepare("UPDATE harem SET user_id='', protection_json='{}' WHERE user_id=?").run(userId); return this.sqlite.prepare('DELETE FROM users WHERE id=?').run(userId) }); return tx(id) } this.sqlite.prepare('DELETE FROM json_records WHERE section=? AND id=?').run(section, id) }
_createDataFacade() { return { users: this._sectionFacade('users'), chats: this._sectionFacade('chats'), settings: this._sectionFacade('settings'), stats: this._sectionFacade('stats'), msgs: this._sectionFacade('msgs'), sticker: this._sectionFacade('sticker'), sessions: this._sectionFacade('sessions'), codes: this._sectionFacade('codes') } }
_sectionFacade(section) { return new Proxy({}, { get: (_target, id) => { if (INTERNAL_PROPS.has(id)) return undefined; if (id === 'toJSON') return () => this.getSection(section); if (typeof id !== 'string') return undefined; return this.get(section, id) }, set: (_target, id, value) => { if (typeof id !== 'string') return false; this.set(section, id, value); return true }, deleteProperty: (_target, id) => { if (typeof id !== 'string') return false; this.delete(section, id); return true }, ownKeys: () => Object.keys(this.getSection(section)), getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }) }) }
async read() { return this.data }
async write() { this.flush() }
flush() {
const ids = [...this.dirtyUsers]
if (ids.length) {
const tx = this.sqlite.transaction(rows => { for (const [id, user] of rows) this._writeUserRow(id, user) })
tx(ids.map(id => [id, this.userCache.get(id)]).filter(([, user]) => user))
for (const id of ids) this.dirtyUsers.delete(id)
}
this.sqlite.pragma('wal_checkpoint(TRUNCATE)')
}
close() { this.flush(); if (this.flushTimer) clearInterval(this.flushTimer); this.sqlite.close() } snapshot() { return { users: this.getSection('users'), marriages: this.getSection('marriages'), harem: this.getSection('harem'), gacha_market: this.getSection('gacha_market'), claim_config: this.getSection('claim_config'), character_favorites: this.getSection('character_favorites') } }
}
export { SQLiteDatabase as DbManager }
export default SQLiteDatabase
