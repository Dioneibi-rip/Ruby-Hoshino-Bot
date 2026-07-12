import { createRequire } from 'module'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import pino from 'pino'

const baileysModule = await import('@whiskeysockets/baileys')
const makeInMemoryStore = baileysModule.makeInMemoryStore || baileysModule.default?.makeInMemoryStore

import createSQLiteStore from './sqlite-store.js'

let instance
let ownedSqlite
let pruneTimer
let persistenceTimer
const require = createRequire(import.meta.url)
const MAX_MESSAGES_PER_CHAT = 50
const PRUNE_INTERVAL_MS = 60 * 60 * 1000
const MEMORY_STORE_FLUSH_MS = 30 * 1000
const DEFAULT_BAILEYS_SQLITE_FILE = './src/database/baileys-store.sqlite'
const DEFAULT_MEMORY_STORE_FILE = './baileys_store_multi.json'

function hasMongoUri() {
  return typeof process.env.MONGODB_URI === 'string' && process.env.MONGODB_URI.trim().length > 0
}

function ensureParentDir(filename) {
  const dir = path.dirname(filename)
  if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function createFallbackMemoryStore() {
  const store = {
    contacts: {},
    chats: {},
    messages: {},
    bind(conn) { conn.baileysStore = store; conn.store = store; return store },
    loadMessage() { return null },
    countChats() { return Object.keys(store.chats).length }
  }
  return store
}

function createMemoryStore() {
  const memoryFile = process.env.BAILEYS_MEMORY_STORE_FILE || DEFAULT_MEMORY_STORE_FILE
  try {
    if (typeof makeInMemoryStore !== 'function') throw new TypeError('makeInMemoryStore no está disponible en Baileys')
    const store = makeInMemoryStore({ logger: pino({ level: process.env.BAILEYS_STORE_LOG_LEVEL || 'silent' }) })
    if (existsSync(memoryFile)) store.readFromFile?.(memoryFile)
    startMemoryStorePersistence(store, memoryFile)
    return store
  } catch (error) {
    console.warn('[baileys-store] no se pudo inicializar makeInMemoryStore; usando memoria mínima.', error)
    return createFallbackMemoryStore()
  }
}

function startMemoryStorePersistence(store, filename) {
  if (!store?.writeToFile || persistenceTimer) return
  ensureParentDir(filename)
  persistenceTimer = setInterval(() => {
    try { store.writeToFile(filename) } catch (error) { console.error('[baileys-store] error guardando store en memoria', error) }
  }, MEMORY_STORE_FLUSH_MS)
  persistenceTimer.unref?.()
}

function loadBetterSQLite() {
  const module = require('better-sqlite3')
  return module.default || module
}

function createOwnedBaileysSqlite(filename = process.env.BAILEYS_STORE_SQLITE || DEFAULT_BAILEYS_SQLITE_FILE) {
  ensureParentDir(filename)
  const Database = loadBetterSQLite()
  const sqlite = new Database(filename)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('synchronous = NORMAL')
  sqlite.pragma('busy_timeout = 10000')
  sqlite.pragma('foreign_keys = ON')
  return sqlite
}

function resolveBaileysSqlite() {
  if (hasMongoUri()) return null
  if (!ownedSqlite) {
    console.warn('🟡 Baileys Store usará SQLite dedicado con una instancia cruda de better-sqlite3.')
    ownedSqlite = createOwnedBaileysSqlite()
  }
  return ownedSqlite
}

function getStore() {
  if (!instance) instance = hasMongoUri() ? createMemoryStore() : createSQLiteStore(resolveBaileysSqlite())
  return instance
}
function bind(conn) {
  const bound = getStore().bind(conn)
  startMessagePruner()
  return bound
}
function startMessagePruner() {
  if (pruneTimer) return pruneTimer
  pruneTimer = setInterval(pruneStoreMessages, PRUNE_INTERVAL_MS)
  pruneTimer.unref?.()
  return pruneTimer
}
function pruneStoreMessages() {
  const stores = [instance, global.conn?.store, global.conn?.baileysStore, ...(Array.isArray(global.conns) ? global.conns.map(conn => conn?.store || conn?.baileysStore) : [])].filter(Boolean)
  for (const currentStore of new Set(stores)) pruneMessagesContainer(currentStore.messages)
}
function pruneMessagesContainer(messages) {
  if (!messages || typeof messages !== 'object') return
  for (const chatId of Object.keys(messages)) {
    const chatMessages = messages[chatId]
    if (!chatMessages) continue
    if (Array.isArray(chatMessages)) {
      if (chatMessages.length > MAX_MESSAGES_PER_CHAT) messages[chatId] = chatMessages.slice(-MAX_MESSAGES_PER_CHAT)
      continue
    }
    const keyedMessages = chatMessages.array || chatMessages.list || chatMessages.messages
    if (Array.isArray(keyedMessages) && keyedMessages.length > MAX_MESSAGES_PER_CHAT) {
      const keep = keyedMessages.slice(-MAX_MESSAGES_PER_CHAT)
      if (chatMessages.array) chatMessages.array = keep
      else if (chatMessages.list) chatMessages.list = keep
      else chatMessages.messages = keep
      continue
    }
    const keys = Object.keys(chatMessages)
    if (keys.length <= MAX_MESSAGES_PER_CHAT) continue
    for (const key of keys.slice(0, keys.length - MAX_MESSAGES_PER_CHAT)) delete chatMessages[key]
  }
}
function loadMessage(jid, id = null) {
  return getStore().loadMessage(jid, id)
}
function countChats() {
  return getStore().countChats()
}
function closeStore() {
  if (persistenceTimer) clearInterval(persistenceTimer)
  try { ownedSqlite?.close?.() } catch (error) { console.error('[baileys-store] error cerrando SQLite dedicado', error) }
}
export { startMessagePruner, pruneStoreMessages, resolveBaileysSqlite, closeStore }
export default { bind, loadMessage, countChats, getStore, startMessagePruner, pruneStoreMessages, closeStore }
