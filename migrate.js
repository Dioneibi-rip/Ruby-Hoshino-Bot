#!/usr/bin/env node
import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

const jsonPath = process.argv[2] || './src/database/database.json'
const sqlitePath = process.argv[3] || './src/database/database.sqlite'
const databaseDir = path.dirname(jsonPath)
const jsonTables = ['users', 'chats', 'settings', 'stats', 'msgs', 'sticker', 'sessions', 'codes', 'gacha']
const economyFields = ['coin', 'money', 'bank', 'exp']

function table(name) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error(`Tabla inválida: ${name}`)
  return name
}

function readJson(filePath, fallback) {
  if (!existsSync(filePath)) return fallback
  const raw = readFileSync(filePath, 'utf8').trim()
  if (!raw) return fallback
  return JSON.parse(raw)
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function json(value) {
  return JSON.stringify(value ?? {})
}

function createSchema(db) {
  const haremColumns = db.prepare("SELECT name FROM pragma_table_info('harem')").all().map((row) => row.name)
  if (haremColumns.length && !haremColumns.includes('group_id')) db.prepare('ALTER TABLE harem RENAME TO harem_legacy').run()
  for (const section of jsonTables) {
    db.prepare(`CREATE TABLE IF NOT EXISTS ${table(section)} (id TEXT PRIMARY KEY, data TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run()
  }
  db.prepare(`CREATE TABLE IF NOT EXISTS economia (jid TEXT PRIMARY KEY, coin INTEGER NOT NULL DEFAULT 0, money INTEGER NOT NULL DEFAULT 0, bank INTEGER NOT NULL DEFAULT 0, exp INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run()
  db.prepare(`CREATE TABLE IF NOT EXISTS harem (group_id TEXT NOT NULL DEFAULT '', owner_jid TEXT NOT NULL, character_id TEXT NOT NULL, data TEXT NOT NULL DEFAULT '{}', obtained_at INTEGER NOT NULL DEFAULT (unixepoch()), PRIMARY KEY (group_id, character_id))`).run()
  db.prepare(`CREATE TABLE IF NOT EXISTS gacha_locks (lock_key TEXT PRIMARY KEY, owner_jid TEXT NOT NULL, expires_at INTEGER NOT NULL)`).run()
  db.prepare('CREATE INDEX IF NOT EXISTS idx_harem_owner ON harem(owner_jid)').run()
  db.prepare('CREATE INDEX IF NOT EXISTS idx_harem_group ON harem(group_id)').run()
  db.prepare('CREATE INDEX IF NOT EXISTS idx_gacha_locks_expires ON gacha_locks(expires_at)').run()
  if (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='harem_legacy'").get()) {
    db.prepare("INSERT OR IGNORE INTO harem (group_id, owner_jid, character_id, data, obtained_at) SELECT '', owner_jid, character_id, data, obtained_at FROM harem_legacy").run()
    db.prepare('DROP TABLE harem_legacy').run()
  }
}

function migrateMainJson(db, data) {
  const counters = {}
  for (const section of jsonTables) {
    const source = asObject(data[section])
    const upsert = db.prepare(`INSERT INTO ${table(section)} (id, data, updated_at) VALUES (?, ?, unixepoch()) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`)
    let count = 0
    for (const [id, value] of Object.entries(source)) {
      if (section === 'users') {
        const profile = { ...asObject(value) }
        for (const field of economyFields) delete profile[field]
        upsert.run(id, json(profile))
      } else {
        upsert.run(id, json(value))
      }
      count++
    }
    counters[section] = count
    console.log(`[migrate] ${section}: ${count} registros`)
  }
  return counters
}

function migrateEconomy(db, users = {}) {
  const upsert = db.prepare('INSERT INTO economia (jid, coin, money, bank, exp, updated_at) VALUES (@jid, @coin, @money, @bank, @exp, unixepoch()) ON CONFLICT(jid) DO UPDATE SET coin=@coin, money=@money, bank=@bank, exp=@exp, updated_at=unixepoch()')
  let count = 0
  for (const [jid, value] of Object.entries(asObject(users))) {
    const user = asObject(value)
    upsert.run({
      jid,
      coin: Number(user.coin || user.money || 0) || 0,
      money: Number(user.money || user.coin || 0) || 0,
      bank: Number(user.bank || 0) || 0,
      exp: Number(user.exp || 0) || 0,
    })
    count++
  }
  console.log(`[migrate] economia: ${count} usuarios`)
  return count
}

function migrateCharacters(db) {
  const candidates = ['characters.json', 'charactersfav.json', 'waifusVenta.json', 'userClaimConfig.json']
  const upsert = db.prepare('INSERT INTO gacha (id, data, updated_at) VALUES (?, ?, unixepoch()) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at')
  let count = 0
  for (const file of candidates) {
    const payload = readJson(path.join(databaseDir, file), null)
    if (payload == null) continue
    upsert.run(file.replace(/\.json$/i, ''), json(payload))
    count++
  }
  console.log(`[migrate] gacha: ${count} datasets externos`)
  return count
}

function migrateHarem(db) {
  const harem = readJson(path.join(databaseDir, 'harem.json'), [])
  const upsert = db.prepare('INSERT INTO harem (group_id, owner_jid, character_id, data, obtained_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(group_id, character_id) DO UPDATE SET owner_jid=excluded.owner_jid, data=excluded.data, obtained_at=excluded.obtained_at')
  let count = 0
  for (const entry of Array.isArray(harem) ? harem : []) {
    const groupId = String(entry?.groupId || '').trim()
    const ownerJid = String(entry?.userId || entry?.ownerJid || '').trim()
    const characterId = String(entry?.characterId || entry?.id || '').trim()
    if (!groupId || !ownerJid || !characterId) continue
    upsert.run(groupId, ownerJid, characterId, json(entry), Math.floor(Number(entry.lastClaimTime || Date.now()) / 1000))
    count++
  }
  console.log(`[migrate] harem: ${count} claims`)
  return count
}

if (!existsSync(jsonPath)) throw new Error(`No existe el archivo JSON: ${jsonPath}`)
const dir = path.dirname(sqlitePath)
if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true })
if (existsSync(sqlitePath)) {
  const backupPath = `${sqlitePath}.bak-${Date.now()}`
  copyFileSync(sqlitePath, backupPath)
  console.log(`[migrate] Backup creado: ${backupPath}`)
}

const data = readJson(jsonPath, {})
const db = new Database(sqlitePath)
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('busy_timeout = 10000')
db.pragma('foreign_keys = ON')

const migrate = db.transaction(() => {
  createSchema(db)
  migrateMainJson(db, data)
  migrateEconomy(db, data.users)
  migrateHarem(db)
  migrateCharacters(db)
})

console.log(`[migrate] Iniciando migración: ${jsonPath} -> ${sqlitePath}`)
migrate()
db.close()
console.log('[migrate] Migración completada correctamente')
