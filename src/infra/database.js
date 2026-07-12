import { createRequire } from 'module'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const DEFAULT_SQLITE_FILE = './src/database/database.sqlite'
const DEFAULT_BAILEYS_SQLITE_FILE = './src/database/baileys-store.sqlite'

function hasMongoUri(uri = process.env.MONGODB_URI) {
  return typeof uri === 'string' && uri.trim().length > 0
}

async function loadMongoDatabase() {
  const module = await import('./mongo-database.js')
  return module.MongoDatabase || module.default
}

async function loadSQLiteDatabase() {
  const module = await import('./sqlite-database.js')
  return module.SQLiteDatabase || module.default
}

function loadBetterSQLite() {
  return createRequire(import.meta.url)('better-sqlite3')
}

function createBaileysSQLite(filename = DEFAULT_BAILEYS_SQLITE_FILE) {
  const dir = path.dirname(filename)
  if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true })
  const Database = loadBetterSQLite()
  const sqlite = new Database(filename)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('synchronous = NORMAL')
  sqlite.pragma('busy_timeout = 10000')
  sqlite.pragma('foreign_keys = ON')
  return sqlite
}

async function attachBaileysStoreDatabase(db, sqlite = null, filename = DEFAULT_BAILEYS_SQLITE_FILE) {
  if (!db) return db
  if (hasMongoUri(db.uri || process.env.MONGODB_URI)) return db
  db.baileysSqlite = sqlite || db.sqlite || await createBaileysSQLite(filename)
  return db
}

async function createSQLiteFallback(filename = DEFAULT_SQLITE_FILE, options = {}, reason = null) {
  if (reason) console.warn(`🟡 Usando SQLite local: MongoDB no disponible (${reason.message || reason}). El bot seguirá en línea.`)
  else console.warn('🟡 Usando SQLite local: MONGODB_URI no está configurado.')
  const SQLiteDatabase = await loadSQLiteDatabase()
  const db = new SQLiteDatabase(filename)
  return attachBaileysStoreDatabase(db, db.sqlite, options.baileysFilename)
}

async function createDatabase(filename = DEFAULT_SQLITE_FILE, options = {}) {
  const uri = options.uri ?? process.env.MONGODB_URI
  if (hasMongoUri(uri)) {
    console.info('🟢 MONGODB_URI detectado. Preparando base de datos en MongoDB...')
    const MongoDatabase = await loadMongoDatabase()
    return new MongoDatabase(filename, { ...options, uri })
  }
  return createSQLiteFallback(filename, options)
}

async function initializeDatabase(filename = DEFAULT_SQLITE_FILE, options = {}) {
  const uri = options.uri ?? process.env.MONGODB_URI
  if (!hasMongoUri(uri)) return createSQLiteFallback(filename, options)

  try {
    console.info('🟢 MONGODB_URI detectado. Conectando base de datos en MongoDB...')
    const MongoDatabase = await loadMongoDatabase()
    const db = new MongoDatabase(filename, { ...options, uri })
    await db.ready
    console.info('🟢 Conectado a MongoDB. La base de datos principal usará MongoDB.')
    return db
  } catch (error) {
    console.error('[mongodb] arranque abortado: MONGODB_URI está configurado y no se cargará SQLite como fallback.', error)
    throw error
  }
}

class HybridDatabase {
  constructor() {
    throw new Error('HybridDatabase ahora usa carga perezosa asíncrona; utiliza await initializeDatabase(...)')
  }
}

export { createDatabase, initializeDatabase, hasMongoUri, HybridDatabase, createBaileysSQLite, attachBaileysStoreDatabase }
export { HybridDatabase as DbManager }
export default HybridDatabase
