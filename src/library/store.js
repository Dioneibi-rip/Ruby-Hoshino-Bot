import { createRequire } from 'module'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import path from 'path'
import pino from './logger.js'
import createSQLiteStore from './sqlite-store.js'

const baileysModule = await import('@whiskeysockets/baileys')
const makeInMemoryStore = baileysModule.makeInMemoryStore || baileysModule.default?.makeInMemoryStore

let instance
let ownedSqlite
let pruneTimer
const require = createRequire(import.meta.url)
const DEFAULT_MAX_MESSAGES_PER_CHAT = 20
const DEFAULT_MAX_MESSAGE_AGE_MS = 60 * 60 * 1000
const DEFAULT_INACTIVE_CHAT_TTL_MS = 6 * 60 * 60 * 1000
const DEFAULT_PRUNE_INTERVAL_MS = 5 * 60 * 1000
process.env.BAILEYS_STORE_MAX_MESSAGES_PER_CHAT ||= String(DEFAULT_MAX_MESSAGES_PER_CHAT)
process.env.BAILEYS_STORE_MAX_MESSAGE_AGE_MS ||= String(DEFAULT_MAX_MESSAGE_AGE_MS)
process.env.BAILEYS_STORE_INACTIVE_CHAT_TTL_MS ||= String(DEFAULT_INACTIVE_CHAT_TTL_MS)
process.env.BAILEYS_STORE_PRUNE_INTERVAL_MS ||= String(DEFAULT_PRUNE_INTERVAL_MS)
const MAX_MESSAGES_PER_CHAT = Number.parseInt(process.env.BAILEYS_STORE_MAX_MESSAGES_PER_CHAT, 10)
const MAX_MESSAGE_AGE_MS = Number.parseInt(process.env.BAILEYS_STORE_MAX_MESSAGE_AGE_MS, 10)
const INACTIVE_CHAT_TTL_MS = Number.parseInt(process.env.BAILEYS_STORE_INACTIVE_CHAT_TTL_MS, 10)
const PRUNE_INTERVAL_MS = Number.parseInt(process.env.BAILEYS_STORE_PRUNE_INTERVAL_MS, 10)
const DEFAULT_BAILEYS_SQLITE_FILE = './src/database/baileys-store.sqlite'
const LEGACY_MEMORY_STORE_FILES = ['./baileys_store_multi.json', './baileys_store.json']

