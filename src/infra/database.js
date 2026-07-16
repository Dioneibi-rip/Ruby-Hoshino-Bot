import { createRequire } from 'module'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const DEFAULT_SQLITE_FILE = './src/database/database.sqlite'
const DEFAULT_BAILEYS_SQLITE_FILE = './src/database/baileys-store.sqlite'

async function loadSQLiteDatabase() {
  const module = await import('./sqlite-database.js')
  return module.SQLiteDatabase || module.default
}

function loadBetterSQLite() {
  return createRequire(import.meta.url)('better-sqlite3')
}

export function applySQLiteProductionPragmas(sqlite) {
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('synchronous = NORMAL')
  sqlite.pragma('busy_timeout = 5000')
  sqlite.pragma('temp_store = MEMORY')
  sqlite.pragma('cache_size = -20000')
  sqlite.pragma('foreign_keys = ON')
  return sqlite
}

export function createBaileysSQLite(filename = DEFAULT_BAILEYS_SQLITE_FILE) {
  const dir = path.dirname(filename)
  if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true })
  const Database = loadBetterSQLite()
  return applySQLiteProductionPragmas(new Database(filename))
}

export async function attachBaileysStoreDatabase(db, sqlite = null, filename = DEFAULT_BAILEYS_SQLITE_FILE) {
  if (!db) return db
  db.baileysSqlite = sqlite || db.sqlite || createBaileysSQLite(filename)
  return db
}

export async function createDatabase(filename = DEFAULT_SQLITE_FILE, options = {}) {
  const SQLiteDatabase = await loadSQLiteDatabase()
  const db = new SQLiteDatabase(filename)
  return attachBaileysStoreDatabase(db, db.sqlite, options.baileysFilename)
}

export async function initializeDatabase(filename = DEFAULT_SQLITE_FILE, options = {}) {
  return createDatabase(filename, options)
}

class SQLiteOnlyDatabase {
  constructor() {
    throw new Error('SQLiteOnlyDatabase usa carga perezosa asíncrona; utiliza await initializeDatabase(...)')
  }
}

export { SQLiteOnlyDatabase as DbManager, SQLiteOnlyDatabase }
export default SQLiteOnlyDatabase
