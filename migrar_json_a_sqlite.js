#!/usr/bin/env node
import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'fs'
import path from 'path'
import { serialize } from 'v8'
import Database from 'better-sqlite3'

const sqlitePath = process.argv[2] || './src/database/database.sqlite'
const sources = [
  ['./src/database/database.json', { users: 'users', chats: 'chats', settings: 'settings', stats: 'stats', msgs: 'msgs', sticker: 'sticker', sessions: 'sessions', codes: 'codes' }],
  ['./src/database/owners.json', 'owners'],
  ['./src/database/casados.json', 'marriages'],
  ['./src/database/characters.json', 'characters'],
  ['./src/database/charactersfav.json', 'character_favorites'],
  ['./src/database/harem.json', 'harem'],
  ['./src/database/groupVotes.json', 'group_votes'],
  ['./src/database/userClaimConfig.json', 'claim_config'],
  ['./src/database/waifusVenta.json', 'waifus_venta'],
  ['./src/database/db.json', 'fake_links'],
]

function readJson(file) {
  if (!existsSync(file)) return undefined
  const raw = readFileSync(file, 'utf8').trim()
  return raw ? JSON.parse(raw) : {}
}
function entriesFrom(value) {
  if (Array.isArray(value)) return value.map((item, index) => [String(item?.id ?? item?.name ?? index), item])
  if (value && typeof value === 'object') return Object.entries(value)
  return [['value', value]]
}

const dir = path.dirname(sqlitePath)
if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true })
if (existsSync(sqlitePath)) copyFileSync(sqlitePath, `${sqlitePath}.bak-${Date.now()}`)
const db = new Database(sqlitePath)
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('busy_timeout = 10000')
db.prepare(`CREATE TABLE IF NOT EXISTS records (section TEXT NOT NULL, id TEXT NOT NULL, value BLOB NOT NULL, updated_at INTEGER NOT NULL DEFAULT (unixepoch()), PRIMARY KEY (section, id))`).run()
db.prepare('CREATE INDEX IF NOT EXISTS idx_records_section ON records(section)').run()
db.prepare(`CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)`).run()
db.prepare(`INSERT INTO metadata (key, value) VALUES ('schema_version', '2') ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run()
const upsert = db.prepare('INSERT INTO records (section, id, value, updated_at) VALUES (?, ?, ?, unixepoch()) ON CONFLICT(section, id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
let total = 0
const migrate = db.transaction(() => {
  for (const [file, mapping] of sources) {
    const data = readJson(file)
    if (typeof data === 'undefined') continue
    if (typeof mapping === 'string') {
      for (const [id, value] of entriesFrom(data)) { upsert.run(mapping, id, serialize(value ?? {})); total++ }
      continue
    }
    for (const [sourceKey, section] of Object.entries(mapping)) {
      for (const [id, value] of entriesFrom(data[sourceKey] || {})) { upsert.run(section, id, serialize(value ?? {})); total++ }
    }
  }
})
migrate()
db.close()
console.log(`Migración completada hacia ${sqlitePath}. Registros insertados/actualizados: ${total}`)
