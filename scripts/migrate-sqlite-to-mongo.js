#!/usr/bin/env node
import Database from 'better-sqlite3'
import mongoose from 'mongoose'
import { existsSync } from 'fs'

const sqliteFile = process.env.SQLITE_FILE || process.argv[2] || './src/database/database.sqlite'
const mongoUri = process.env.MONGODB_URI
const mongoDbName = process.env.MONGODB_DB_NAME
const batchSize = Number(process.env.MIGRATION_BATCH_SIZE || 1000)

if (!mongoUri) {
  console.error('❌ Define MONGODB_URI antes de ejecutar la migración.')
  process.exit(1)
}
if (!existsSync(sqliteFile)) {
  console.error(`❌ No existe la base SQLite: ${sqliteFile}`)
  process.exit(1)
}

function parseJSON(value, fallback = {}) {
  if (value == null || value === '') return fallback
  try { return JSON.parse(value) } catch { return fallback }
}
function normalizeRow(row = {}) {
  const user = { ...row, _id: String(row.id || row._id || '') }
  delete user.id
  user.registered = Boolean(user.registered)
  user.premium = Boolean(user.premium)
  user.banned = Boolean(user.banned)
  user.muto = Boolean(user.muto)
  user.extras = typeof user.extras === 'string' ? parseJSON(user.extras, {}) : (user.extras || {})
  user.updatedAt = new Date()
  user.createdAt ||= new Date()
  return user
}

const userSchema = new mongoose.Schema({ _id: String }, { strict: false, timestamps: true, minimize: false, versionKey: false })
userSchema.index({ level: -1 })
userSchema.index({ coin: -1 })
userSchema.index({ bank: -1 })
userSchema.index({ premiumTime: 1 })
userSchema.index({ marry: 1 })

try {
  const sqlite = new Database(sqliteFile, { readonly: true, fileMustExist: true })
  await mongoose.connect(mongoUri, { dbName: mongoDbName, maxPoolSize: 20, serverSelectionTimeoutMS: 10_000, retryWrites: true })
  const User = mongoose.models.User || mongoose.model('User', userSchema, 'users')
  const total = sqlite.prepare('SELECT COUNT(*) AS total FROM users').get().total
  let offset = 0
  let migrated = 0

  console.info(`🚚 Migrando ${total} usuarios desde ${sqliteFile} hacia MongoDB...`)
  while (offset < total) {
    const rows = sqlite.prepare('SELECT * FROM users LIMIT ? OFFSET ?').all(batchSize, offset).map(normalizeRow).filter(user => user._id)
    if (rows.length) {
      await User.bulkWrite(rows.map(user => ({ replaceOne: { filter: { _id: user._id }, replacement: user, upsert: true } })), { ordered: false })
      migrated += rows.length
      console.info(`✅ ${migrated}/${total} usuarios migrados`)
    }
    offset += batchSize
  }

  sqlite.close()
  await mongoose.connection.close(false)
  console.info('🎉 Migración de usuarios completada sin pérdida de progreso.')
} catch (error) {
  console.error('❌ Error crítico migrando SQLite -> MongoDB:', error)
  try { await mongoose.connection.close(false) } catch {}
  process.exit(1)
}
