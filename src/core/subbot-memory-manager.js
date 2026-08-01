const DEFAULT_SWEEP_INTERVAL_MS = 120000
const DEFAULT_GC_INTERVAL_MS = 300000
const DEFAULT_MAX_MESSAGES_PER_CHAT = 8
const DEFAULT_MAX_CHATS = 300
const DEFAULT_MAX_CONTACTS = 800
const timers = new Map()
function numericEnv(name, fallback) {
const value = Number.parseInt(process.env[name] || '', 10)
return Number.isFinite(value) && value > 0 ? value : fallback
}
function deleteOverflowKeys(container, max) {
if (!container || typeof container !== 'object') return 0
const keys = Object.keys(container)
if (keys.length <= max) return 0
let deleted = 0
for (const key of keys.slice(0, keys.length - max)) {
delete container[key]
deleted++
}
return deleted
}
function trimArray(value, max) {
if (!Array.isArray(value) || value.length <= max) return 0
const removed = value.length - max
value.splice(0, removed)
return removed
}
function pruneMessages(messages, maxPerChat) {
if (!messages || typeof messages !== 'object') return 0
let deleted = 0
for (const chatId of Object.keys(messages)) {
const bucket = messages[chatId]
if (!bucket) {
delete messages[chatId]
deleted++
continue
}
if (Array.isArray(bucket)) deleted += trimArray(bucket, maxPerChat)
else if (Array.isArray(bucket.array)) deleted += trimArray(bucket.array, maxPerChat)
else if (Array.isArray(bucket.list)) deleted += trimArray(bucket.list, maxPerChat)
else if (Array.isArray(bucket.messages)) deleted += trimArray(bucket.messages, maxPerChat)
else deleted += deleteOverflowKeys(bucket, maxPerChat)
if (!Object.keys(bucket).length) {
delete messages[chatId]
deleted++
}
}
return deleted
}
function clearContainer(container) {
if (!container || typeof container !== 'object') return 0
if (typeof container.clear === 'function') {
const size = container.size || 0
container.clear()
return size
}
const count = Object.keys(container).length
for (const key of Object.keys(container)) delete container[key]
return count
}
export function sweepSubbotSocket(sock, options = {}) {
if (!sock || typeof sock !== 'object') return { deleted: 0 }
const maxPerChat = Number(options.maxMessagesPerChat) || numericEnv('RUBY_SUBBOT_MAX_MESSAGES_PER_CHAT', DEFAULT_MAX_MESSAGES_PER_CHAT)
const maxChats = Number(options.maxChats) || numericEnv('RUBY_SUBBOT_MAX_CHATS', DEFAULT_MAX_CHATS)
const maxContacts = Number(options.maxContacts) || numericEnv('RUBY_SUBBOT_MAX_CONTACTS', DEFAULT_MAX_CONTACTS)
const store = sock.store || sock.baileysStore
let deleted = 0
deleted += pruneMessages(store?.messages, maxPerChat)
deleted += pruneMessages(sock.messages, maxPerChat)
deleted += deleteOverflowKeys(store?.chats, maxChats)
deleted += deleteOverflowKeys(sock.chats, maxChats)
deleted += deleteOverflowKeys(store?.contacts, maxContacts)
deleted += clearContainer(store?.presences || store?.presence)
deleted += clearContainer(sock.presences || sock.presence)
return { deleted }
}
export function runGarbageCollector() {
if (typeof global.gc !== 'function') return false
global.gc()
return true
}
export function attachSubbotMemoryManager(getSockets, options = {}) {
const key = options.key || 'default'
if (timers.has(key)) return timers.get(key)
const sweepIntervalMs = Number(options.sweepIntervalMs) || numericEnv('RUBY_SUBBOT_SWEEP_INTERVAL_MS', DEFAULT_SWEEP_INTERVAL_MS)
const gcIntervalMs = Number(options.gcIntervalMs) || numericEnv('RUBY_SUBBOT_GC_INTERVAL_MS', DEFAULT_GC_INTERVAL_MS)
const sweep = () => {
for (const sock of getSockets()) sweepSubbotSocket(sock, options)
}
const gc = () => {
sweep()
runGarbageCollector()
}
const sweepTimer = setInterval(sweep, sweepIntervalMs)
const gcTimer = setInterval(gc, gcIntervalMs)
sweepTimer.unref?.()
gcTimer.unref?.()
const controller = { sweep, gc, stop() { clearInterval(sweepTimer); clearInterval(gcTimer); timers.delete(key) } }
timers.set(key, controller)
return controller
}
