import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import MongoDatabase from './mongo-database.js'
import SQLiteDatabase from './sqlite-database.js'

const DEFAULT_SQLITE_FILE = './src/database/database.sqlite'
const DEFAULT_BAILEYS_SQLITE_FILE = './src/database/baileys-store.sqlite'

function hasMongoUri(uri = process.env.MONGODB_URI) {
  return typeof uri === 'string' && uri.trim().length > 0
}

function createBaileysSQLite(filename = DEFAULT_BAILEYS_SQLITE_FILE) {
  const dir = path.dirname(filename)
  if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true })
  const sqlite = new Database(filename)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('synchronous = NORMAL')
  sqlite.pragma('busy_timeout = 10000')
  sqlite.pragma('foreign_keys = ON')
  return sqlite
}

function attachBaileysStoreDatabase(db, sqlite = null, filename = DEFAULT_BAILEYS_SQLITE_FILE) {
  if (!db) return db
  db.baileysSqlite = sqlite || db.sqlite || createBaileysSQLite(filename)
  return db
}

function createSQLiteFallback(filename = DEFAULT_SQLITE_FILE, options = {}, reason = null) {
  if (reason) console.warn(`🟡 MongoDB no disponible (${reason.message || reason}). Usando SQLite local para mantener el bot en línea.`)
  else console.warn('🟡 MONGODB_URI no detectado. Iniciando base de datos local en SQLite por defecto...')
  const db = new SQLiteDatabase(filename)
  return attachBaileysStoreDatabase(db, db.sqlite, options.baileysFilename)
}

function createDatabase(filename = DEFAULT_SQLITE_FILE, options = {}) {
  const uri = options.uri ?? process.env.MONGODB_URI
  if (hasMongoUri(uri)) {
    console.info('🟢 MONGODB_URI detectado. Preparando base de datos en MongoDB...')
    const db = new MongoDatabase(filename, { ...options, uri })
    return attachBaileysStoreDatabase(db, null, options.baileysFilename)
  }
  return createSQLiteFallback(filename, options)
}

async function initializeDatabase(filename = DEFAULT_SQLITE_FILE, options = {}) {
  const uri = options.uri ?? process.env.MONGODB_URI
  if (!hasMongoUri(uri)) return createSQLiteFallback(filename, options)

  try {
    console.info('🟢 MONGODB_URI detectado. Conectando base de datos en MongoDB...')
    const db = new MongoDatabase(filename, { ...options, uri })
    await db.ready
    console.info('✅ MongoDB conectado. La base de datos principal usará MongoDB.')
    return attachBaileysStoreDatabase(db, null, options.baileysFilename)
  } catch (error) {
    return createSQLiteFallback(filename, options, error)
  }
}

class HybridDatabase {
  constructor(filename = DEFAULT_SQLITE_FILE, options = {}) {
    return createDatabase(filename, options)
  }
}

export { createDatabase, initializeDatabase, hasMongoUri, HybridDatabase, MongoDatabase, SQLiteDatabase, createBaileysSQLite, attachBaileysStoreDatabase }
export { HybridDatabase as DbManager }
export default HybridDatabase
