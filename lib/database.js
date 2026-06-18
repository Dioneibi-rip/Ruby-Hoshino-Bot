import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const RETRYABLE_SQLITE_CODES = new Set(['SQLITE_BUSY', 'SQLITE_LOCKED'])
const JSON_TABLES = ['users', 'chats', 'settings', 'stats', 'msgs', 'sticker', 'sessions', 'codes', 'gacha']

export const userDefault = Object.freeze({
  name: '', customName: '', registered: false, age: -1, regTime: -1, serialNumber: '',
  exp: 0, level: 0, role: 'Novato', coin: 0, money: 0, bank: 0, limit: 15, joincount: 1,
  premium: false, premiumTime: 0, banned: false, warn: 0, Subs: 0, wait: 0, marry: '',
})

export const chatDefault = Object.freeze({
  isBanned: false, welcome: false, detect: false, modoadmin: false, antiPrivate: false,
  antiSpam: false, reaction: false, nsfw: false, restrict: false, antiToxic: false,
  primaryBot: '', users: {}, customEmoji: '',
})

export const settingsDefault = Object.freeze({
  self: false, autoread: false, restrict: true, antiPrivate: false, antiGroup: false,
  antiSpam: true, jadibotmd: true, moneda: 'Coins', disabledCommands: [],
})

function clone(value) {
  if (value == null || typeof value !== 'object') return value
  return JSON.parse(JSON.stringify(value))
}

function mergeDefaults(defaults, value) {
  return { ...clone(defaults), ...(value && typeof value === 'object' ? value : {}) }
}

function safeJsonParse(payload, fallback = {}) {
  if (payload == null || payload === '') return clone(fallback)
  try {
    const parsed = JSON.parse(payload)
    return parsed && typeof parsed === 'object' ? parsed : clone(fallback)
  } catch {
    return clone(fallback)
  }
}

function safeTableName(table) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) throw new Error(`Nombre de tabla inválido: ${table}`)
  return table
}

