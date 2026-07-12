import mongoose from 'mongoose'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

const DEFAULT_MONGO_OPTIONS = {
  maxPoolSize: Number(process.env.MONGODB_POOL_SIZE || 50),
  minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 2),
  serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10_000),
  socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 45_000),
  retryWrites: true,
  autoIndex: process.env.NODE_ENV !== 'production'
}

const USER_DEFAULTS = {
  coin: 0, bank: 0, exp: 0, level: 0, role: '*Chibi Aventurero/a V*🐙', limit: 0, health: 100, warn: 0,
  name: '', customName: '', registered: true, age: -1, regTime: -1, birth: '', genre: '', description: '',
  premium: false, premiumTime: 0, banned: false, bannedReason: '', antispam: 0, muto: false, mutoChat: '', lastBanMsg: 0,
  job: 'Ninguno', jobSince: 0, jobXp: 0, commands: 0, msg_count: 0,
  lastclaim: 0, lastmonthly: 0, monthly: 0, weekly: 0, dailyStreak: 0, lastwork: 0, lastAdventure: 0,
  lastmining: 0, lastmiming: 0, lastrob: 0, lastrob2: 0, lastHeal: 0, halloween: 0, christmas: 0,
  diamond: 0, diamonds: 0, emerald: 0, iron: 0, gold: 0, coal: 0, stone: 0, candies: 0, gifts: 0,
  joincount: 0, pickaxedurability: 100, marry: '', extras: {}
}

const NUMERIC_FIELDS = new Set(Object.entries(USER_DEFAULTS).filter(([, value]) => typeof value === 'number').map(([key]) => key))
const BOOLEAN_FIELDS = new Set(Object.entries(USER_DEFAULTS).filter(([, value]) => typeof value === 'boolean').map(([key]) => key))
const INTERNAL_PROPS = new Set(['then', 'inspect', 'toJSON', 'valueOf', Symbol.toStringTag, Symbol.iterator])
const SECTION_COLLECTIONS = new Set(['chats', 'settings', 'stats', 'msgs', 'sticker', 'sessions', 'codes', 'groups', 'marriages', 'harem', 'gacha_market', 'claim_config', 'character_favorites'])

function clone(value) { return JSON.parse(JSON.stringify(value ?? {})) }
function now() { return Date.now() }
function normalizeSearchText(text = '') { return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim() }
function findCharactersFile() { return [path.resolve('./src/database/characters.json'), path.resolve('./database/characters.json')].find(candidate => existsSync(candidate)) }
function normalizeUser(id, value = {}) {
  const source = { ...clone(USER_DEFAULTS), ...(clone(value) || {}), id }
  source.extras = source.extras && typeof source.extras === 'object' && !Array.isArray(source.extras) ? source.extras : {}
  for (const field of NUMERIC_FIELDS) source[field] = Number.isFinite(Number(source[field])) ? Number(source[field]) : USER_DEFAULTS[field]
  for (const field of BOOLEAN_FIELDS) source[field] = Boolean(source[field])
  return source
}
function splitUserPatch(patch = {}) {
  const $set = { updatedAt: new Date() }
  const extras = {}
  for (const [key, value] of Object.entries(patch || {})) {
    if (key === 'id' || key === '_id' || key === 'createdAt' || key === 'updatedAt') continue
    if (key === 'extras' && value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [extraKey, extraValue] of Object.entries(value)) $set[`extras.${extraKey}`] = extraValue
    } else if (key in USER_DEFAULTS) {
      $set[key] = value instanceof Date ? value.getTime() : value
    } else {
      extras[key] = value instanceof Date ? value.getTime() : value
    }
  }
  for (const [key, value] of Object.entries(extras)) $set[`extras.${key}`] = value
  return $set
}

const userSchema = new mongoose.Schema({
  _id: { type: String, alias: 'id' },
  ...Object.fromEntries(Object.entries(USER_DEFAULTS).map(([key, value]) => [key, { type: mongoose.Schema.Types.Mixed, default: clone(value) }]))
}, { strict: false, timestamps: true, minimize: false, versionKey: false })
userSchema.index({ level: -1 })
userSchema.index({ coin: -1 })
userSchema.index({ bank: -1 })
userSchema.index({ premiumTime: 1 })
userSchema.index({ marry: 1 })

