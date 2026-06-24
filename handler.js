import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { smsg } from './lib/simple.js'
import { format } from 'util'
import * as ws from 'ws'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import failureHandler from './lib/respuesta.js'
import {
buildPermissionContext,
createParticipantIndex,
getCachedGroupMetadata,
allHooks,
beforeHooks,
commandsMap,
getPluginDirectory,
getPrefixMatch,
hydrateDatabaseForMessage,
isNumber,
normalizeLidReferences,
runMaintenance,
} from './src/core/handler-utils.js'
import { getAntiPrivateState, isChatBannedForBot, normalizeSessionJid } from './src/core/session-utils.js'
import { attachSessionState } from './src/core/session-manager.js'
import messageQueue from './src/core/message-queue.js'
import { getCooldownKey, getCooldownSeconds, isRedisReady, redis } from './lib/redis.js'

global.uptimeStart = Date.now()

const SYSTEM_MESSAGE_MAX_AGE_MS = 60_000
const IGNORED_BAILEYS_IDS = [/^NJX-/, /^BAE5.{12}$/, /^B24E.{16}$/]
const UNBAN_COMMAND_FILES = ['grupo-unbanchat.js', 'enable/grupo-unbanchat.js']

function getIncomingMessages(chatUpdate) {
return Array.isArray(chatUpdate?.messages) ? chatUpdate.messages.filter(Boolean) : []
}

function getQueueKey(message) {
return message?.key?.participant || message?.participant || message?.key?.remoteJid || message?.chat || 'unknown'
}

function isFreshMessage(message) {
const rawTimestamp = Number(message?.messageTimestamp || 0)
const messageTime = rawTimestamp > 0 ? rawTimestamp * 1000 : Date.now()
return Date.now() - messageTime <= SYSTEM_MESSAGE_MAX_AGE_MS
}

function shouldIgnoreBaileysMessage(m) {
if (!m?.fromMe && !m?.isBaileys) return false
const id = m?.id || m?.key?.id || ''
return IGNORED_BAILEYS_IDS.some((pattern) => pattern.test(id))
}


function normalizeConnectionJid(conn) {
return normalizeSessionJid(conn)
}

async function normalizeJidForDatabase(conn, jid, participantsByLid = null) {
if (!jid || typeof jid !== 'string') return jid
let normalized = jidNormalizedUser(jid) || jid
if (normalized.endsWith('@lid') || normalized.endsWith('@hosted.lid')) {
const participant = participantsByLid?.get?.(normalized) || participantsByLid?.get?.(jid)
if (participant?.jid) normalized = jidNormalizedUser(participant.jid) || participant.jid
else {
const mapped = await conn?.signalRepository?.lidMapping?.getPNForLID?.(normalized).catch(() => null)
if (mapped) normalized = jidNormalizedUser(mapped) || mapped
}
}
return normalized
}

async function normalizeMessageIdentifiers(conn, m, sender, participantsByLid = null) {
const normalizedSender = await normalizeJidForDatabase(conn, sender, participantsByLid)
if (m?.key?.participant) m.key.participant = await normalizeJidForDatabase(conn, m.key.participant, participantsByLid)
if (m?.participant) m.participant = await normalizeJidForDatabase(conn, m.participant, participantsByLid)
if (m?.sender) {
try { m.sender = await normalizeJidForDatabase(conn, m.sender, participantsByLid) } catch {}
}
if (m?.chat && !m.chat.endsWith('@g.us') && !m.chat.endsWith('@broadcast')) {
try { m.chat = await normalizeJidForDatabase(conn, m.chat, participantsByLid) } catch {}
if (m?.key?.remoteJid) m.key.remoteJid = m.chat
}
if (m?.quoted?.sender) {
const quotedSender = await normalizeJidForDatabase(conn, m.quoted.sender, participantsByLid)
try { m.quoted.sender = quotedSender } catch {}
if (m.quoted.key?.participant) m.quoted.key.participant = quotedSender
}
if (Array.isArray(m?.mentionedJid)) {
const mentionedJid = []
for (const jid of m.mentionedJid) mentionedJid.push(await normalizeJidForDatabase(conn, jid, participantsByLid))
try { m.mentionedJid = mentionedJid } catch {}
}
return normalizedSender
}

function pluginNeedsJob(plugin, name, command) {
const tags = Array.isArray(plugin?.tags) ? plugin.tags.map((tag) => String(tag).toLowerCase()) : []
const economyTagged = tags.some((tag) => ['economy', 'economia', 'rpg'].includes(tag)) || String(name || '').startsWith('rpg-')
if (!economyTagged) return false
return !['trabajo', 'job', 'empleo'].includes(String(command || '').toLowerCase())
}

