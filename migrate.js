#!/usr/bin/env node
import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

const jsonPath = process.argv[2] || './src/database/database.json'
const sqlitePath = process.argv[3] || './src/database/database.sqlite'
const sections = ['users', 'chats', 'settings', 'stats', 'msgs', 'sticker', 'sessions']

function table(name) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error(`Tabla inválida: ${name}`)
  return name
}

if (!existsSync(jsonPath)) throw new Error(`No existe el archivo JSON: ${jsonPath}`)
const dir = path.dirname(sqlitePath)
if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true })
if (existsSync(sqlitePath)) copyFileSync(sqlitePath, `${sqlitePath}.bak-${Date.now()}`)

const raw = readFileSync(jsonPath, 'utf8')
const data = raw.trim() ? JSON.parse(raw) : {}
const db = new Database(sqlitePath)
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('busy_timeout = 5000')

const migrate = db.transaction(() => {
  for (const section of sections) {
    db.prepare(`CREATE TABLE IF NOT EXISTS ${table(section)} (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run()
    const upsert = db.prepare(`INSERT INTO ${table(section)} (id, data, updated_at) VALUES (?, ?, unixepoch()) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`)
    for (const [id, value] of Object.entries(data[section] || {})) upsert.run(id, JSON.stringify(value ?? {}))
  }
})

migrate()
db.close()
console.log(`Migración completada: ${jsonPath} -> ${sqlitePath}`)
