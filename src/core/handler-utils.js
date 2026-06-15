import { join } from 'path'
import { fileURLToPath } from 'url'
import { TTLCache, getPrefixMatcherCache } from '../../lib/optimizer.js'
import { chatDefault, ensureDatabaseShape, ensureRecord, settingsDefault, userDefault } from './defaults.js'

export const GROUP_METADATA_TTL = 60 * 1000
export const GROUP_METADATA_MAX = 2000

export const isNumber = (x) => typeof x === 'number' && Number.isFinite(x)

export function normalizeParticipant(participant = {}) {
return {
...participant,
id: participant?.jid || participant?.id,
jid: participant?.jid || participant?.id,
lid: participant?.lid,
admin: participant?.admin || participant?.isAdmin || participant?.role,
}
}

export async function getCachedGroupMetadata(conn, chatId) {
if (!conn || !chatId) return {}
conn.__groupMetadataCache ||= new TTLCache(GROUP_METADATA_TTL, GROUP_METADATA_MAX)
conn.__groupMetadataInflight ||= new Map()
const cached = conn.__groupMetadataCache.get(chatId)
if (cached) return cached
if (conn.__groupMetadataInflight.has(chatId)) return conn.__groupMetadataInflight.get(chatId)
const request = Promise.resolve(conn.groupMetadata?.(chatId)).then((metadata) => {
metadata ||= {}
if (Array.isArray(metadata?.participants)) metadata.participants = metadata.participants.map(normalizeParticipant)
conn.__groupMetadataCache.set(chatId, metadata)
return metadata
}).catch(() => cached || {}).finally(() => conn.__groupMetadataInflight.delete(chatId))
conn.__groupMetadataInflight.set(chatId, request)
return request
}

export function createParticipantIndex(participants = []) {
const byLid = new Map()
for (const p of participants) if (p?.lid) byLid.set(p.lid, p)
return byLid
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
const whatsappName = String(m?.pushName || m?.name || conn?.getName?.(sender) || '').trim()
const user = ensureRecord(data.users, sender, userDefault, { name: whatsappName || userDefault.name })
if (user.registered !== true) user.registered = true
if (whatsappName && !user.customName && user.name !== whatsappName) user.name = whatsappName
const chat = m?.chat ? ensureRecord(data.chats, m.chat, chatDefault) : {}
const botJid = conn?.user?.jid || conn?.session?.id || 'primary'
const settings = ensureRecord(data.settings, botJid, settingsDefault)
return { data, user, chat, settings }
}

export function normalizeAdmin(participant) {
const admin = participant?.admin ?? false
if (admin === true || admin === 'admin') return 'admin'
if (['creator', 'superadmin', 'owner'].includes(admin)) return 'superadmin'
return false
}

export function buildPermissionContext(conn, m, sender, participants = []) {
const decode = (jid) => conn?.decodeJid ? conn.decodeJid(jid) : jid
const userGroup = (m?.isGroup ? participants.find((u) => decode(u?.jid) === sender) : {}) || {}
const botGroup = (m?.isGroup ? participants.find((u) => decode(u?.jid) === conn?.user?.jid) : {}) || {}
const isRAdmin = normalizeAdmin(userGroup) === 'superadmin'
const isAdmin = isRAdmin || normalizeAdmin(userGroup) === 'admin'
const isBotAdmin = ['admin', 'superadmin'].includes(normalizeAdmin(botGroup))
const senderNum = String(sender || '').split('@')[0]
const isROwner = (global.owner || []).map(([number]) => number).includes(senderNum)
const isOwner = isROwner
const isMods = isOwner || (global.mods || []).map((v) => v.replace(/[^0-9]/g, '')).includes(senderNum)
const isPrems = isROwner || (global.prems || []).map((v) => v.replace(/[^0-9]/g, '')).includes(senderNum) || global.db?.data?.users?.[sender]?.premium === true
return { userGroup, botGroup, isRAdmin, isAdmin, isBotAdmin, isROwner, isOwner, isMods, isPrems }
}

export function runMaintenance(conn) {
conn.msgqueque ||= []
conn.uptime ||= Date.now()
conn.__maintenanceAt ||= 0
if (Date.now() - conn.__maintenanceAt <= 60_000) return
conn.__maintenanceAt = Date.now()
conn.__groupMetadataCache?.clearExpired?.()
if (conn.__commandTesterCache?.size > 3000) conn.__commandTesterCache.clear()
if (conn.__prefixMatcherCache?.size > 2000) conn.__prefixMatcherCache.clear()
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

export function getPrefixMatch(conn, plugin, text) {
const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
const prefixCache = getPrefixMatcherCache(conn)
const _prefix = plugin.customPrefix || conn.prefix || global.prefix
return (_prefix instanceof RegExp ? [[_prefix.exec(text), _prefix]]
: Array.isArray(_prefix) ? _prefix.map((p) => {
const cacheKey = p instanceof RegExp ? `re:${p.source}:${p.flags}` : `str:${p}`
let re = prefixCache.get(cacheKey)
if (!re) {
re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
prefixCache.set(cacheKey, re)
}
return [re.exec(text), re]
})
: typeof _prefix === 'string' ? (() => {
const cacheKey = `str:${_prefix}`
let re = prefixCache.get(cacheKey)
if (!re) {
re = new RegExp(str2Regex(_prefix))
prefixCache.set(cacheKey, re)
}
return [[re.exec(text), re]]
})() : [[[], new RegExp()]])
.find((p) => p[1])
}

export function getPluginDirectory() {
return join(fileURLToPath(new URL('../..', import.meta.url)), 'plugins')
}