function ensureParentDir(filename) {
  const dir = path.dirname(filename)
  if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function removeLegacyMemoryStoreFiles() {
  for (const filename of LEGACY_MEMORY_STORE_FILES) {
    try {
      if (existsSync(filename)) unlinkSync(filename)
    } catch (error) {
      console.warn(`[baileys-store] no se pudo eliminar el store legacy ${filename}`, error)
    }
  }
}

function createFallbackMemoryStore() {
  const store = {
    contacts: {},
    chats: {},
    messages: {},
    presences: {},
    bind(conn) { conn.baileysStore = store; conn.store = store; return store },
    loadMessage() { return null },
    countChats() { return Object.keys(store.chats).length }
  }
  return store
}

function createMemoryStore() {
  removeLegacyMemoryStoreFiles()
  try {
    if (typeof makeInMemoryStore !== 'function') throw new TypeError('makeInMemoryStore no está disponible en Baileys')
    const store = makeInMemoryStore({ logger: pino({ level: process.env.BAILEYS_STORE_LOG_LEVEL || 'silent' }) })
    disableMemoryStoreDiskPersistence(store)
    const nativeBind = store.bind?.bind(store)
    store.bind = conn => {
      if (!conn?.ev) throw new TypeError('Baileys memory store requiere una conexión con EventEmitter en conn.ev')
      nativeBind?.(conn.ev)
      conn.baileysStore = store
      conn.store = store
      conn.chats = store.chats
      return store
    }
    return store
  } catch (error) {
    console.warn('[baileys-store] no se pudo inicializar makeInMemoryStore; usando memoria mínima.', error)
    return createFallbackMemoryStore()
  }
}

function disableMemoryStoreDiskPersistence(store) {
  if (!store || typeof store !== 'object') return
  store.readFromFile = () => undefined
  store.writeToFile = () => undefined
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
  sqlite.pragma('busy_timeout = 5000')
  sqlite.pragma('temp_store = MEMORY')
  sqlite.pragma('cache_size = -20000')
  sqlite.pragma('mmap_size = 268435456')
  sqlite.pragma('wal_autocheckpoint = 1000')
  sqlite.pragma('foreign_keys = ON')
  return sqlite
}

function resolveBaileysSqlite() {
  if (!ownedSqlite) {
    ownedSqlite = createOwnedBaileysSqlite()
  }
  return ownedSqlite
}
function getBaileysSQLite() {
  return ownedSqlite
}

function getStore() {
  if (!instance) instance = createSQLiteStore(resolveBaileysSqlite())
  return instance
}
function bind(conn, ev = conn?.ev || conn) {
  const bound = getStore().bind(conn, ev)
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
  const stores = [instance, global.conn?.store, global.conn?.baileysStore].filter(Boolean)
  for (const currentStore of new Set(stores)) pruneMemoryStore(currentStore)
}
function pruneMemoryStore(currentStore) {
  if (!currentStore || typeof currentStore !== 'object') return
  const now = Date.now()
  const activeChatIds = pruneMessagesContainer(currentStore.messages, now)
  prunePresenceContainer(currentStore.presences || currentStore.presence)
  pruneInactiveChats(currentStore.chats, activeChatIds, now)
}
function pruneMessagesContainer(messages, now = Date.now()) {
  const activeChatIds = new Set()
  if (!messages || typeof messages !== 'object') return activeChatIds
  for (const chatId of Object.keys(messages)) {
    const chatMessages = messages[chatId]
    if (!chatMessages) continue
    const latestTimestamp = pruneChatMessages(messages, chatId, chatMessages, now)
    if (latestTimestamp && now - latestTimestamp <= INACTIVE_CHAT_TTL_MS) activeChatIds.add(chatId)
    if (isEmptyContainer(messages[chatId])) delete messages[chatId]
  }
  return activeChatIds
}
function pruneChatMessages(messages, chatId, chatMessages, now) {
  if (Array.isArray(chatMessages)) {
    const keep = selectRecentMessages(chatMessages, now)
    messages[chatId] = keep
    return getLatestMessageTimestamp(keep)
  }
  const keyedMessages = chatMessages.array || chatMessages.list || chatMessages.messages
  if (Array.isArray(keyedMessages)) {
    const keep = selectRecentMessages(keyedMessages, now)
    if (chatMessages.array) chatMessages.array = keep
    else if (chatMessages.list) chatMessages.list = keep
    else chatMessages.messages = keep
    return getLatestMessageTimestamp(keep)
  }
  const entries = Object.entries(chatMessages)
  const keepEntries = entries
    .filter(([, message]) => !isExpiredMessage(message, now))
    .slice(-MAX_MESSAGES_PER_CHAT)
  for (const key of Object.keys(chatMessages)) delete chatMessages[key]
  for (const [key, value] of keepEntries) chatMessages[key] = value
  return getLatestMessageTimestamp(keepEntries.map(([, message]) => message))
}
function selectRecentMessages(chatMessages, now) {
  return chatMessages
    .filter(message => !isExpiredMessage(message, now))
    .slice(-MAX_MESSAGES_PER_CHAT)
}
function isExpiredMessage(message, now) {
  const timestamp = getMessageTimestamp(message)
  return Boolean(timestamp && now - timestamp > MAX_MESSAGE_AGE_MS)
}
function getLatestMessageTimestamp(messages) {
  return messages.reduce((latest, message) => Math.max(latest, getMessageTimestamp(message) || 0), 0)
}
function getMessageTimestamp(message) {
  const rawTimestamp = message?.messageTimestamp || message?.timestamp || message?.key?.messageTimestamp
  const numericTimestamp = typeof rawTimestamp === 'object' && rawTimestamp?.low ? rawTimestamp.low : Number(rawTimestamp)
  if (!Number.isFinite(numericTimestamp) || numericTimestamp <= 0) return 0
  return numericTimestamp < 1e12 ? numericTimestamp * 1000 : numericTimestamp
}
function prunePresenceContainer(presences) {
  if (!presences || typeof presences !== 'object') return
  if (typeof presences.clear === 'function') return presences.clear()
  for (const key of Object.keys(presences)) delete presences[key]
}
function pruneInactiveChats(chats, activeChatIds, now = Date.now()) {
  if (!chats || typeof chats !== 'object') return
  if (typeof chats.all === 'function' && typeof chats.deleteById === 'function') {
    for (const chat of chats.all()) if (shouldDeleteChat(chat, activeChatIds, now)) chats.deleteById(chat.id)
    return
  }
  for (const [chatId, chat] of Object.entries(chats)) if (shouldDeleteChat({ id: chatId, ...chat }, activeChatIds, now)) delete chats[chatId]
}
function shouldDeleteChat(chat, activeChatIds, now) {
  const chatId = chat?.id || chat?.jid
  if (!chatId || activeChatIds.has(chatId)) return false
  const timestamp = getChatTimestamp(chat)
  return Boolean(timestamp && now - timestamp > INACTIVE_CHAT_TTL_MS)
}
function getChatTimestamp(chat) {
  const rawTimestamp = chat?.conversationTimestamp || chat?.lastMessageRecvTimestamp || chat?.lastMessageTimestamp || chat?.timestamp
  const numericTimestamp = typeof rawTimestamp === 'object' && rawTimestamp?.low ? rawTimestamp.low : Number(rawTimestamp)
  if (!Number.isFinite(numericTimestamp) || numericTimestamp <= 0) return 0
  return numericTimestamp < 1e12 ? numericTimestamp * 1000 : numericTimestamp
}
function isEmptyContainer(container) {
  if (!container) return true
  if (Array.isArray(container)) return container.length === 0
  const keyedMessages = container.array || container.list || container.messages
  if (Array.isArray(keyedMessages)) return keyedMessages.length === 0
  return typeof container === 'object' && Object.keys(container).length === 0
}
function loadMessage(jid, id = null) {
  return getStore().loadMessage(jid, id)
}
function countChats() {
  return getStore().countChats()
}
async function closeStore() {
  if (pruneTimer) clearInterval(pruneTimer)
  try { await instance?.flush?.() } catch (error) { console.error('[baileys-store] error vaciando cola SQLite', error) }
  try { ownedSqlite?.pragma?.('wal_checkpoint(TRUNCATE)') } catch {}
  try { ownedSqlite?.close?.() } catch (error) { console.error('[baileys-store] error cerrando SQLite dedicado', error) }
}
export { startMessagePruner, pruneStoreMessages, getBaileysSQLite, resolveBaileysSqlite, closeStore }
export default { bind, loadMessage, countChats, getStore, startMessagePruner, pruneStoreMessages, closeStore }