const recordSchema = new mongoose.Schema({
  section: { type: String, required: true, index: true },
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { strict: false, timestamps: true, minimize: false, versionKey: false })
recordSchema.index({ section: 1, key: 1 }, { unique: true })

export class MongoDatabase {
  constructor(_legacySqliteFilename = './src/database/database.sqlite', { uri = process.env.MONGODB_URI, dbName = process.env.MONGODB_DB_NAME } = {}) {
    if (!uri) throw new Error('MONGODB_URI es obligatorio para iniciar la base de datos MongoDB')
    this.uri = uri
    this.dbName = dbName
    this.connected = false
    this.userCache = new Map()
    this.userProxyCache = new Map()
    this.sectionCache = new Map()
    this.User = mongoose.models.User || mongoose.model('User', userSchema, 'users')
    this.Record = mongoose.models.DbRecord || mongoose.model('DbRecord', recordSchema, 'records')
    this.ready = this.connect()
    this.data = this._createDataFacade()
  }

  async connect() {
    try {
      if (mongoose.connection.readyState === 0) await mongoose.connect(this.uri, { ...DEFAULT_MONGO_OPTIONS, dbName: this.dbName })
      this.connected = true
      mongoose.connection.on('disconnected', () => { this.connected = false; console.error('[mongodb] conexión perdida; mongoose intentará reconectar') })
      mongoose.connection.on('reconnected', () => { this.connected = true; console.info('[mongodb] conexión restaurada') })
      return mongoose.connection
    } catch (error) {
      this.connected = false
      console.error('[mongodb] no se pudo conectar a MongoDB', error)
      throw error
    }
  }

  async read() { await this.ready; await this._warmupSections(); return this.data }
  async write() { await this.ready }
  async save() { return this.write() }
  async flush() { return this.write() }
  async close() { try { await mongoose.connection.close(false) } catch (error) { console.error('[mongodb] error cerrando conexión', error) } }

  async getUser(id) {
    if (!id || typeof id !== 'string') throw new TypeError('getUser requiere un id de usuario válido')
    await this.ready
    if (!this.userCache.has(id)) {
      const doc = await this.User.findByIdAndUpdate(id, { $setOnInsert: normalizeUser(id) }, { upsert: true, new: true, lean: true, setDefaultsOnInsert: true })
      this.userCache.set(id, normalizeUser(id, { ...doc, id: doc?._id || id }))
    }
    return this._userProxy(id)
  }

  async updateUser(id, patch = {}) {
    if (!id || typeof id !== 'string') throw new TypeError('updateUser requiere un id de usuario válido')
    await this.ready
    const doc = await this.User.findByIdAndUpdate(id, { $setOnInsert: normalizeUser(id), $set: splitUserPatch(patch) }, { upsert: true, new: true, lean: true, setDefaultsOnInsert: true })
    this.userCache.set(id, normalizeUser(id, { ...doc, id: doc?._id || id }))
    return this._userProxy(id)
  }

  async incrementUserField(id, field, delta) {
    await this.ready
    const value = Number(delta) || 0
    const update = NUMERIC_FIELDS.has(field) ? { $inc: { [field]: value }, $setOnInsert: normalizeUser(id), $set: { updatedAt: new Date() } } : { $set: { [`extras.${field}`]: ((await this.getUser(id))[field] || 0) + value } }
    const doc = await this.User.findByIdAndUpdate(id, update, { upsert: true, new: true, lean: true, setDefaultsOnInsert: true })
    this.userCache.set(id, normalizeUser(id, { ...doc, id: doc?._id || id }))
    return this._userProxy(id)
  }
  async addMoney(id, amount, field = 'coin') { return this.incrementUserField(id, field, amount) }
  async addEconomy(id, fieldOrAmount, maybeAmount) { return typeof fieldOrAmount === 'string' ? this.addMoney(id, maybeAmount, fieldOrAmount) : this.addMoney(id, fieldOrAmount, maybeAmount || 'coin') }
  async setEconomy(id, field, value) { return this.updateUser(id, { [field]: value }) }
  async userExists(id) { await this.ready; return Boolean(await this.User.exists({ _id: id })) }
  async listUsers() { await this.ready; const rows = await this.User.find({}).lean(); return Object.fromEntries(rows.map(row => [row._id, normalizeUser(row._id, row)])) }

  _userProxy(id) {
    if (this.userProxyCache.has(id)) return this.userProxyCache.get(id)
    const proxy = new Proxy({}, {
      get: (_target, prop) => {
        if (INTERNAL_PROPS.has(prop)) return undefined
        if (prop === 'id') return id
        if (prop === 'toJSON') return () => clone(this.userCache.get(id) || {})
        const user = this.userCache.get(id) || normalizeUser(id)
        return Object.prototype.hasOwnProperty.call(user, prop) ? user[prop] : user.extras?.[prop]
      },
      set: (_target, prop, value) => {
        if (typeof prop !== 'string') return false
        const user = normalizeUser(id, this.userCache.get(id))
        if (prop in USER_DEFAULTS) user[prop] = value
        else user.extras[prop] = value
        this.userCache.set(id, user)
        this.updateUser(id, { [prop]: value }).catch(error => console.error(`[mongodb] no se pudo persistir usuario ${id}`, error))
        return true
      },
      deleteProperty: (_target, prop) => {
        if (typeof prop !== 'string') return false
        const unset = prop in USER_DEFAULTS ? { [prop]: USER_DEFAULTS[prop] } : { extras: { [prop]: undefined } }
        this.updateUser(id, unset).catch(error => console.error(`[mongodb] no se pudo borrar campo ${prop} de ${id}`, error))
        return true
      },
      ownKeys: () => Object.keys(this.userCache.get(id) || normalizeUser(id)),
      getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true })
    })
    this.userProxyCache.set(id, proxy)
    return proxy
  }

  async getChat(id) { const chat = await this.get('chats', id); return this.normalizeChatDefaults(chat || {}) }
  async updateChat(id, patch = {}) { const chat = this.normalizeChatDefaults({ ...(await this.getChat(id)), ...(patch || {}) }); await this.set('chats', id, chat); return chat }
  normalizeChatDefaults(chat = {}) {
    if (typeof chat.welcome === 'undefined') chat.welcome = true
    if (typeof chat.antiLink === 'undefined') chat.antiLink = true
    if (typeof chat.antilink === 'undefined') chat.antilink = true
    if (typeof chat.detect === 'undefined') chat.detect = true
    if (!chat.botSettings || typeof chat.botSettings !== 'object') chat.botSettings = {}
    if (chat.isBanned === true) chat.isBanned = { '*': true }
    else if (!chat.isBanned || typeof chat.isBanned !== 'object') chat.isBanned = {}
    chat.bannedBots = Object.entries(chat.botSettings).filter(([, value]) => value?.isBanned === true).map(([jid]) => jid)
    return chat
  }

  async getSection(section) { if (section === 'users') return this.listUsers(); await this.ready; const rows = await this.Record.find({ section }).lean(); return Object.fromEntries(rows.map(row => [row.key, row.value])) }
  async replaceSection(section, values = {}) { await this.ready; await this.Record.deleteMany({ section }); if (!Object.keys(values || {}).length) return; await this.Record.bulkWrite(Object.entries(values).map(([key, value]) => ({ updateOne: { filter: { section, key }, update: { $set: { value } }, upsert: true } })), { ordered: false }) }
  async get(section, id) { if (section === 'users') return this.getUser(id); await this.ready; const cached = this.sectionCache.get(`${section}:${id}`); if (cached !== undefined) return cached; const row = await this.Record.findOne({ section, key: id }).lean(); const value = row?.value; this.sectionCache.set(`${section}:${id}`, value); return value }
  async set(section, id, value) { if (section === 'users') return this.updateUser(id, value); await this.ready; this.sectionCache.set(`${section}:${id}`, value); await this.Record.updateOne({ section, key: id }, { $set: { value } }, { upsert: true }) }
  async has(section, id) { if (section === 'users') return this.userExists(id); return (await this.get(section, id)) !== undefined }
  async delete(section, id) { if (section === 'users') { this.userCache.delete(id); this.userProxyCache.delete(id); return this.User.deleteOne({ _id: id }) } this.sectionCache.delete(`${section}:${id}`); return this.Record.deleteOne({ section, key: id }) }

  async _warmupSections() { for (const section of SECTION_COLLECTIONS) this.data[section] ||= this._sectionFacade(section) }
  _createDataFacade() { return { users: this._sectionFacade('users'), chats: this._sectionFacade('chats'), settings: this._sectionFacade('settings'), stats: this._sectionFacade('stats'), msgs: this._sectionFacade('msgs'), sticker: this._sectionFacade('sticker'), sessions: this._sectionFacade('sessions'), codes: this._sectionFacade('codes') } }
  _sectionFacade(section) { return new Proxy({}, { get: (_target, id) => { if (INTERNAL_PROPS.has(id)) return undefined; if (id === 'toJSON') return () => this.getSection(section); if (typeof id !== 'string') return undefined; return this.get(section, id) }, set: (_target, id, value) => { if (typeof id !== 'string') return false; this.set(section, id, value).catch(error => console.error(`[mongodb] no se pudo persistir ${section}:${id}`, error)); return true }, deleteProperty: (_target, id) => { if (typeof id !== 'string') return false; this.delete(section, id).catch(error => console.error(`[mongodb] no se pudo borrar ${section}:${id}`, error)); return true }, ownKeys: () => [], getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }) }) }

  async getGroup(id) { return this.get('groups', id) }
  async upsertGroupMetadata(id, metadata = {}) { const payload = { ...(metadata || {}), id }; await this.set('groups', id, payload); return payload }
  async listGroups() { return this.getSection('groups') }
  async getMarriages(groupId = 'global') { return (await this.get('marriages', groupId)) || {} }
  async replaceMarriages(values = {}, groupId = 'global') { return this.set('marriages', groupId, values) }
  async setMarriagePair(userId, partnerId, date = now(), groupId = 'global') { const current = await this.getMarriages(groupId); current[userId] = { partner: partnerId, date }; current[partnerId] = { partner: userId, date }; await Promise.all([this.replaceMarriages(current, groupId), this.updateUser(userId, { marry: partnerId }), this.updateUser(partnerId, { marry: userId })]); return current }
  async divorcePair(userId, groupId = 'global') { const current = await this.getMarriages(groupId); const partnerId = current[userId]?.partner || ''; delete current[userId]; if (partnerId) delete current[partnerId]; await Promise.all([this.replaceMarriages(current, groupId), this.updateUser(userId, { marry: '' }), partnerId ? this.updateUser(partnerId, { marry: '' }) : Promise.resolve()]); return partnerId }
  async getHarem() { return Object.values(await this.getSection('harem')) }
  async replaceHarem(list = []) { return this.replaceSection('harem', Object.fromEntries(list.map(e => [`${e.groupId}:${e.characterId}`, e]))) }
  async upsertHaremClaim(e) { return this.set('harem', `${e.groupId}:${e.characterId}`, e) }
  async getGachaMarket(groupId = '') { const all = Object.values(await this.getSection('gacha_market')); return groupId ? all.filter(e => e.groupId === groupId || e.group_id === groupId) : all }
  async replaceGachaMarket(list = []) { return this.replaceSection('gacha_market', Object.fromEntries(list.map(e => [`${e.groupId || e.group_id || 'global'}:${e.id || e.characterId}`, e]))) }
  async addGachaMarketSale(e) { const payload = { ...e, idSale: e.idSale || now(), groupId: e.groupId || e.group_id || 'global', characterId: e.characterId || e.id }; await this.set('gacha_market', `${payload.groupId}:${payload.characterId}`, payload); return payload }
  async removeGachaMarketSale(groupId, characterId) { const key = `${groupId}:${characterId}`; const sale = await this.get('gacha_market', key); await this.delete('gacha_market', key); return sale || null }

  syncCharactersFts() { return 0 }
  searchCharacter(query, { limit = 10 } = {}) {
    const file = findCharactersFile()
    if (!file) return []
    const term = normalizeSearchText(query)
    if (!term) return []
    const rows = JSON.parse(readFileSync(file, 'utf8'))
    return (Array.isArray(rows) ? rows : Object.values(rows || {})).filter(character => normalizeSearchText([character.id, character.name, character.anime, character.source, ...(character.aliases || []), ...(character.tags || [])].join(' ')).includes(term)).slice(0, Math.min(Math.max(Number(limit) || 10, 1), 50)).map(character => ({ id: String(character.id || ''), name: character.name || '', anime: character.anime || character.source || '', score: 0 }))
  }
  async snapshot() { return { users: await this.listUsers(), marriages: await this.getSection('marriages'), harem: await this.getSection('harem'), gacha_market: await this.getSection('gacha_market'), claim_config: await this.getSection('claim_config'), character_favorites: await this.getSection('character_favorites') } }
}

export { MongoDatabase as DbManager }
export default MongoDatabase
