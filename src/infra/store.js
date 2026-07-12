import createSQLiteStore from './sqlite-store.js'
import { createBaileysSQLite } from './database.js'

let instance
let ownedSqlite
let pruneTimer
const MAX_MESSAGES_PER_CHAT = 50
const PRUNE_INTERVAL_MS = 60 * 60 * 1000
const DEFAULT_BAILEYS_SQLITE_FILE = './src/database/baileys-store.sqlite'

function resolveBaileysSqlite() {
const sqlite = global.db?.baileysSqlite || global.db?.sqlite
if (sqlite) return sqlite
if (!ownedSqlite) {
console.warn('🟡 Baileys Store no recibió SQLite desde global.db; creando SQLite dedicado para sesiones/mensajes.')
ownedSqlite = createBaileysSQLite(process.env.BAILEYS_STORE_SQLITE || DEFAULT_BAILEYS_SQLITE_FILE)
}
return ownedSqlite
}

function getStore() {
if (!instance) instance = createSQLiteStore(resolveBaileysSqlite())
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
try { ownedSqlite?.close?.() } catch (error) { console.error('[baileys-store] error cerrando SQLite dedicado', error) }
}
export { startMessagePruner, pruneStoreMessages, resolveBaileysSqlite, closeStore }
export default { bind, loadMessage, countChats, getStore, startMessagePruner, pruneStoreMessages, closeStore }
