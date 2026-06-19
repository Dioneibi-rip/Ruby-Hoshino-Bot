import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import SQLiteDatabase from './lib/database.js'

const ZIP_PATH = process.argv[2] || './databaseX2.zip'
const DB_PATH = process.argv[3] || './src/database/database.sqlite'
const STATIC_CHARACTERS = './src/database/characters.json'

function readJson(file, fallback) {
  if (!existsSync(file)) return fallback
  const raw = readFileSync(file, 'utf8').trim()
  if (!raw) return fallback
  return JSON.parse(raw)
}
function arrayFrom(value) { return Array.isArray(value) ? value : Object.values(value || {}) }
function copyCharacters(extractDir) {
  const source = path.join(extractDir, 'database', 'characters.json')
  if (!existsSync(source)) return
  mkdirSync(path.dirname(STATIC_CHARACTERS), { recursive: true })
  if (!existsSync(STATIC_CHARACTERS)) {
    // Se crea solo si no existe: characters.json queda como fuente local editable por el owner.
    execFileSync('cp', [source, STATIC_CHARACTERS])
  }
}

if (!existsSync(ZIP_PATH)) throw new Error(`No existe ${ZIP_PATH}`)
const tmp = mkdtempSync(path.join(tmpdir(), 'ruby-db-migrate-'))
try {
  execFileSync('unzip', ['-q', ZIP_PATH, '-d', tmp])
  copyCharacters(tmp)
  const base = path.join(tmp, 'database')
  const db = new SQLiteDatabase(DB_PATH)
  const users = readJson(path.join(base, 'db.json'), {}).users || readJson(path.join(base, 'database.json'), {}).users || {}
  const migrateUsers = db.sqlite.transaction((entries) => { for (const [id, value] of entries) db.updateUser(id, value || {}) })
  migrateUsers(Object.entries(users))
  db.replaceHarem(arrayFrom(readJson(path.join(base, 'harem.json'), [])))
  db.replaceSection('claim_config', readJson(path.join(base, 'userClaimConfig.json'), {}))
  db.replaceSection('character_favorites', readJson(path.join(base, 'charactersfav.json'), {}))
  db.replaceSection('owners', readJson(path.join(base, 'owners.json'), {}))
  db.replaceSection('group_votes', readJson(path.join(base, 'groupVotes.json'), {}))
  db.replaceSection('marriages', readJson(path.join(base, 'casados.json'), {}))
  db.replaceSection('waifus_venta', readJson(path.join(base, 'waifusVenta.json'), {}))
  db.close()
  console.log(`Migración completada en ${DB_PATH}. characters.json permanece en ${STATIC_CHARACTERS}.`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