function userHasJob(user) {
const job = String(user?.job || '').trim().toLowerCase()
return Boolean(job && !['ninguno', 'none', 'null', 'undefined', 'sin trabajo'].includes(job))
}

function pluginUsesRedisCooldown(plugin) {
return Boolean(getCooldownSeconds(plugin))
}

async function validateRedisCooldown(conn, plugin, name, m, command, sender) {
if (!pluginUsesRedisCooldown(plugin)) return true
if (!isRedisReady()) return true
const key = getCooldownKey(command || name, sender)
try {
const ttl = await redis.ttl(key)
if (ttl > 0) {
const minutes = Math.floor(ttl / 60)
const remainingSeconds = ttl % 60
conn.reply(m.chat, `✧ Ese comando está en cooldown. Vuelve en *${minutes} minutos y ${remainingSeconds} segundos*.`, m)
return false
}
return true
} catch (error) {
console.error('[redis] cooldown read error', error)
return true
}
}

async function applyRedisCooldown(plugin, name, command, sender) {
if (!pluginUsesRedisCooldown(plugin)) return
if (!isRedisReady()) return
const seconds = getCooldownSeconds(plugin)
const key = getCooldownKey(command || name, sender)
try {
await redis.set(key, '1', 'EX', seconds)
} catch (error) {
console.error('[redis] cooldown write error', error)
}
}

function parseCommand(text, usedPrefix) {
const noPrefix = text.replace(usedPrefix, '')
const parts = noPrefix.trim().split` `.filter(Boolean)
const [rawCommand, ...args] = parts
const _args = noPrefix.trim().split` `.slice(1)
return {
noPrefix,
args,
_args,
text: _args.join` `,
command: (rawCommand || '').toLowerCase(),
}
}

async function runPluginHooks(conn, plugin, name, m, context) {
if (typeof plugin?.all === 'function') {
try {
await plugin.all.call(conn, m, context)
} catch (error) {
console.error(error)
}
}
}

function sanitizeError(error) {
let text = format(error)
for (const key of Object.values(global.APIKeys || {})) text = text.replace(new RegExp(key, 'g'), 'Administrador')
return text
}

async function executePlugin(conn, plugin, name, m, extra, permissionContext, sender) {
const { isROwner, isOwner, isMods, isPrems, isAdmin, isBotAdmin } = permissionContext
const fail = plugin.fail || global.dfail
const chat = global.db?.data?.chats?.[m.chat]
const user = global.db?.data?.users?.[sender]

if (m.isGroup && !UNBAN_COMMAND_FILES.includes(name) && isChatBannedForBot(chat, normalizeConnectionJid(conn)) && !isROwner) return true
if (m.text && user?.banned && !isROwner) {
if (!user.lastBanMsg || Date.now() - user.lastBanMsg > 30_000) {
m.reply(`《✦》Estas baneado/a, no puedes usar comandos en este bot!\n\n${user.bannedReason ? `✰ *Motivo:* ${user.bannedReason}` : '✰ *Motivo:* Sin Especificar'}\n\n> ✧ Si este Bot es cuenta ...`)
global.db?.updateUser?.(sender, { lastBanMsg: Date.now() })
}
return true
}
if (user?.antispam && !user.banned) user.antispam = 0

const adminMode = chat?.modoadmin
if (adminMode && m.isGroup && !isAdmin && !isOwner && !isROwner) return true
if (plugin.botAdmin && !isBotAdmin) { fail('botAdmin', m, conn); return false }
if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { fail('owner', m, conn); return false }
if (plugin.rowner && !isROwner) { fail('rowner', m, conn); return false }
if (plugin.owner && !isOwner) { fail('owner', m, conn); return false }
if (plugin.mods && !isMods) { fail('mods', m, conn); return false }
if (plugin.premium && !isPrems) { fail('premium', m, conn); return false }
if (plugin.admin && !isAdmin) { fail('admin', m, conn); return false }
if (plugin.private && m.isGroup) { fail('private', m, conn); return false }
if (plugin.group && !m.isGroup) { fail('group', m, conn); return false }
if (pluginNeedsJob(plugin, name, extra.command) && !userHasJob(user)) {
conn.reply(m.chat, `💼 Primero debes elegir una chamba. Usa *${extra.usedPrefix}trabajo lista* y luego *${extra.usedPrefix}trabajo elegir <trabajo>* para desbloquear la economía RPG.`, m)
return false
}

m.isCommand = true
const xp = 'exp' in plugin ? parseInt(plugin.exp) : 17
if (xp > 200) m.reply('chirrido -_-')
else m.exp += xp

if (!isPrems && plugin.coin && (global.db?.data?.users?.[sender]?.coin || 0) < plugin.coin * 1) {
conn.reply(m.chat, `❮✦❯ Se agotaron tus ${m.moneda}`, m)
return false
}
if (plugin.level > (user?.level || 0)) {
conn.reply(m.chat, `❮✦❯ Se requiere el nivel: *${plugin.level}*\n\n• Tu nivel actual es: *${user?.level || 0}*\n\n• Usa este comando para subir de nivel:\n*${extra.usedPrefix}levelup*`, m)
return false
}

if (!await validateRedisCooldown(conn, plugin, name, m, extra.command, sender)) return false

let pluginResult
try {
pluginResult = await plugin.call(conn, m, extra)
if (pluginResult !== false && !m.error) await applyRedisCooldown(plugin, name, extra.command, sender)
if (!isPrems) m.coin = m.coin || plugin.coin || false
} catch (error) {
m.error = error
console.error(error)
if (error) m.reply(sanitizeError(error))
} finally {
if (typeof plugin.after === 'function') {
try {
await plugin.after.call(conn, m, extra)
} catch (error) {
console.error(error)
}
}
if (m.coin) conn.reply(m.chat, `❮✦❯ Utilizaste ${+m.coin} ${m.moneda}`, m)
}
return true
}

