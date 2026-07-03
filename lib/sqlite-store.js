function now() {
return Date.now()
}
function safeJson(value, fallback = {}) {
if (value == null || value === '') return fallback
try {
return JSON.parse(value)
} catch {
return fallback
}
}
function stringify(value) {
return JSON.stringify(value ?? {})
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
class SQLiteBaileysStore {
constructor(sqlite) {
if (!sqlite) throw new Error('SQLiteBaileysStore requiere una instancia better-sqlite3')
this.sqlite = sqlite
this.conn = null
this.statements = {}
this._prepareSchema()
this._prepareStatements()
this.chats = this._createChatsProxy()
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
bind(conn) {
this.conn = conn
conn.baileysStore = this
conn.chats = this.chats
conn.ev.on('contacts.update', contacts => this.saveContacts(contacts))
conn.ev.on('contacts.upsert', contacts => this.saveContacts(contacts))
conn.ev.on('contacts.set', payload => this.saveContacts(payload?.contacts || payload))
conn.ev.on('chats.update', chats => this.saveChats(chats))
conn.ev.on('chats.upsert', chats => this.saveChats(chats))
conn.ev.on('chats.set', payload => this.saveChats(payload?.chats || payload))
conn.ev.on('groups.update', groups => this.saveChats(groups))
conn.ev.on('group-participants.update', update => this.refreshGroup(update?.id))
conn.ev.on('presence.update', update => this.savePresence(update))
conn.ev.on('messages.upsert', payload => this.saveMessagesMetadata(payload?.messages || []))
return this
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
const groups = await this.conn.groupFetchAllParticipating().catch(() => null) || {}
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
