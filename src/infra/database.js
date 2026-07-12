import MongoDatabase from './mongo-database.js'
import SQLiteDatabase from './sqlite-database.js'

const DEFAULT_SQLITE_FILE = './src/database/database.sqlite'

function hasMongoUri(uri = process.env.MONGODB_URI) {
  return typeof uri === 'string' && uri.trim().length > 0
}

function createDatabase(filename = DEFAULT_SQLITE_FILE, options = {}) {
  const uri = options.uri ?? process.env.MONGODB_URI
  if (hasMongoUri(uri)) {
    console.info('🟢 MONGODB_URI detectado. Iniciando base de datos en MongoDB...')
    return new MongoDatabase(filename, { ...options, uri })
  }

  console.warn('🟡 MONGODB_URI no detectado. Iniciando base de datos local en SQLite por defecto...')
  return new SQLiteDatabase(filename)
}

class HybridDatabase {
  constructor(filename = DEFAULT_SQLITE_FILE, options = {}) {
    return createDatabase(filename, options)
  }
}

export { createDatabase, hasMongoUri, HybridDatabase, MongoDatabase, SQLiteDatabase }
export { HybridDatabase as DbManager }
export default HybridDatabase