function isUserMutedInChat(user, chatId) {
if (!user || !chatId) return false
if (user.mutedChats?.[chatId] === true) return true
return user.muto === true && (!user.mutoChat || user.mutoChat === chatId)
}

function getMessageDeletePayload(m, sender) {
const key = m?.__deleteKey || m?.key || {}
const id = key.id || m?.id
const remoteJid = key.remoteJid || m?.chat
if (!id || !remoteJid) return null
const payload = { remoteJid, fromMe: Boolean(key.fromMe), id }
const participant = key.participant || m?.participant || sender
if (m?.isGroup && participant) payload.participant = participant
return payload
}

async function updateStatsAndEconomy(conn, m, sender) {
const data = global.db?.data
if (!data || !m) return
const mutedUser = data.users?.[sender]
if (m.isGroup && isUserMutedInChat(mutedUser, m.chat)) {
const deletePayload = getMessageDeletePayload(m, sender)
if (deletePayload) conn.sendMessage?.(m.chat, { delete: deletePayload }).catch(() => {})
}
if (sender) {
const current = global.db?.getUser?.(sender)
if (current) global.db.updateUser(sender, {
exp: (Number(current.exp) || 0) + (m.exp || 0),
coin: (Number(current.coin) || 0) - ((m.coin || 0) * 1)
})
}
if (!m.plugin) return
const stats = data.stats ||= {}
const now = Date.now()
const stat = stats[m.plugin] ||= { total: 0, success: 0, last: now, lastSuccess: 0 }
if (!isNumber(stat.total)) stat.total = 0
if (!isNumber(stat.success)) stat.success = 0
if (!isNumber(stat.last)) stat.last = now
if (!isNumber(stat.lastSuccess)) stat.lastSuccess = 0
stat.total += 1
stat.last = now
if (m.error == null) {
stat.success += 1
stat.lastSuccess = now
}
}

export async function handler(chatUpdate) {
attachSessionState(this)
runMaintenance(this)
const messages = getIncomingMessages(chatUpdate).filter(isFreshMessage)
if (!messages.length) return
this.pushMessage?.(messages).catch(console.error)
if (global.db && global.db.data == null) await global.loadDatabase?.()
for (const rawMessage of messages) {
const key = getQueueKey(rawMessage)
messageQueue.enqueue(key, () => processMessage.call(this, chatUpdate, rawMessage))
}
}