export class DbManager {
  constructor(filename = './src/database/database.sqlite', options = {}) {
    this.filename = filename
    this.maxWriteRetries = options.maxWriteRetries ?? 5
    const dir = path.dirname(filename)
    if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true })

    this.sqlite = new Database(filename)
    this.sqlite.pragma('journal_mode = WAL')
    this.sqlite.pragma('synchronous = NORMAL')
    this.sqlite.pragma('busy_timeout = 10000')
    this.sqlite.pragma('foreign_keys = ON')
    this.prepareSchema()
    this.prepareStatements()
  }

  prepareSchema() {
    this.runWithRetry(() => {
      const tx = this.sqlite.transaction(() => {
        const haremColumns = this.sqlite.prepare("SELECT name FROM pragma_table_info('harem')").all().map((row) => row.name)
        if (haremColumns.length && !haremColumns.includes('group_id')) {
          this.sqlite.prepare('ALTER TABLE harem RENAME TO harem_legacy').run()
        }
        for (const table of JSON_TABLES) {
          const name = safeTableName(table)
          this.sqlite.prepare(`CREATE TABLE IF NOT EXISTS ${name} (id TEXT PRIMARY KEY, data TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run()
        }
        this.sqlite.prepare(`CREATE TABLE IF NOT EXISTS economia (jid TEXT PRIMARY KEY, coin INTEGER NOT NULL DEFAULT 0, money INTEGER NOT NULL DEFAULT 0, bank INTEGER NOT NULL DEFAULT 0, exp INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run()
        this.sqlite.prepare(`CREATE TABLE IF NOT EXISTS harem (group_id TEXT NOT NULL DEFAULT '', owner_jid TEXT NOT NULL, character_id TEXT NOT NULL, data TEXT NOT NULL DEFAULT '{}', obtained_at INTEGER NOT NULL DEFAULT (unixepoch()), PRIMARY KEY (group_id, character_id))`).run()
        this.sqlite.prepare(`CREATE TABLE IF NOT EXISTS gacha_locks (lock_key TEXT PRIMARY KEY, owner_jid TEXT NOT NULL, expires_at INTEGER NOT NULL)`).run()
        this.sqlite.prepare('CREATE INDEX IF NOT EXISTS idx_harem_owner ON harem(owner_jid)').run()
        this.sqlite.prepare('CREATE INDEX IF NOT EXISTS idx_harem_group ON harem(group_id)').run()
        this.sqlite.prepare('CREATE INDEX IF NOT EXISTS idx_gacha_locks_expires ON gacha_locks(expires_at)').run()
        const legacyColumns = this.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='harem_legacy'").get()
        if (legacyColumns) {
          this.sqlite.prepare("INSERT OR IGNORE INTO harem (group_id, owner_jid, character_id, data, obtained_at) SELECT '', owner_jid, character_id, data, obtained_at FROM harem_legacy").run()
          this.sqlite.prepare('DROP TABLE harem_legacy').run()
        }
      })
      tx()
    })
  }

  prepareStatements() {
    this.kv = new Map(JSON_TABLES.map((table) => [table, {
      get: this.sqlite.prepare(`SELECT data FROM ${safeTableName(table)} WHERE id = ?`),
      all: this.sqlite.prepare(`SELECT id, data FROM ${safeTableName(table)}`),
      upsert: this.sqlite.prepare(`INSERT INTO ${safeTableName(table)} (id, data, updated_at) VALUES (?, ?, unixepoch()) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`),
      patch: this.sqlite.prepare(`UPDATE ${safeTableName(table)} SET data = json_patch(data, ?), updated_at = unixepoch() WHERE id = ?`),
      delete: this.sqlite.prepare(`DELETE FROM ${safeTableName(table)} WHERE id = ?`),
    }]))
    this.economy = {
      get: this.sqlite.prepare('SELECT coin, money, bank, exp FROM economia WHERE jid = ?'),
      upsert: this.sqlite.prepare('INSERT INTO economia (jid, coin, money, bank, exp, updated_at) VALUES (@jid, @coin, @money, @bank, @exp, unixepoch()) ON CONFLICT(jid) DO UPDATE SET coin=@coin, money=@money, bank=@bank, exp=@exp, updated_at=unixepoch()'),
      add: this.sqlite.prepare('INSERT INTO economia (jid, coin, money, bank, exp, updated_at) VALUES (@jid, @coin, @money, @bank, @exp, unixepoch()) ON CONFLICT(jid) DO UPDATE SET coin=coin+@coin, money=money+@money, bank=bank+@bank, exp=exp+@exp, updated_at=unixepoch()'),
    }
    this.harem = {
      getByOwner: this.sqlite.prepare('SELECT group_id, character_id, data, obtained_at FROM harem WHERE owner_jid = ? ORDER BY obtained_at DESC'),
      getByGroup: this.sqlite.prepare('SELECT group_id, owner_jid, character_id, data, obtained_at FROM harem WHERE group_id = ? ORDER BY obtained_at DESC'),
      findClaim: this.sqlite.prepare('SELECT group_id, owner_jid, character_id, data, obtained_at FROM harem WHERE group_id = ? AND character_id = ?'),
      upsert: this.sqlite.prepare('INSERT INTO harem (group_id, owner_jid, character_id, data, obtained_at) VALUES (?, ?, ?, ?, unixepoch()) ON CONFLICT(group_id, character_id) DO UPDATE SET owner_jid=excluded.owner_jid, data=excluded.data, obtained_at=excluded.obtained_at'),
      delete: this.sqlite.prepare('DELETE FROM harem WHERE group_id = ? AND character_id = ?'),
    }
    this.locks = {
      cleanup: this.sqlite.prepare('DELETE FROM gacha_locks WHERE expires_at <= ?'),
      insert: this.sqlite.prepare('INSERT INTO gacha_locks (lock_key, owner_jid, expires_at) VALUES (?, ?, ?)'),
      delete: this.sqlite.prepare('DELETE FROM gacha_locks WHERE lock_key = ? AND owner_jid = ?'),
    }
  }

  runWithRetry(operation) {
    let lastError
    for (let attempt = 0; attempt <= this.maxWriteRetries; attempt++) {
      try { return operation() } catch (error) {
        lastError = error
        if (!RETRYABLE_SQLITE_CODES.has(error?.code) || attempt === this.maxWriteRetries) throw error
      }
    }
    throw lastError
  }

  getRecord(table, id, defaults = {}) { return mergeDefaults(defaults, safeJsonParse(this.kv.get(table).get.get(id)?.data, defaults)) }
  updateRecord(table, id, data = {}) { const current = this.getRecord(table, id); const next = { ...current, ...clone(data) }; this.kv.get(table).upsert.run(id, JSON.stringify(next)); return next }
  setRecord(table, id, data = {}) { this.kv.get(table).upsert.run(id, JSON.stringify(clone(data) || {})); return data }
  deleteRecord(table, id) { return this.kv.get(table).delete.run(id) }
  listRecords(table, defaults = {}) { return Object.fromEntries(this.kv.get(table).all.all().map((r) => [r.id, mergeDefaults(defaults, safeJsonParse(r.data, defaults))])) }

  getUser(jid) { return { ...this.getRecord('users', jid, userDefault), ...this.getEconomy(jid) } }
  updateUser(jid, data = {}) {
    const { coin, money, bank, exp, ...profile } = data
    const next = this.updateRecord('users', jid, profile)
    if ([coin, money, bank, exp].some((v) => v !== undefined)) this.setEconomy(jid, { ...this.getEconomy(jid), coin, money, bank, exp })
    return { ...next, ...this.getEconomy(jid) }
  }
  getChat(jid) { return this.getRecord('chats', jid, chatDefault) }
  updateChat(jid, data = {}) { return this.updateRecord('chats', jid, data) }
  getSettings(jid) { return this.getRecord('settings', jid, settingsDefault) }
  updateSettings(jid, data = {}) { return this.updateRecord('settings', jid, data) }

  getEconomy(jid) { return this.economy.get.get(jid) || { coin: 0, money: 0, bank: 0, exp: 0 } }
  setEconomy(jid, data = {}) {
    const clean = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))
    const row = { jid, ...this.getEconomy(jid), ...clean }
    this.economy.upsert.run(row)
    return this.getEconomy(jid)
  }
  addMoney(jid, amount = 0) { return this.addEconomy(jid, { coin: amount, money: amount }) }
  addEconomy(jid, delta = {}) { this.economy.add.run({ jid, coin: delta.coin || 0, money: delta.money || 0, bank: delta.bank || 0, exp: delta.exp || 0 }); return this.getEconomy(jid) }

  getHarem(ownerJid) { return this.harem.getByOwner.all(ownerJid).map((r) => ({ groupId: r.group_id, userId: ownerJid, characterId: r.character_id, ...safeJsonParse(r.data), obtainedAt: r.obtained_at })) }
  getGroupHarem(groupId) { return this.harem.getByGroup.all(groupId).map((r) => ({ groupId: r.group_id, userId: r.owner_jid, characterId: r.character_id, ...safeJsonParse(r.data), obtainedAt: r.obtained_at })) }
  findHaremClaim(groupId, characterId) {
    const row = this.harem.findClaim.get(groupId, String(characterId))
    return row ? { groupId: row.group_id, userId: row.owner_jid, characterId: row.character_id, ...safeJsonParse(row.data), obtainedAt: row.obtained_at } : null
  }
  addHarem(ownerJid, characterId, data = {}) { return this.upsertHaremClaim(data.groupId || '', ownerJid, characterId, data) }
  upsertHaremClaim(groupId, ownerJid, characterId, data = {}) {
    this.harem.upsert.run(groupId || '', ownerJid, String(characterId), JSON.stringify({ ...data, groupId: groupId || '', userId: ownerJid, characterId: String(characterId), lastClaimTime: data.lastClaimTime || Date.now() }))
    return this.findHaremClaim(groupId || '', characterId)
  }
  removeHarem(groupId, characterId) { return this.harem.delete.run(groupId || '', String(characterId)) }
  getGacha(id) { return this.getRecord('gacha', id) }
  updateGacha(id, data = {}) { return this.updateRecord('gacha', id, data) }
  withGachaLock(lockKey, ownerJid, ttlMs, fn) {
    const now = Date.now(); const expires = now + ttlMs
    this.runWithRetry(() => this.sqlite.transaction(() => { this.locks.cleanup.run(now); this.locks.insert.run(lockKey, ownerJid, expires) })())
    let result
    try {
      result = fn()
    } catch (error) {
      this.locks.delete.run(lockKey, ownerJid)
      throw error
    }
    if (result && typeof result.then === 'function') {
      return result.finally(() => this.locks.delete.run(lockKey, ownerJid))
    }
    this.locks.delete.run(lockKey, ownerJid)
    return result
  }

  async read() { return null }
  async write() { return undefined }
  close() { this.sqlite.close() }
}

export const createDbManager = (filename, options) => new DbManager(filename, options)
export const SQLiteDatabase = DbManager
export default DbManager
