import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const USER_COLUMNS = {
  id: { type: 'TEXT', defaultSql: null, primary: true },
  coin: { type: 'INTEGER', defaultSql: '0' }, bank: { type: 'INTEGER', defaultSql: '0' }, exp: { type: 'INTEGER', defaultSql: '0' }, level: { type: 'INTEGER', defaultSql: '0' },
  role: { type: 'TEXT', defaultSql: "''" }, limit: { type: 'INTEGER', defaultSql: '0' }, health: { type: 'INTEGER', defaultSql: '100' }, warn: { type: 'INTEGER', defaultSql: '0' },
  name: { type: 'TEXT', defaultSql: "''" }, customName: { type: 'TEXT', defaultSql: "''" }, registered: { type: 'INTEGER', defaultSql: '0' }, age: { type: 'INTEGER', defaultSql: '0' }, regTime: { type: 'INTEGER', defaultSql: '0' },
  birth: { type: 'TEXT', defaultSql: "''" }, genre: { type: 'TEXT', defaultSql: "''" }, description: { type: 'TEXT', defaultSql: "''" },
  premium: { type: 'INTEGER', defaultSql: '0' }, premiumTime: { type: 'INTEGER', defaultSql: '0' }, banned: { type: 'INTEGER', defaultSql: '0' }, bannedReason: { type: 'TEXT', defaultSql: "''" }, antispam: { type: 'INTEGER', defaultSql: '0' }, muto: { type: 'INTEGER', defaultSql: '0' }, mutoChat: { type: 'TEXT', defaultSql: "''" }, lastBanMsg: { type: 'INTEGER', defaultSql: '0' },
  job: { type: 'TEXT', defaultSql: "''" }, jobSince: { type: 'INTEGER', defaultSql: '0' }, jobXp: { type: 'INTEGER', defaultSql: '0' }, commands: { type: 'INTEGER', defaultSql: '0' },
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
function sqlDefault(name) { return USER_COLUMNS[name]?.defaultSql ?? "''" }
function jsDefault(name) { const raw = sqlDefault(name); if (raw === "''") return ''; if (raw === "'{}'") return {}; if (/^\(?unixepoch\(\)\)?$/.test(raw)) return 0; return Number(raw) || 0 }
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
    this.sqlite.pragma('journal_mode = WAL')
    this.sqlite.pragma('synchronous = NORMAL')
    this.sqlite.pragma('busy_timeout = 10000')
    this.sqlite.pragma('foreign_keys = ON')
    this.userProxyCache = new Map()
    this._prepareSchema()
    this._prepareStatements()
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
CREATE INDEX IF NOT EXISTS idx_harem_user ON harem(group_id, user_id);
CREATE TABLE IF NOT EXISTS marriages (group_id TEXT NOT NULL DEFAULT 'global', user_id TEXT NOT NULL, partner_id TEXT NOT NULL DEFAULT '', married_at INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(group_id, user_id));
CREATE TABLE IF NOT EXISTS character_favorites (user_id TEXT PRIMARY KEY, character_id TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS claim_config (user_id TEXT PRIMARY KEY, message TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS waifus_venta (group_id TEXT NOT NULL, character_id TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', precio INTEGER NOT NULL DEFAULT 0, vendedor TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT 0, extra_json TEXT NOT NULL DEFAULT '{}', PRIMARY KEY(group_id, character_id));
CREATE TABLE IF NOT EXISTS json_records (section TEXT NOT NULL, id TEXT NOT NULL, value TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL DEFAULT (unixepoch()), PRIMARY KEY(section,id));
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO metadata(key,value) VALUES('schema_version','4-relational-users-expanded') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
`)
    this._migrateUserColumns()
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
  _prepareStatements() {
    this.statements = {
      getJson: this.sqlite.prepare('SELECT value FROM json_records WHERE section=? AND id=?'),
      allJson: this.sqlite.prepare('SELECT id,value FROM json_records WHERE section=?'),
      upsertJson: this.sqlite.prepare('INSERT INTO json_records(section,id,value,updated_at) VALUES(?,?,?,unixepoch()) ON CONFLICT(section,id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at')
    }
  }

  _rowToUser(row) {
    if (!row) return undefined
    const user = {}
    for (const name of Object.keys(USER_COLUMNS)) if (name !== 'updated_at') user[name] = publicValue(name, row[name])
    return user
  }
  _rawUser(id) { return this._rowToUser(this.sqlite.prepare('SELECT * FROM users WHERE id=?').get(id)) }
  _createUser(id) { this.sqlite.prepare('INSERT OR IGNORE INTO users(id) VALUES(?)').run(id); return this._rawUser(id) }
  getUser(id) { if (!id || typeof id !== 'string') throw new TypeError('getUser requiere un id de usuario válido'); if (!this._rawUser(id)) this._createUser(id); return this._userProxy(id) }
  _userProxy(id) {
    if (this.userProxyCache.has(id)) return this.userProxyCache.get(id)
    const proxy = new Proxy({}, {
      get: (_target, prop) => {
        if (INTERNAL_PROPS.has(prop)) return undefined
        if (prop === 'toJSON') return () => this._rawUser(id)
        if (typeof prop !== 'string') return undefined
        const user = this._rawUser(id) || this._createUser(id)
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
      ownKeys: () => Object.keys(this._rawUser(id) || this._createUser(id)),
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true })
    })
    this.userProxyCache.set(id, proxy)
    return proxy
  }
  updateUser(id, patch = {}) {
    const current = this._rawUser(id) || this._createUser(id)
    const known = {}
    const extras = { ...(current.extras || {}) }
    for (const [key, value] of Object.entries(patch || {})) {
      if (key in USER_COLUMNS && key !== 'id' && key !== 'updated_at') known[key] = normalizeValue(key, value)
      else extras[key] = value instanceof Date ? value.getTime() : value
    }
    known.extras = stringify(extras)
    if (!Object.keys(known).length) return this.getUser(id)
    const assignments = Object.keys(known).map(key => `${q(key)} = @${key}`).join(', ')
    this.sqlite.prepare(`UPDATE users SET ${assignments}, updated_at = unixepoch() WHERE id = @id`).run({ id, ...known })
    return this.getUser(id)
  }
  addMoney(id, amount, field = 'coin') { return this.incrementUserField(id, field, amount) }
  addEconomy(id, fieldOrAmount, maybeAmount) { return typeof fieldOrAmount === 'string' ? this.addMoney(id, maybeAmount, fieldOrAmount) : this.addMoney(id, fieldOrAmount, maybeAmount || 'coin') }
  incrementUserField(id, field, delta) {
    if (!(field in USER_COLUMNS) || !NUMERIC_FIELDS.has(field)) return this.updateUser(id, { [field]: (Number(this.getUser(id)[field]) || 0) + (Number(delta) || 0) })
    this._createUser(id)
    this.sqlite.prepare(`UPDATE users SET ${q(field)} = COALESCE(${q(field)}, ${sqlDefault(field)}) + ?, updated_at=unixepoch() WHERE id=?`).run(Number(delta) || 0, id)
    return this.getUser(id)
  }
  setEconomy(id, field, value) { return this.updateUser(id, { [field]: value }) }

  getHarem() { return this.sqlite.prepare('SELECT * FROM harem').all().map(r => ({ groupId: r.group_id, characterId: r.character_id, userId: r.user_id, lastClaimTime: Number(r.last_claim_time) || 0, protection: parseJSON(r.protection_json, {}) })) }
  replaceHarem(list = []) { const tx = this.sqlite.transaction(rows => { this.sqlite.prepare('DELETE FROM harem').run(); const st = this.sqlite.prepare('INSERT OR REPLACE INTO harem(group_id,character_id,user_id,last_claim_time,protection_json) VALUES(?,?,?,?,?)'); for (const e of rows) st.run(e.groupId, e.characterId, e.userId, Number(e.lastClaimTime) || now(), stringify(e.protection || {})) }); tx(list) }
  upsertHaremClaim(e) { this.sqlite.prepare('INSERT INTO harem(group_id,character_id,user_id,last_claim_time,protection_json) VALUES(?,?,?,?,?) ON CONFLICT(group_id,character_id) DO UPDATE SET user_id=excluded.user_id,last_claim_time=excluded.last_claim_time,protection_json=excluded.protection_json').run(e.groupId, e.characterId, e.userId, Number(e.lastClaimTime) || now(), stringify(e.protection || {})) }
  getSection(section) { if (section === 'users') { const out = {}; for (const row of this.sqlite.prepare('SELECT id FROM users').all()) out[row.id] = this.getUser(row.id); return out } if (section === 'harem') return Object.fromEntries(this.getHarem().map(e => [`${e.groupId}:${e.characterId}`, e])); if (section === 'claim_config') return Object.fromEntries(this.sqlite.prepare('SELECT user_id,message FROM claim_config').all().map(r => [r.user_id, r.message])); if (section === 'character_favorites') return Object.fromEntries(this.sqlite.prepare('SELECT user_id,character_id FROM character_favorites').all().map(r => [r.user_id, r.character_id])); const out = {}; for (const r of this.statements.allJson.all(section)) out[r.id] = parseJSON(r.value, {}); return out }
  replaceSection(section, values = {}) { if (section === 'harem') return this.replaceHarem(Object.values(values)); if (section === 'users') { const tx = this.sqlite.transaction(entries => { for (const [id, value] of entries) this.updateUser(id, value || {}) }); return tx(Object.entries(values || {})) } if (section === 'claim_config') { const tx = this.sqlite.transaction(obj => { this.sqlite.prepare('DELETE FROM claim_config').run(); const st = this.sqlite.prepare('INSERT INTO claim_config(user_id,message,updated_at) VALUES(?,?,?)'); for (const [k, v] of Object.entries(obj)) st.run(k, String(v), now()) }); return tx(values) } if (section === 'character_favorites') { const tx = this.sqlite.transaction(obj => { this.sqlite.prepare('DELETE FROM character_favorites').run(); const st = this.sqlite.prepare('INSERT INTO character_favorites(user_id,character_id,updated_at) VALUES(?,?,?)'); for (const [k, v] of Object.entries(obj)) st.run(k, String(v), now()) }); return tx(values) } const tx = this.sqlite.transaction(obj => { this.sqlite.prepare('DELETE FROM json_records WHERE section=?').run(section); for (const [id, val] of Object.entries(obj || {})) this.statements.upsertJson.run(section, id, stringify(val)) }); tx(values) }
  get(section, id) { if (section === 'users') return this.getUser(id); return this.getSection(section)[id] }
  set(section, id, value) { if (section === 'users') return this.updateUser(id, value); this.statements.upsertJson.run(section, id, stringify(value)) }
  has(section, id) { return this.get(section, id) !== undefined }
  delete(section, id) { if (section === 'users') { this.userProxyCache.delete(id); return this.sqlite.prepare('DELETE FROM users WHERE id=?').run(id) } this.sqlite.prepare('DELETE FROM json_records WHERE section=? AND id=?').run(section, id) }
  _createDataFacade() { return { users: this._sectionFacade('users'), chats: this._sectionFacade('chats'), settings: this._sectionFacade('settings'), stats: this._sectionFacade('stats'), msgs: this._sectionFacade('msgs'), sticker: this._sectionFacade('sticker'), sessions: this._sectionFacade('sessions'), codes: this._sectionFacade('codes') } }
  _sectionFacade(section) { return new Proxy({}, { get: (_target, id) => { if (INTERNAL_PROPS.has(id)) return undefined; if (id === 'toJSON') return () => this.getSection(section); if (typeof id !== 'string') return undefined; return this.get(section, id) }, set: (_target, id, value) => { if (typeof id !== 'string') return false; this.set(section, id, value); return true }, deleteProperty: (_target, id) => { if (typeof id !== 'string') return false; this.delete(section, id); return true }, ownKeys: () => Object.keys(this.getSection(section)), getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }) }) }
  async read() { return this.data } async write() {} flush() {} close() { this.sqlite.close() } snapshot() { return { users: this.getSection('users'), harem: this.getSection('harem'), claim_config: this.getSection('claim_config'), character_favorites: this.getSection('character_favorites') } }
}
export default SQLiteDatabase
