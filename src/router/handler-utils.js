import { join } from 'path'
import { fileURLToPath } from 'url'
import { TTLCache, getPrefixMatcherCache } from '../library/optimizer.js'
import { chatDefault, ensureDatabaseShape, ensureRecord, settingsDefault, userDefault } from '../core/defaults.js'

export const GROUP_METADATA_TTL = 10 * 60 * 1000
export const GROUP_METADATA_MAX = 2000
export const GROUP_METADATA_MIN_INTERVAL = 45 * 1000

export const isNumber = (x) => typeof x === 'number' && Number.isFinite(x)

export function normalizeParticipant(participant = {}) {
return {
...participant,
id: participant?.jid || participant?.id,
jid: participant?.jid || participant?.id,
lid: participant?.lid,
admin: participant?.admin ?? null,
}
}

export async function getCachedGroupMetadata(conn, chatId, { force = false } = {}) {
if (!conn || !chatId) return {}
conn.__groupMetadataCache ||= new TTLCache(GROUP_METADATA_TTL, GROUP_METADATA_MAX)
conn.__groupMetadataInflight ||= new Map()
const cached = !force ? (conn.__groupMetadataCache.get(chatId) || global.db?.getGroup?.(chatId)) : (global.db?.getGroup?.(chatId) || conn.__groupMetadataCache.get(chatId))
if (!force && cached?.id && Date.now() - Number(cached.__cachedAt || cached.updatedAt || 0) < GROUP_METADATA_TTL) return cached
conn.__groupMetadataLastFetch ||= new Map()
const lastFetch = Number(conn.__groupMetadataLastFetch.get(chatId) || 0)
if (!force && cached?.id && Date.now() - lastFetch < GROUP_METADATA_MIN_INTERVAL) return cached
if (conn.__groupMetadataInflight.has(chatId)) return conn.__groupMetadataInflight.get(chatId)
conn.__groupMetadataLastFetch.set(chatId, Date.now())
const fetchGroupMetadata = conn.__rawGroupMetadata || conn.groupMetadata?.bind(conn)
const request = Promise.resolve(fetchGroupMetadata?.(chatId)).then((metadata) => {
metadata ||= cached || {}
metadata.participants = normalizeParticipantList(metadata?.participants)
metadata.__cachedAt = Date.now()
conn.__groupMetadataCache.set(chatId, metadata)
global.db?.upsertGroupMetadata?.(chatId, metadata)
return metadata
}).catch((error) => {
const code = error?.output?.statusCode || error?.data?.statusCode || error?.statusCode
if ([408, 428, 429].includes(Number(code))) conn.__groupMetadataLastFetch.set(chatId, Date.now() + GROUP_METADATA_MIN_INTERVAL)
return cached || {}
}).finally(() => conn.__groupMetadataInflight.delete(chatId))
conn.__groupMetadataInflight.set(chatId, request)
return request
}

export function normalizeParticipantList(participants = []) {
if (Array.isArray(participants)) return participants.filter(Boolean).map(normalizeParticipant)
if (participants && typeof participants === 'object') return Object.values(participants).filter(Boolean).map(normalizeParticipant)
return []
}

export function createParticipantIndex(participants = []) {
const byLid = new Map()
for (const p of normalizeParticipantList(participants)) {
if (p?.lid) byLid.set(p.lid, p)
if (p?.lid && p.lid.endsWith('@lid')) byLid.set(p.lid.replace('@lid', '@hosted.lid'), p)
}
return byLid
}

export function sanitizeOwnerNumber(value = '') {
return String(value || '').split('@')[0].replace(/[^0-9]/g, '')
}

export function isAuthorizedOwner(sender = '') {
const senderNum = sanitizeOwnerNumber(sender)
if (!senderNum) return false
return (global.owner || []).some((owner) => {
const number = Array.isArray(owner) ? owner[0] : owner
return sanitizeOwnerNumber(number) === senderNum
})
}

export function normalizeLidReferences(m, sender, participantsByLid) {
let normalizedSender = sender
if (!m?.isGroup || !participantsByLid) return normalizedSender
if (normalizedSender?.endsWith?.('@lid')) {
const pInfo = participantsByLid.get(normalizedSender)
if (pInfo?.jid) {
normalizedSender = pInfo.jid
if (m.key) m.key.participant = pInfo.jid
try { m.sender = pInfo.jid } catch {}
}
}
if (m.quoted?.sender?.endsWith?.('@lid')) {
const pInfo = participantsByLid.get(m.quoted.sender)
if (pInfo?.jid) {
if (m.quoted.key) m.quoted.key.participant = pInfo.jid
try { m.quoted.sender = pInfo.jid } catch {}
}
}
if (Array.isArray(m.mentionedJid) && m.mentionedJid.length > 0) {
const normalizedMentions = m.mentionedJid.map((jid) => {
if (jid?.endsWith?.('@lid')) return participantsByLid.get(jid)?.jid || jid
return jid
})
try { m.mentionedJid = normalizedMentions } catch {}
}
return normalizedSender
}