async function processMessage(chatUpdate, rawMessage) {
let m = null
let sender = null
try {
m = smsg(this, rawMessage) || rawMessage
if (!m) return
const opts = this.opts || global.opts || {}
if (typeof m.text !== 'string') m.text = ''

if (m.isGroup) {
const chat = global.db?.data?.chats?.[m.chat]
const primaryBot = chat?.primaryBot || chat?.botPrimario
if (primaryBot) {
const universalWords = ['resetbot', 'resetprimario', 'botreset']
const firstWord = m.text.trim().split(' ')[0]?.toLowerCase().replace(/^[./#]/, '') || ''
const currentBot = normalizeConnectionJid(this)
if (!universalWords.includes(firstWord) && currentBot !== primaryBot) return
}
}

sender = m.isGroup ? (m.key?.participant || m.sender) : (m.key?.remoteJid || m.sender)
if (!sender) return
m.__deleteKey = m.key ? { ...m.key } : null
const groupMetadata = m.isGroup ? await getCachedGroupMetadata(this, m.chat) : {}
const participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
const participantsByLid = m.isGroup ? createParticipantIndex(participants) : null
sender = normalizeLidReferences(m, sender, participantsByLid)
sender = await normalizeMessageIdentifiers(this, m, sender, participantsByLid)

m.exp = 0
m.coin = false
const { user: _user, settings } = hydrateDatabaseForMessage(this, m, sender)

if (opts.nyimak) return
if (!m.fromMe && opts.self) return
if (opts.swonly && m.chat !== 'status@broadcast') return

const permissionContext = buildPermissionContext(this, m, sender, participants)
const { userGroup, botGroup, isRAdmin, isAdmin, isBotAdmin, isROwner, isOwner, isMods, isPrems } = permissionContext
if (!m.isGroup && !isROwner && !isOwner) {
const botSettings = global.db?.data?.settings?.[normalizeConnectionJid(this)] || settings || {}
const antiPrivateState = getAntiPrivateState(botSettings)
if (antiPrivateState === 'ignore') return
if (antiPrivateState === 'block') {
await this.updateBlockStatus?.(sender, 'block').catch(() => {})
return
}
}
m.moneda = settings?.moneda || 'Coins'
m.exp += Math.ceil(Math.random() * 10)

const pluginDir = getPluginDirectory()
const prefixMatch = getPrefixMatch(this, {}, m.text)
const parsed = prefixMatch?.[0]?.[0] ? parseCommand(m.text, prefixMatch[0][0]) : null
const commandEntry = parsed?.command ? commandsMap.get(parsed.command) : null
for (const hook of global.allHooks || allHooks || []) {
const { name, plugin } = hook || {}
if (!plugin || plugin.disabled) continue
const __filename = join(pluginDir, name)
const baseContext = { chatUpdate, __dirname: pluginDir, __filename }
await runPluginHooks(this, plugin, name, m, baseContext)
if (m.__pluginHalt) return
}
for (const hook of global.beforeHooks || beforeHooks || []) {
const { name, plugin } = hook || {}
if (!plugin || plugin.disabled) continue
if (!opts.restrict && plugin.tags?.includes?.('admin')) continue
const __filename = join(pluginDir, name)
const match = getPrefixMatch(this, plugin, m.text)
const beforeContext = { match, conn: this, participants, groupMetadata, user: userGroup, bot: botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: pluginDir, __filename }
const beforeResult = await plugin.before.call(this, m, beforeContext)
if (m.__pluginHalt) return
if (beforeResult && commandEntry?.name === name) return
if (m.__pluginHalt) return
}
if (!commandEntry) {
if (shouldIgnoreBaileysMessage(m)) return
return
}
const { name, plugin } = commandEntry
if (!plugin || plugin.disabled || typeof plugin !== 'function') return
const match = getPrefixMatch(this, plugin, m.text)
if (!match?.[0]?.[0]) return
const usedPrefix = match[0][0]
const commandParsed = parseCommand(m.text, usedPrefix)
const mappedEntry = commandsMap.get(commandParsed.command)
if (mappedEntry?.plugin !== plugin) return
global.comando = commandParsed.command
if (shouldIgnoreBaileysMessage(m)) return
m.plugin = name
const chatData = global.db?.data?.chats?.[m.chat] || {}
const isBotBannedInThisChat = isChatBannedForBot(chatData, normalizeConnectionJid(this))
if (isBotBannedInThisChat && !UNBAN_COMMAND_FILES.includes(name)) return
const __filename = join(pluginDir, name)
const extra = { match, usedPrefix, ...commandParsed, conn: this, participants, groupMetadata, user: userGroup, bot: botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: pluginDir, __filename }
await executePlugin(this, plugin, name, m, extra, permissionContext, sender)
} catch (error) {
console.error(error)
} finally {
try {
await updateStatsAndEconomy(this, m, sender)
} catch (error) {
console.error(error)
}
try {
if (!((this.opts || global.opts || {}).noprint) && m) await (await import('./lib/print.js')).default(m, this)
} catch (error) {
console.log(chalk.red('Error en print.js'), error)
}
}
}

global.dfail = (type, m, conn) => { failureHandler(type, conn, m) }

const file = typeof global.__filename === 'function' ? global.__filename(import.meta.url, true) : fileURLToPath(import.meta.url)
watchFile(file, async () => {
unwatchFile(file)
console.log(chalk.green('Actualizando "handler.js"'))
if (global.conns?.length > 0) {
const users = [...new Set(global.conns.filter((conn) => conn.user && conn.ws?.socket && conn.ws.socket.readyState !== ws.CLOSED))]
for (const userr of users) {
try { userr.subreloadHandler(false) } catch {}
}
}
})
