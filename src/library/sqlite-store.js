import { getCachedParticipatingGroups } from './baileys-group-cache.js'
function now() {
return Date.now()
}
function safeJson(value, fallback = {}) {
if (value == null || value === '') return fallback
if (typeof value === 'object') return value
try {
return JSON.parse(value)
} catch {
return fallback
}
}
function stringify(value) {
return JSON.stringify(value ?? {})
}
function sanitizeSqliteArg(value) {
if (typeof value === 'undefined') return null
if (typeof value === 'boolean') return value ? 1 : 0
if (value instanceof Date) return value.getTime()
if (Buffer.isBuffer(value) || value instanceof Uint8Array) return value
if (value && typeof value === 'object') return stringify(value)
return value
}
function sanitizeSqliteArgs(args = [], statement = null, { prefixNamed = false } = {}) {
if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0]) && !(args[0] instanceof Date) && !Buffer.isBuffer(args[0]) && !(args[0] instanceof Uint8Array)) {
const params = Object.fromEntries(Object.entries(args[0]).map(([key, value]) => [key, sanitizeSqliteArg(value)]))
const source = String(statement?.source || '')
const placeholders = [...source.matchAll(/[@:$][A-Za-z_][A-Za-z0-9_]*/g)].map(match => match[0])
if (!placeholders.length) return [params]
const bound = {}
for (const placeholder of [...new Set(placeholders)]) {
const key = placeholder.slice(1)
const outputKey = prefixNamed ? placeholder : key
if (Object.prototype.hasOwnProperty.call(params, placeholder)) bound[outputKey] = params[placeholder]
else if (Object.prototype.hasOwnProperty.call(params, key)) bound[outputKey] = params[key]
else bound[outputKey] = null
}
return [bound]
}
return args.map(value => sanitizeSqliteArg(value))
}
function sanitizeRowJson(row) {
if (!row || typeof row !== 'object') return row
for (const [key, value] of Object.entries(row)) {
if (typeof value !== 'string') continue
const trimmed = value.trim()
if (!trimmed || !/^(?:\{|\[)/.test(trimmed)) continue
try { row[key] = JSON.parse(trimmed) } catch {}
}
return row
}
function patchSQLiteStatement(statement) {
if (!statement || statement.__rubySanitized) return statement
for (const method of ['run', 'get', 'all', 'runAsync', 'getAsync', 'allAsync']) {
if (typeof statement[method] !== 'function') continue
const original = statement[method].bind(statement)
statement[method] = (...args) => {
let result
try {
result = original(...sanitizeSqliteArgs(args, statement))
} catch (error) {
if (error?.message !== 'Invalid argument') throw error
result = original(...sanitizeSqliteArgs(args, statement, { prefixNamed: true }))
}
if (method === 'get') return sanitizeRowJson(result)
if (method === 'all') return Array.isArray(result) ? result.map(sanitizeRowJson) : result
if (method === 'getAsync') return Promise.resolve(result).then(sanitizeRowJson)
if (method === 'allAsync') return Promise.resolve(result).then(rows => Array.isArray(rows) ? rows.map(sanitizeRowJson) : rows)
return result
}
}
Object.defineProperty(statement, '__rubySanitized', { value: true })
return statement
}
function patchSQLiteConnection(sqlite) {
if (!sqlite || sqlite.__rubySanitizedPrepare || typeof sqlite.prepare !== 'function') return sqlite
const prepare = sqlite.prepare.bind(sqlite)
sqlite.prepare = (...args) => patchSQLiteStatement(prepare(...args))
Object.defineProperty(sqlite, '__rubySanitizedPrepare', { value: true })
return sqlite
}
function normalizeId(conn, id) {
if (!id || typeof id !== 'string') return ''
return conn?.decodeJid?.(id) || id
}
function isValidJid(id) {
return Boolean(id && id !== 'status@broadcast')
}
function publicChat(row) {
if (!row) return undefined
const metadata = safeJson(row.metadata_json, {})
return {
id: row.id,
name: row.name || '',
subject: row.subject || '',
notify: row.notify || '',
vname: row.vname || '',
verifiedName: row.verified_name || '',
isChats: Boolean(row.is_chats),
readOnly: Boolean(row.read_only),
presences: row.presence || undefined,
metadata: Object.keys(metadata).length ? metadata : undefined,
updatedAt: row.updated_at || 0
}
}
function publicContact(row) {
if (!row) return undefined
return {
id: row.id,
name: row.name || '',
notify: row.notify || '',
vname: row.vname || '',
verifiedName: row.verified_name || '',
imgUrl: row.img_url || '',
status: row.status || '',
updatedAt: row.updated_at || 0
}
}
function compact(value = {}) {
return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''))
}
function resolveSQLiteDatabase(candidate) {
const sqlite = candidate?.sqlite && typeof candidate.sqlite.prepare === 'function' ? candidate.sqlite : candidate
if (!sqlite || typeof sqlite.prepare !== 'function' || typeof sqlite.exec !== 'function') {
throw new TypeError('SQLiteBaileysStore requiere una instancia cruda de better-sqlite3 con prepare() y exec()')
}
return sqlite
}
class SQLiteBaileysStore {
constructor(sqlite) {
this.sqlite = patchSQLiteConnection(resolveSQLiteDatabase(sqlite))
this.conn = null
this.statements = {}
this.boundConn = null
this.boundHandlers = []
this._prepareSchema()
this._prepareStatements()
this.chats = this._createChatsProxy()
this.writeQueue = []
this.flushTimer = null
this.flushMaxTimer = null
this.flushPromise = Promise.resolve()
this.flushDelayMs = Number.parseInt(process.env.BAILEYS_STORE_FLUSH_DELAY_MS || '300', 10)
this.flushMaxDelayMs = Number.parseInt(process.env.BAILEYS_STORE_MAX_FLUSH_DELAY_MS || '1500', 10)
}

_prepareSchema() {
this.sqlite.exec(`
CREATE TABLE IF NOT EXISTS baileys_contacts (
id TEXT PRIMARY KEY,
name TEXT NOT NULL DEFAULT '',
notify TEXT NOT NULL DEFAULT '',
vname TEXT NOT NULL DEFAULT '',
verified_name TEXT NOT NULL DEFAULT '',
img_url TEXT NOT NULL DEFAULT '',
status TEXT NOT NULL DEFAULT '',
raw_json TEXT NOT NULL DEFAULT '{}',
updated_at INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS baileys_chats (
id TEXT PRIMARY KEY,
name TEXT NOT NULL DEFAULT '',
subject TEXT NOT NULL DEFAULT '',
notify TEXT NOT NULL DEFAULT '',
vname TEXT NOT NULL DEFAULT '',
verified_name TEXT NOT NULL DEFAULT '',
is_chats INTEGER NOT NULL DEFAULT 1,
read_only INTEGER NOT NULL DEFAULT 0,
presence TEXT NOT NULL DEFAULT '',
metadata_json TEXT NOT NULL DEFAULT '{}',
raw_json TEXT NOT NULL DEFAULT '{}',
updated_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_baileys_chats_is_chats ON baileys_chats(is_chats);
CREATE INDEX IF NOT EXISTS idx_baileys_chats_updated_at ON baileys_chats(updated_at);
CREATE INDEX IF NOT EXISTS idx_baileys_contacts_updated_at ON baileys_contacts(updated_at);
`)
}
_prepareStatements() {
this.statements.upsertContact = this.sqlite.prepare(`INSERT OR REPLACE INTO baileys_contacts(id,name,notify,vname,verified_name,img_url,status,raw_json,updated_at) VALUES(@id,@name,@notify,@vname,@verified_name,@img_url,@status,@raw_json,@updated_at)`)
this.statements.upsertChat = this.sqlite.prepare(`INSERT OR REPLACE INTO baileys_chats(id,name,subject,notify,vname,verified_name,is_chats,read_only,presence,metadata_json,raw_json,updated_at) VALUES(@id,@name,@subject,@notify,@vname,@verified_name,@is_chats,@read_only,@presence,@metadata_json,@raw_json,@updated_at)`)
this.statements.getChat = this.sqlite.prepare('SELECT * FROM baileys_chats WHERE id = ?')
this.statements.getContact = this.sqlite.prepare('SELECT * FROM baileys_contacts WHERE id = ?')
this.statements.listChats = this.sqlite.prepare('SELECT * FROM baileys_chats')
this.statements.chatIds = this.sqlite.prepare('SELECT id FROM baileys_chats')
this.statements.deleteChat = this.sqlite.prepare('DELETE FROM baileys_chats WHERE id = ?')
this.statements.countChats = this.sqlite.prepare('SELECT COUNT(*) AS total FROM baileys_chats WHERE is_chats = 1')
}
bind(conn, ev = conn?.ev || conn) {
this.unbind()
if (!ev || typeof ev.off !== 'function') return this
this.conn = conn?.ev ? conn : this.conn
this.boundConn = conn?.ev ? conn : { ev }
if (conn?.ev) {
conn.baileysStore = this
conn.chats = this.chats
}
this._on(ev, 'contacts.update', contacts => this.queueContacts(contacts))
this._on(ev, 'contacts.upsert', contacts => this.queueContacts(contacts))
this._on(ev, 'contacts.set', payload => this.queueContacts(payload?.contacts || payload))
this._on(ev, 'chats.update', chats => this.queueChats(chats))
this._on(ev, 'chats.upsert', chats => this.queueChats(chats))
this._on(ev, 'chats.set', payload => this.queueChats(payload?.chats || payload))
this._on(ev, 'groups.update', groups => this.queueChats(groups))
this._on(ev, 'group-participants.update', update => setTimeout(() => this.refreshGroup(update?.id), 2500).unref?.())
this._on(ev, 'presence.update', update => this.queuePresence(update))
this._on(ev, 'messages.upsert', payload => { if (payload?.type !== 'append') this.queueMessagesMetadata(payload?.messages || []) })
return this
}
_on(ev, event, listener) {
if (!ev || typeof ev.off !== 'function') return
ev.off(event, listener)
ev.on(event, listener)
this.boundHandlers.push({ event, listener })
}
unbind() {
this.flush()
if (!this.boundConn?.ev || !this.boundHandlers.length) return
for (const { event, listener } of this.boundHandlers) this.boundConn.ev.off?.(event, listener)
this.boundHandlers = []
this.boundConn = null
}

queueContacts(input) {
const contacts = Array.isArray(input) ? input : input ? [input] : []
if (contacts.length) this._enqueue({ type: 'contacts', items: contacts })
}
queueChats(input) {
const chats = Array.isArray(input) ? input : input ? [input] : []
if (chats.length) this._enqueue({ type: 'chats', items: chats })
}
queuePresence(update = {}) {
if (update?.id) this._enqueue({ type: 'presence', item: update })
}
queueMessagesMetadata(messages = []) {
if (messages.length) this._enqueue({ type: 'messages', items: messages })
}
_enqueue(job) {
this.writeQueue.push(job)
if (this.flushTimer) clearTimeout(this.flushTimer)
this.flushTimer = setTimeout(() => this.flush(), this.flushDelayMs)
this.flushTimer.unref?.()
if (!this.flushMaxTimer) {
this.flushMaxTimer = setTimeout(() => this.flush(), this.flushMaxDelayMs)
this.flushMaxTimer.unref?.()
}
return this.flushPromise
}
flush() {
if (this.flushTimer) clearTimeout(this.flushTimer)
if (this.flushMaxTimer) clearTimeout(this.flushMaxTimer)
this.flushTimer = null
this.flushMaxTimer = null
const jobs = this.writeQueue.splice(0)
if (!jobs.length) return this.flushPromise
this.flushPromise = this.flushPromise.then(() => {
const tx = this.sqlite.transaction(batch => {
for (const job of batch) {
if (job.type === 'contacts') for (const contact of job.items) this.saveContact(contact)
else if (job.type === 'chats') for (const chat of job.items) this.saveChat(chat)
else if (job.type === 'presence') this.savePresence(job.item)
else if (job.type === 'messages') this.saveMessagesMetadata(job.items)
}
})
tx(jobs)
}).catch(error => console.error('[baileys-store] error guardando lote:', error))
return this.flushPromise
}
saveContacts(input) {
const contacts = Array.isArray(input) ? input : input ? [input] : []
const run = this.sqlite.transaction(items => {
for (const contact of items) this.saveContact(contact)
})
run(contacts)
}
saveContact(contact = {}) {
const id = normalizeId(this.conn, contact.id || contact.jid)
if (!isValidJid(id)) return
const row = this._contactRow(id, contact)
this.statements.upsertContact.run(row)
if (!id.endsWith('@g.us')) this.saveChat({ id, name: row.name, notify: row.notify, vname: row.vname, verifiedName: row.verified_name, isChats: true })
}
saveChats(input) {
const chats = Array.isArray(input) ? input : input ? [input] : []
const run = this.sqlite.transaction(items => {
for (const chat of items) this.saveChat(chat)
})
run(chats)
}
saveChat(chat = {}) {
const id = normalizeId(this.conn, chat.id || chat.jid)
if (!isValidJid(id)) return
this.statements.upsertChat.run(this._chatRow(id, chat))
}
savePresence(update = {}) {
const id = normalizeId(this.conn, update.id)
if (!isValidJid(id)) return
const sender = normalizeId(this.conn, Object.keys(update.presences || {})[0] || id)
const presence = update.presences?.[sender]?.lastKnownPresence || update.presences?.[Object.keys(update.presences || {})[0]]?.lastKnownPresence || ''
if (isValidJid(sender)) this.saveChat({ id: sender, presences: presence, isChats: !sender.endsWith('@g.us') })
if (id.endsWith('@g.us')) this.saveChat({ id, isChats: true })
}
saveMessagesMetadata(messages = []) {
for (const message of messages) {
const chat = normalizeId(this.conn, message?.key?.remoteJid || message?.message?.senderKeyDistributionMessage?.groupId)
if (!isValidJid(chat)) continue
const isGroup = chat.endsWith('@g.us')
this.saveChat({ id: chat, isChats: true, name: isGroup ? '' : message.pushName || '' })
const sender = normalizeId(this.conn, message?.key?.fromMe ? this.conn?.user?.id : message?.participant || message?.key?.participant || chat)
if (isValidJid(sender) && sender !== chat) this.saveContact({ id: sender, name: message.pushName || '' })
}
}
async refreshGroup(id) {
id = normalizeId(this.conn, id)
if (!isValidJid(id) || !id.endsWith('@g.us')) return
const metadata = await this.conn.groupMetadata(id).catch(() => null)
if (!metadata) return
this.saveChat({ id, subject: metadata.subject || '', metadata, isChats: true })
}
async insertAllGroup() {
const groups = await getCachedParticipatingGroups(this.conn)
for (const [id, metadata] of Object.entries(groups)) this.saveChat({ id, subject: metadata.subject || '', metadata, isChats: true })
return this.chats
}
loadMessage() {
return null
}
countChats() {
return this.statements.countChats.get().total || 0
}
_chatRow(id, chat = {}) {
const current = publicChat(this.statements.getChat.get(id)) || {}
const metadata = chat.metadata || current.metadata || {}
const isGroup = id.endsWith('@g.us')
return {
id,
name: chat.name || chat.notify || current.name || '',
subject: chat.subject || (isGroup ? chat.name : '') || current.subject || '',
notify: chat.notify || current.notify || '',
vname: chat.vname || current.vname || '',
verified_name: chat.verifiedName || chat.verified_name || current.verifiedName || '',
is_chats: chat.isChats === false ? 0 : 1,
read_only: chat.readOnly || chat.read_only ? 1 : 0,
presence: chat.presences || chat.presence || current.presences || '',
metadata_json: stringify(metadata),
raw_json: stringify(compact({ ...current, ...chat, messages: undefined })),
updated_at: now()
}
}
_contactRow(id, contact = {}) {
const current = publicContact(this.statements.getContact.get(id)) || {}
return {
id,
name: contact.name || contact.notify || current.name || '',
notify: contact.notify || current.notify || '',
vname: contact.vname || current.vname || '',
verified_name: contact.verifiedName || contact.verified_name || current.verifiedName || '',
img_url: contact.imgUrl || contact.img_url || current.imgUrl || '',
status: contact.status || current.status || '',
raw_json: stringify(compact({ ...current, ...contact })),
updated_at: now()
}
}
_proxifyChat(id, chat) {
return new Proxy(chat, {
set: (target, prop, value) => {
target[prop] = value
this.saveChat({ ...target, id })
return true
},
deleteProperty: (target, prop) => {
delete target[prop]
this.saveChat({ ...target, id })
return true
}
})
}
_createChatsProxy() {
const target = {}
return new Proxy(target, {
get: (_, prop) => {
if (prop === Symbol.iterator) return undefined
if (prop === 'toJSON') return () => Object.fromEntries(this.statements.listChats.all().map(row => [row.id, publicChat(row)]))
if (prop === 'valueOf') return () => this.chats
if (typeof prop === 'symbol') return target[prop]
const chat = publicChat(this.statements.getChat.get(prop))
return chat ? this._proxifyChat(prop, chat) : undefined
},
set: (_, prop, value) => {
if (typeof prop !== 'string') return true
this.saveChat({ ...(value || {}), id: prop })
return true
},
deleteProperty: (_, prop) => {
if (typeof prop === 'string') this.statements.deleteChat.run(prop)
return true
},
has: (_, prop) => typeof prop === 'string' && Boolean(this.statements.getChat.get(prop)),
ownKeys: () => this.statements.chatIds.all().map(row => row.id),
getOwnPropertyDescriptor: (_, prop) => {
if (typeof prop !== 'string') return undefined
const value = publicChat(this.statements.getChat.get(prop))
if (!value) return undefined
return { enumerable: true, configurable: true, value }
}
})
}
}
function createSQLiteStore(sqlite) {
return new SQLiteBaileysStore(sqlite)
}
export { SQLiteBaileysStore, createSQLiteStore }
export default createSQLiteStore