export function hydrateDatabaseForMessage(conn, m, sender) {
const data = ensureDatabaseShape(global.db)
const botJid = 'primary'
const settings = ensureRecord(data.settings, botJid, settingsDefault)
const chat = m?.chat ? ensureRecord(data.chats, m.chat, chatDefault) : {}
if (!sender || typeof sender !== 'string') return { data, user: {}, chat, settings }
// `getUser()` lanza si el id no es normalizable (LID sin mapeo + basura). Antes esto
// se propagaba hasta el pipeline y mataba el mensaje entero de forma silenciosa.
let currentUser = {}
try {
currentUser = global.db?.getUser?.(sender) || data.users?.[sender] || {}
} catch (error) {
console.error('[db-bridge] getUser fallo para', sender, error?.message || error)
currentUser = data.users?.[sender] || {}
}
const safeUser = currentUser && typeof currentUser === 'object' ? currentUser : {}
const whatsappName = String(m?.pushName || m?.name || safeUser?.name || '').trim()
const user = ensureRecord(data.users, sender, userDefault, { name: whatsappName || safeUser?.name || userDefault.name })
if (user && typeof user === 'object') {
if (user.registered !== true) user.registered = true
if (whatsappName && !user.customName && user.name !== whatsappName) user.name = whatsappName
}
return { data, user: user && typeof user === 'object' ? user : {}, chat, settings }
}

export function normalizeAdmin(participant) {
const admin = participant?.admin ?? false
if (admin === true || admin === 'admin') return 'admin'
if (['creator', 'superadmin', 'owner'].includes(admin)) return 'superadmin'
return false
}

export function buildPermissionContext(conn, m, sender, participants = []) {
participants = normalizeParticipantList(participants)
const decode = (jid) => conn?.decodeJid ? conn.decodeJid(jid) : jid
const sameIdentity = (candidate, target) => {
const decodedCandidate = decode(candidate)
const decodedTarget = decode(target)
const left = String(decodedCandidate || '').split('@')[0]
const right = String(decodedTarget || '').split('@')[0]
return Boolean(left && right && (decodedCandidate === decodedTarget || left === right))
}
const userGroup = (m?.isGroup ? participants.find((u) => sameIdentity(u?.jid, sender) || sameIdentity(u?.id, sender) || sameIdentity(u?.lid, sender)) : {}) || {}
const botJids = [conn?.user?.jid, conn?.user?.id, conn?.decodeJid?.(conn?.user?.jid), conn?.decodeJid?.(conn?.user?.id)].filter(Boolean)
const botGroup = (m?.isGroup ? participants.find((u) => botJids.some((botJid) => sameIdentity(u?.jid, botJid) || sameIdentity(u?.id, botJid) || sameIdentity(u?.lid, botJid))) : {}) || {}
const isRAdmin = normalizeAdmin(userGroup) === 'superadmin'
const isAdmin = isRAdmin || normalizeAdmin(userGroup) === 'admin'
const isBotAdmin = ['admin', 'superadmin'].includes(normalizeAdmin(botGroup))
const senderNum = sanitizeOwnerNumber(sender)
const isROwner = isAuthorizedOwner(sender)
const isOwner = isROwner
const isMods = (global.mods || []).map((v) => v.replace(/[^0-9]/g, '')).includes(senderNum)
const isPrems = (global.prems || []).map((v) => v.replace(/[^0-9]/g, '')).includes(senderNum) || global.db?.data?.users?.[sender]?.premium === true
return { userGroup, botGroup, isRAdmin, isAdmin, isBotAdmin, isROwner, isOwner, isMods, isPrems }
}

export function runMaintenance(conn) {
conn.msgqueque ||= []
conn.uptime ||= Date.now()
conn.__maintenanceAt ||= 0
if (Date.now() - conn.__maintenanceAt <= 60_000) return
conn.__maintenanceAt = Date.now()
conn.__groupMetadataCache?.clearExpired?.()
conn.__rubyReadMessagesLast?.clearExpired?.()
if (conn.__commandTesterCache?.size > 3000) conn.__commandTesterCache.clear()
if (conn.__prefixMatcherCache?.size > 2000) conn.__prefixMatcherCache.clear()
global.__rubyMessageQueue?.cleanup?.()
}


export const commandsMap = global.commandsMap ||= new Map()
export const beforeHooks = global.beforeHooks ||= []
export const allHooks = global.allHooks ||= []

function removeHookEntries(name) {
if (!name) return
for (let index = beforeHooks.length - 1; index >= 0; index--) if (beforeHooks[index]?.name === name) beforeHooks.splice(index, 1)
for (let index = allHooks.length - 1; index >= 0; index--) if (allHooks[index]?.name === name) allHooks.splice(index, 1)
}

export function registerPluginHooks(name, plugin) {
removeHookEntries(name)
if (!name || !plugin || plugin.disabled) return { beforeHooks, allHooks }
if (typeof plugin.before === 'function') beforeHooks.push({ name, plugin })
if (typeof plugin.all === 'function') allHooks.push({ name, plugin })
global.beforeHooks = beforeHooks
global.allHooks = allHooks
return { beforeHooks, allHooks }
}

export function unregisterPluginHooks(name) {
removeHookEntries(name)
global.beforeHooks = beforeHooks
global.allHooks = allHooks
return { beforeHooks, allHooks }
}

export function rebuildPluginHooks(plugins = global.plugins || {}) {
beforeHooks.length = 0
allHooks.length = 0
for (const [name, plugin] of Object.entries(plugins || {})) registerPluginHooks(name, plugin)
global.beforeHooks = beforeHooks
global.allHooks = allHooks
return { beforeHooks, allHooks }
}

export function getCommandKeys(pluginCommand) {
if (!pluginCommand) return []
if (typeof pluginCommand === 'string') return [pluginCommand.toLowerCase()]
if (Array.isArray(pluginCommand)) return pluginCommand.filter((cmd) => typeof cmd === 'string').map((cmd) => cmd.toLowerCase())
return []
}

export function rebuildCommandsMap(plugins = global.plugins || {}) {
commandsMap.clear()
for (const [name, plugin] of Object.entries(plugins || {})) {
if (!plugin || plugin.disabled) continue
for (const command of getCommandKeys(plugin.command)) commandsMap.set(command, { name, plugin })
}
global.commandsMap = commandsMap
return commandsMap
}

export function registerPluginCommands(name, plugin) {
if (!name) return commandsMap
for (const [command, entry] of commandsMap) if (entry?.name === name) commandsMap.delete(command)
if (!plugin || plugin.disabled) return commandsMap
for (const command of getCommandKeys(plugin.command)) commandsMap.set(command, { name, plugin })
global.commandsMap = commandsMap
return commandsMap
}

export function unregisterPluginCommands(name) {
if (!name) return commandsMap
for (const [command, entry] of commandsMap) if (entry?.name === name) commandsMap.delete(command)
global.commandsMap = commandsMap
return commandsMap
}

export function commandMatches(pluginCommand, command = '') {
if (!pluginCommand) return false
if (pluginCommand instanceof RegExp) {
pluginCommand.lastIndex = 0
return pluginCommand.test(command)
}
if (Array.isArray(pluginCommand)) {
return pluginCommand.some((cmd) => {
if (typeof cmd === 'string') return cmd === command
if (cmd instanceof RegExp) {
cmd.lastIndex = 0
return cmd.test(command)
}
return false
})
}
if (typeof pluginCommand === 'string') return pluginCommand === command
if (typeof pluginCommand === 'function') return pluginCommand(command)
return false
}

export function getCommandTester(conn, pluginName, pluginCommand) {
conn.__commandTesterCache ||= new Map()
const cache = conn.__commandTesterCache
const cacheKey = `${pluginName}:${typeof pluginCommand}`
let tester = cache.get(cacheKey)
if (tester?.__source === pluginCommand) return tester
tester = (command) => commandMatches(pluginCommand, command)
tester.__source = pluginCommand
cache.set(cacheKey, tester)
return tester
}

export const MENTION_TEXT_REGEX = /^@\d+/

export function isMentionText(text = '') {
return MENTION_TEXT_REGEX.test(String(text || '').trim())
}

export function getPrefixMatch(conn, plugin = {}, text = '') {
const rawText = String(text || '')
if (isMentionText(rawText)) return null
const str2Regex = (str) => String(str || '').replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
const prefixCache = getPrefixMatcherCache(conn)
const fallbackPrefix = /^[#/!.]/
const candidates = [plugin?.customPrefix, conn?.prefix, global.prefix, fallbackPrefix].filter(Boolean)
const normalize = (prefix) => Array.isArray(prefix) ? prefix : [prefix]
for (const source of candidates) {
for (const item of normalize(source)) {
try {
let re
if (item instanceof RegExp) {
const flags = item.flags.replace('g', '')
const cacheKey = `re:${item.source}:${flags}`
re = prefixCache.get(cacheKey)
if (!re) {
re = new RegExp(item.source, flags)
prefixCache.set(cacheKey, re)
}
} else if (typeof item === 'string' && item) {
const cacheKey = `str:${item}`
re = prefixCache.get(cacheKey)
if (!re) {
re = new RegExp(`^${str2Regex(item)}`)
prefixCache.set(cacheKey, re)
}
} else {
continue
}
re.lastIndex = 0
const match = re.exec(rawText)
if (!match?.[0]) continue
if (match[0].includes('@') && /^\d/.test(rawText.slice(match[0].length))) continue
return [match, re]
} catch (error) {
console.error('[UPSERT ERROR]:', error)
}
}
}
return null
}

export function getPluginDirectory() {
return join(fileURLToPath(new URL('..', import.meta.url)), 'modules')
}
