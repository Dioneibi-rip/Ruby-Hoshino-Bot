import { smsg } from '../library/simple.js'
import * as ws from 'ws'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { unwatchFile, watchFile } from 'fs'
import chalk from '../library/ansi.js'
import failureHandler from '../library/respuesta.js'
import welcomePlugin from '../commands/functions/_welcome.js'
import autodetectPlugin from '../commands/enable/_autodetect.js'
import {
buildPermissionContext,
createParticipantIndex,
allHooks,
beforeHooks,
commandsMap,
getPluginDirectory,
getPrefixMatch,
hydrateDatabaseForMessage,
isAuthorizedOwner,
isNumber,
normalizeLidReferences,
runMaintenance,
} from './handler-utils.js'
import { canManageBotSecurity, getAntiPrivateState, getPrimaryBotJid, isChatBannedForBot, isPrimaryBotForChat, normalizeSessionJid, resetChatBotRouting, shouldSilenceChatForBot } from '../core/session-utils.js'
import { attachSessionState, cleanupSessionState } from '../core/session-manager.js'
import messageQueue from '../core/message-queue.js'
import { normalizeIdentityJid, normalizeJid } from '../core/identity-utils.js'
import { getMessageDeletePayload, isUserMutedInChat, messageHasModeratedLink, runAutoModeration } from '../core/moderation-utils.js'
import { getGroupMetadataOnDemand } from '../library/global-cache.js'
import { getPersonalStickerCommand } from '../core/sticker-command-utils.js'
import { TTLCache } from '../library/native-utils.js'
import { getInteractiveResponseText, getRawCommandName, getRawFastPath as buildRawFastPath, getRawMessageChat, getRawMessageSender, getRawMessageText, getRawStickerHash, unwrapMessageContent } from './raw-filter.js'
import { executePlugin } from './plugin-executor.js'
import { isBotSender, pluginRequiresGroupParticipants } from './permission-guard.js'
import { getDbWorkerClient } from '../database/db-client.js'

global.uptimeStart = Date.now()

const SYSTEM_MESSAGE_MAX_AGE_MS = 60_000
const IGNORED_BAILEYS_IDS = [/^NJX-/, /^BAE5.{12}$/, /^B24E.{16}$/]
const UNBAN_COMMAND_FILES = ['grupo-unbanchat.js', 'enable/grupo-unbanchat.js', 'grupo-resetbot.js', 'enable/grupo-resetbot.js']
const CELESTIAL_COMMANDS = new Set(['resetbot', 'unbanchat', 'desbanearchat'])
const REALTIME_EVENT_GRACE_MS = 15_000
const REALTIME_EVENT_MAX_AGE_MS = 60_000
const READ_MESSAGE_MIN_INTERVAL_MS = 1_500
const PRIMARY_BOT_CACHE_TTL_SECONDS = Number(process.env.RUBY_PRIMARY_BOT_CACHE_TTL_SECONDS || 30 * 60)
const PRIMARY_BOT_CACHE_MAX = Number(process.env.RUBY_PRIMARY_BOT_CACHE_MAX || 5000)
const READ_MESSAGE_CACHE_TTL_SECONDS = Number(process.env.RUBY_READ_MESSAGE_CACHE_TTL_SECONDS || 2 * 60)
const READ_MESSAGE_CACHE_MAX = Number(process.env.RUBY_READ_MESSAGE_CACHE_MAX || 10000)
if (!(global.__rubyPrimaryBotCache instanceof TTLCache)) {
global.__rubyPrimaryBotCache = new TTLCache({ stdTTL: PRIMARY_BOT_CACHE_TTL_SECONDS, checkperiod: 120, useClones: false, max: PRIMARY_BOT_CACHE_MAX })
}
const PRIMARY_BOT_CACHE = global.__rubyPrimaryBotCache
const PRIMARY_BOT_EMPTY = ''
const CHAT_ACTIVITY_DEFAULT_MAX_USERS = Number(global.chatActivityMaxUsers || process.env.CHAT_ACTIVITY_MAX_USERS || 500)
const CHAT_ACTIVITY_DEFAULT_TTL_MS = Number(global.chatActivityTtlDays || process.env.CHAT_ACTIVITY_TTL_DAYS || 30) * 24 * 60 * 60 * 1000
const PARTICIPANT_INDEX_TTL_SECONDS = Math.max(5, Math.ceil(Number(global.participantIndexTtlMs || process.env.RUBY_PARTICIPANT_INDEX_TTL_MS || 30000) / 1000))
const PARTICIPANT_INDEX_MAX = Number(process.env.RUBY_PARTICIPANT_INDEX_MAX || 2000)

const TIMELOCK_COOLDOWN_SCOPE = 'timelock_cooldown'
const TIMELOCK_COOLDOWN_MS = 24 * 60 * 60 * 1000
const TIMELOCK_GUARD_PATCH = Symbol.for('ruby.timelockGuard.sendMessagePatch')
const PRIMARY_BOT_EGRESS_GUARD_PATCH = Symbol.for('ruby.primaryBot.egressGuardPatch')


const PRESENCE_STATES = new Set(['available', 'unavailable', 'composing', 'recording', 'paused'])

function canSendPresenceUpdate(conn, state, jid) {
if (conn === undefined || conn === null) return false
if (typeof conn.sendPresenceUpdate !== 'function') return false
if (state === undefined || !PRESENCE_STATES.has(state)) return false
if (jid === undefined || typeof jid !== 'string' || jid.length === 0) return false
if (conn.ev === undefined) return false
return true
}

function firePresenceUpdate(conn, state, jid) {
if (!canSendPresenceUpdate(conn, state, jid)) return
queueMicrotask(() => {
Promise.resolve(conn.sendPresenceUpdate(state, jid)).catch(() => {})
})
}

async function withCommandPresence(conn, m, run) {
const jid = m?.chat
firePresenceUpdate(conn, 'composing', jid)
try {
return await run()
} finally {
firePresenceUpdate(conn, 'paused', jid)
}
}

function extractErrorCode(value, seen = new WeakSet()) {
if (value == null) return ''
if (typeof value === 'number' || typeof value === 'string') {
const text = String(value)
return text.includes('463') ? '463' : ''
}
if (typeof value !== 'object') return ''
if (seen.has(value)) return ''
seen.add(value)
const direct = [value?.code, value?.status, value?.statusCode, value?.output?.statusCode, value?.data?.code, value?.error?.code]
if (direct.some((item) => String(item ?? '').includes('463'))) return '463'
const text = [value?.message, value?.stack, value?.name, value?.reason].filter(Boolean).join(' ')
if (text.includes('463') || /reachout\s+timelock/i.test(text)) return '463'
return ''
}

function normalizeTimelockJid(conn, jid = '') {
const decoded = conn?.decodeJid?.(jid) || jid
return normalizeJid(decoded) || String(decoded || '').trim()
}

async function setTimelockCooldown(conn, jid = '', source = {}) {
const normalizedJid = normalizeTimelockJid(conn, jid)
if (!normalizedJid || normalizedJid.endsWith('@g.us') || normalizedJid.endsWith('@broadcast')) return false
const payload = { jid: normalizedJid, reason: 'reachout_timelock_463', source: String(source?.source || 'sendMessage'), createdAt: Date.now() }
try {
if (typeof global.db?.setTimelockCooldown === 'function') await global.db.setTimelockCooldown(normalizedJid, payload, TIMELOCK_COOLDOWN_MS)
else await global.db?.setTemporaryState?.(TIMELOCK_COOLDOWN_SCOPE, normalizedJid, payload, TIMELOCK_COOLDOWN_MS)
return true
} catch (error) {
console.error('[TIMELOCK GUARD] No se pudo persistir cooldown:', error?.message || error)
return false
}
}

async function isTimelockBlocked(conn, jid = '') {
const normalizedJid = normalizeTimelockJid(conn, jid)
if (!normalizedJid || normalizedJid.endsWith('@g.us') || normalizedJid.endsWith('@broadcast')) return false
try {
if (typeof global.db?.getTimelockCooldown === 'function') return Boolean(await global.db.getTimelockCooldown(normalizedJid))
return Boolean(await global.db?.getTemporaryState?.(TIMELOCK_COOLDOWN_SCOPE, normalizedJid))
} catch (error) {
console.error('[TIMELOCK GUARD] No se pudo consultar cooldown:', error?.message || error)
return false
}
}

function getGuardedGroupChat(conn, jid = '') {
const chat = conn?.decodeJid?.(jid) || jid
return typeof chat === 'string' && chat.endsWith('@g.us') ? chat : ''
}

function getEgressText(content = {}) {
if (typeof content === 'string') return content
return String(content?.text || content?.caption || content?.extendedTextMessage?.text || content?.conversation || '')
}

function isPrimaryBotControlEgress(content = {}) {
const text = getEgressText(content)
return /Estado de bots restablecido|Bot primario actualizado/i.test(text)
}

function canUsePrimaryBotEgress(conn, jid = '', content = {}) {
const chatId = getGuardedGroupChat(conn, jid)
if (!chatId || isPrimaryBotControlEgress(content)) return true
return !shouldBlockForPrimaryBot(conn, chatId)
}

function canPatchConnectionMethod(conn, name) {
if (!conn || typeof conn[name] !== 'function') return false
let target = conn
while (target) {
const descriptor = Object.getOwnPropertyDescriptor(target, name)
if (descriptor) return descriptor.writable !== false || typeof descriptor.set === 'function'
target = Object.getPrototypeOf(target)
}
return true
}

function patchConnectionMethod(conn, name, wrapper) {
if (!canPatchConnectionMethod(conn, name)) return false
try {
const original = conn[name].bind(conn)
conn[name] = wrapper(original)
return true
} catch (error) {
console.error(`[primary-bot] no se pudo blindar ${name}`, error?.message || error)
return false
}
}

function installPrimaryBotEgressGuard(conn) {
if (!conn || conn[PRIMARY_BOT_EGRESS_GUARD_PATCH]) return
patchConnectionMethod(conn, 'sendMessage', original => async (jid, content, options = {}) => {
if (!canUsePrimaryBotEgress(conn, jid, content)) return null
return original(jid, content, options)
})
patchConnectionMethod(conn, 'relayMessage', original => async (jid, message, options = {}) => {
if (!canUsePrimaryBotEgress(conn, jid, message)) return null
return original(jid, message, options)
})
patchConnectionMethod(conn, 'sendFile', original => async (jid, ...args) => {
if (!canUsePrimaryBotEgress(conn, jid, args[3])) return null
return original(jid, ...args)
})
conn[PRIMARY_BOT_EGRESS_GUARD_PATCH] = true
}

function installTimelockGuard(conn) {
if (!conn?.sendMessage || conn[TIMELOCK_GUARD_PATCH]) return
const originalSendMessage = conn.sendMessage.bind(conn)
conn.sendMessage = async (jid, content, options = {}) => {
const normalizedJid = normalizeTimelockJid(conn, jid)
if (await isTimelockBlocked(conn, normalizedJid)) {
console.warn(`[TIMELOCK GUARD] Abortando envío a ${normalizedJid} para prevenir baneo (Error 463).`)
return null
}
try {
return await originalSendMessage(jid, content, options)
} catch (error) {
if (extractErrorCode(error) === '463') {
await setTimelockCooldown(conn, normalizedJid, { source: 'sendMessage' })
console.warn(`[TIMELOCK GUARD] Abortando envío a ${normalizedJid} para prevenir baneo (Error 463).`)
}
throw error
}
}
conn[TIMELOCK_GUARD_PATCH] = true
}

export async function messagesUpdate(updates = []) {
const list = Array.isArray(updates) ? updates : [updates]
for (const update of list) {
try {
const status = update?.update?.status || update?.status
const error = update?.update?.error || update?.error || update?.update?.messageStubParameters || update
if (extractErrorCode(error) !== '463') continue
const jid = update?.key?.remoteJid || update?.remoteJid || update?.jid || update?.chat
if (status != null && !String(status).toLowerCase().includes('error') && !String(status).includes('5')) continue
await setTimelockCooldown(this, jid, { source: 'messages.update' })
} catch (error) {
console.error('[TIMELOCK GUARD] Error procesando messages.update:', error?.message || error)
}
}
}



export function segundosAHMS(totalSeconds = 0) {
const safeSeconds = Math.max(0, Math.ceil(Number(totalSeconds) || 0))
const hours = Math.floor(safeSeconds / 3600)
const minutes = Math.floor((safeSeconds % 3600) / 60)
const seconds = safeSeconds % 60
if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
if (minutes > 0) return `${minutes}m ${seconds}s`
return `${seconds}s`
}

global.segundosAHMS = segundosAHMS

function getIncomingMessages(chatUpdate) {
if (chatUpdate?.type !== 'notify') return []
return Array.isArray(chatUpdate?.messages) ? chatUpdate.messages.filter(Boolean) : []
}

function getRawFastPath(conn, message = {}) {
return buildRawFastPath(conn, message, { maxAgeMs: SYSTEM_MESSAGE_MAX_AGE_MS, getStickerCommandText })
}

function getMessageQueuePriority(message = {}) {
const command = getRawCommandName(getRawMessageText(message) || getStickerCommandText(getRawStickerHash(message), getRawMessageSender(message)))
if (!command) return 'normal'
const entry = commandsMap.get(command)
const name = String(entry?.name || '')
const plugin = entry?.plugin || {}
const tags = Array.isArray(plugin.tags) ? plugin.tags.map(tag => String(tag).toLowerCase()) : []
const haystack = `${name} ${tags.join(' ')} ${command}`.toLowerCase()
if (/(sticker|descargas|downloader|download|convertidor|tiktok|instagram|facebook|twitter|spotify|mediafire|mega|terabox|play|youtubedl|youtube|pinterest|xvideos|xnxx|pornhub|hentai|ai-|chatgpt|gemini|copilot|\bia\b|\bai\b)/.test(haystack)) return 'low'
if (/(admin|owner|grupo|enable|main|info|ping|runtime|speed|estado|sistema|menu|staff|unban|resetbot|ban|kick|promote|demote)/.test(haystack)) return 'high'
return 'normal'
}

function isCelestialCommandText(text = '') {
return CELESTIAL_COMMANDS.has(getRawCommandName(text))
}

function pickPlainMessageText(message = {}, fallback = '') {
const content = unwrapMessageContent(message?.message || message) || {}
const selectedRow = content.listResponseMessage?.singleSelectReply?.selectedRowId
return String(
content.conversation
|| content.extendedTextMessage?.text
|| content.imageMessage?.caption
|| content.videoMessage?.caption
|| content.documentMessage?.caption
|| content.buttonsResponseMessage?.selectedButtonId
|| selectedRow
|| content.templateButtonReplyMessage?.selectedId
|| getInteractiveResponseText(content)
|| fallback
|| ''
).trim()
}

function hasModerationLinkText(text = '') {
return /(?:https?:\/\/|chat\.whatsapp\.com\/|wa\.me\/|whatsapp\.com\/channel\/|t\.me\/|discord\.gg\/)/i.test(String(text || ''))
}

function isKnownFastPathUser(sender = '') {
if (!sender) return false
try {
if (global.db?.userCache?.has?.(sender)) return true
if (global.db?.data?.users && Object.prototype.hasOwnProperty.call(global.db.data.users, sender)) return true
return false
} catch {
return false
}
}

function shouldUsePassiveFastPath(conn, rawMessage = {}, fastPath = {}) {
const chat = conn?.decodeJid?.(getRawMessageChat(rawMessage)) || getRawMessageChat(rawMessage)
if (!chat?.endsWith?.('@g.us')) return false
const text = String(fastPath.text || getRawMessageText(rawMessage) || '')
if (fastPath.rawCommand || getRawCommandName(text)) return false
if (hasModerationLinkText(text) || messageHasModeratedLink(rawMessage)) return false
const sender = normalizeJid(conn?.decodeJid?.(rawMessage?.key?.participant || rawMessage?.participant || rawMessage?.sender || '') || rawMessage?.key?.participant || rawMessage?.participant || rawMessage?.sender || '')
if (!isKnownFastPathUser(sender)) return false
return true
}

function recordPassiveFastPath(conn, rawMessage = {}, fastPath = {}) {
try {
const chatId = conn?.decodeJid?.(getRawMessageChat(rawMessage)) || getRawMessageChat(rawMessage)
const rawSender = rawMessage?.key?.participant || rawMessage?.participant || rawMessage?.sender || ''
const jid = normalizeJid(conn?.decodeJid?.(rawSender) || rawSender)
if (!chatId || !jid) return
getDbWorkerClient().fire('incrementChatActivity', { chatId, jid, name: rawMessage?.pushName || fastPath.pushName || '', now: Date.now(), isCommand: false })
} catch (error) {
console.error('[fast-path]', error?.message || error)
}
}

function parseCommand(rawText = '', prefix = '') {
const source = String(rawText || '').trim()
const usedPrefix = String(prefix || '')
const payload = usedPrefix && source.startsWith(usedPrefix) ? source.slice(usedPrefix.length).trim() : source
const tokens = payload ? payload.split(/\s+/).filter(Boolean) : []
const command = (tokens.shift() || '').toLowerCase()
const text = payload.slice(command.length).trim()
return {
prefix: usedPrefix,
usedPrefix,
command,
args: tokens,
_arg: tokens,
_args: tokens,
text,
noPrefix: payload,
raw: source,
}
}

function buildPluginContext(conn, input = {}) {
const match = input.match || [[input.usedPrefix || input.prefix || '']]
const usedPrefix = String(input.usedPrefix || input.prefix || match?.[0]?.[0] || '')
const parsed = input.command ? input : parseCommand(input.messageText || input.m?.text || '', usedPrefix)
const args = Array.isArray(input.args) ? input.args : (Array.isArray(parsed.args) ? parsed.args : [])
const text = typeof input.text === 'string' ? input.text : (typeof parsed.text === 'string' ? parsed.text : args.join(' '))
const command = String(input.command || parsed.command || '').toLowerCase()
return {
conn,
match,
usedPrefix,
prefix: usedPrefix,
command,
args,
_arg: Array.isArray(input._arg) ? input._arg : args,
_args: Array.isArray(input._args) ? input._args : args,
text,
noPrefix: input.noPrefix || parsed.noPrefix || [command, ...args].filter(Boolean).join(' '),
participants: Array.isArray(input.participants) ? input.participants : [],
groupMetadata: input.groupMetadata || {},
user: input.user || {},
bot: input.bot || {},
isROwner: Boolean(input.isROwner),
isOwner: Boolean(input.isOwner),
isRAdmin: Boolean(input.isRAdmin),
isAdmin: Boolean(input.isAdmin),
isBotAdmin: Boolean(input.isBotAdmin),
isPrems: Boolean(input.isPrems),
chatUpdate: input.chatUpdate,
__dirname: input.__dirname,
__filename: input.__filename,
}
}

async function runPluginHooks(conn, plugin, name, m, baseContext = {}) {
if (typeof plugin?.all !== 'function') return false
const context = buildPluginContext(conn, { ...baseContext, m, messageText: m?.text || '' })
try {
const result = await plugin.all.call(conn, m, context)
return result === true
} catch (error) {
console.error(`[plugin-all] ${name}`, error)
m.pluginFailed = true
return false
}
}

async function runInvalidCommandNotice(conn, m, parsed = {}, usedPrefix = '') {
if (!parsed?.command || !usedPrefix || shouldIgnoreBaileysMessage(m)) return false
const commandText = `${usedPrefix}${parsed.command}`
const message = `(,,•᷄‎ࡇ•᷅ ,,)? ᥱᥣ ᥴ᥆mᥲᥒძ᥆ *${commandText}* ᥒ᥆ sᥱ ᥱᥒᥴᥙᥱᥒ𝗍rᥲ rᥱgіs𝗍rᥲძ᥆.

⍴ᥲrᥲ ᥴ᥆ᥒsᥙᥣ𝗍ᥲr ᥣᥲ ᥣіs𝗍ᥲ ᥴ᥆m⍴ᥣᥱ𝗍ᥲ ძᥱ 𝖿ᥙᥒᥴі᥆ᥒᥲᥣіძᥲძᥱs ᥙsᥲ:
» *${usedPrefix}help*`
await (m.reply?.(message) || conn.reply?.(m.chat, message, m))
return true
}


function getActivitySenderFromRaw(message = {}) {
const chat = getRawMessageChat(message)
if (!chat?.endsWith?.('@g.us')) return ''
return message?.key?.participant || message?.participant || message?.sender || ''
}

function pruneChatActivityUsers(users = {}, now = Date.now(), { maxUsers = CHAT_ACTIVITY_DEFAULT_MAX_USERS, ttlMs = CHAT_ACTIVITY_DEFAULT_TTL_MS } = {}) {
if (!users || typeof users !== 'object') return {}
const entries = Object.entries(users).filter(([jid, data]) => {
  if (!jid || !data || typeof data !== 'object') return false
  const lastActive = Number(data.lastMessageTime || data.lastMsg || data.updatedAt || 0)
  return !ttlMs || !lastActive || now - lastActive <= ttlMs
})
if (entries.length > maxUsers) {
  entries.sort((a, b) => Number(b[1]?.lastMessageTime || b[1]?.lastMsg || 0) - Number(a[1]?.lastMessageTime || a[1]?.lastMsg || 0))
  entries.length = maxUsers
}
return Object.fromEntries(entries)
}

function isMediaOrInteractiveMessage(m = {}, rawMessage = {}) {
const msg = m.message || rawMessage.message || {}
const content = unwrapMessageContent(msg) || msg
const keys = Object.keys(content || {})
return keys.some(key => /image|video|audio|sticker|document|interactive|buttons|list|template|reaction|poll/i.test(key)) || Boolean(m.quoted || m.isBaileys || m.message?.buttonsResponseMessage || m.message?.listResponseMessage || m.message?.interactiveResponseMessage)
}

function shouldRunBeforeHook(plugin = {}, m = {}, rawMessage = {}, parsed = null) {
if (!plugin || plugin.disabled) return false
if (plugin.skipSimpleText !== true && plugin.needsMedia !== true) return true
const hasCommand = Boolean(parsed?.command)
const mediaOrInteractive = isMediaOrInteractiveMessage(m, rawMessage)
if (plugin.needsMedia === true && !mediaOrInteractive) return false
if (plugin.skipSimpleText === true && !hasCommand && !mediaOrInteractive) return false
return true
}

async function getParticipantContext(conn, chat, { requireParticipants = false, force = false } = {}) {
if (!requireParticipants || !chat) return { groupMetadata: {}, participants: [], participantsByLid: null }
if (!(conn.__rubyParticipantIndexCache instanceof TTLCache)) conn.__rubyParticipantIndexCache = new TTLCache({ stdTTL: PARTICIPANT_INDEX_TTL_SECONDS, checkperiod: Math.max(5, PARTICIPANT_INDEX_TTL_SECONDS), useClones: false, max: PARTICIPANT_INDEX_MAX })
const cacheKey = `${chat}:participants`
if (!force) {
  const cached = conn.__rubyParticipantIndexCache.get(cacheKey)
  if (cached) return cached
}
const groupMetadata = await getGroupMetadataOnDemand(conn, chat, { requireParticipants: true, force })
const participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
const participantsByLid = createParticipantIndex(participants)
const context = { groupMetadata: groupMetadata || {}, participants, participantsByLid }
conn.__rubyParticipantIndexCache.set(cacheKey, context)
return context
}

function trackLocalGroupActivity(conn, mOrRaw = {}, sender = '', { isCommand = false, countMessage = true } = {}) {
try {
if (!conn || !mOrRaw || typeof mOrRaw !== 'object') return null
if (mOrRaw.isGroup === false) return null
const rawChat = mOrRaw?.chat || mOrRaw?.key?.remoteJid || getRawMessageChat(mOrRaw)
const chatId = conn?.decodeJid?.(rawChat) || rawChat
if (typeof chatId !== 'string' || !chatId.endsWith('@g.us')) return null
const rawSender = sender || mOrRaw?.sender || mOrRaw?.key?.participant || getActivitySenderFromRaw(mOrRaw)
const jid = normalizeJid(conn?.decodeJid?.(rawSender) || rawSender)
if (!jid || jid.endsWith('@g.us')) return null
const chat = global.db?.getChat?.(chatId) || global.db?.data?.chats?.[chatId] || {}
chat.users = chat.users && typeof chat.users === 'object' ? chat.users : {}
const previous = chat.users[jid] && typeof chat.users[jid] === 'object' ? chat.users[jid] : {}
const now = Date.now()
const next = { ...previous }
const displayName = String(mOrRaw?.pushName || mOrRaw?.name || previous.name || '').trim()
if (displayName) next.name = displayName
if (countMessage) next.msgCount = (Number(next.msgCount) || 0) + 1
if (mOrRaw && typeof mOrRaw === 'object') mOrRaw._messageStatsCounted = true
if (isCommand) next.cmdCount = (Number(next.cmdCount) || 0) + 1
next.lastMessageTime = now
next.lastMsg = now
chat.users[jid] = next
chat.users = pruneChatActivityUsers(chat.users, now)
chat.activityUpdatedAt = now
global.db?.updateChat?.(chatId, { users: chat.users, activityUpdatedAt: chat.activityUpdatedAt })
return next
} catch (error) {
console.error('[local-activity-tracker]', error?.message || error)
return null
}
}

function shouldReadCommandMessage(conn, m, commandEntry) {
if (!commandEntry || !m?.key || typeof conn?.readMessages !== 'function') return false
const { id, remoteJid } = m.key
if (typeof id !== 'string' || !id || typeof remoteJid !== 'string' || !remoteJid) return false
if (!(conn.__rubyReadMessagesLast instanceof TTLCache)) conn.__rubyReadMessagesLast = new TTLCache({ stdTTL: READ_MESSAGE_CACHE_TTL_SECONDS, checkperiod: 60, useClones: false, max: READ_MESSAGE_CACHE_MAX })
const rateKey = `${remoteJid}:${id}`
const now = Date.now()
const lastRead = Number(conn.__rubyReadMessagesLast.get(rateKey) || 0)
if (now - lastRead < READ_MESSAGE_MIN_INTERVAL_MS) return false
conn.__rubyReadMessagesLast.set(rateKey, now)
return true
}

async function readCommandMessageSafely(conn, m, commandEntry) {
if (!shouldReadCommandMessage(conn, m, commandEntry)) return false
try {
await conn.readMessages([m.key])
return true
} catch (error) {
console.error('[read-command-message]', error?.message || error)
return false
}
}

function isCelestialCommandMessage(message = {}) {
const text = getRawMessageText(message) || getStickerCommandText(getRawStickerHash(message), getRawMessageSender(message))
return isCelestialCommandText(text)
}

function canBypassSilencedChat(message = {}) {
return isCelestialCommandMessage(message)
}

async function forceResetBotState(conn, m, sender, participantsByLid = null, participants = []) {
let normalizedSender = sender
if (m?.isGroup && participantsByLid) normalizedSender = normalizeLidReferences(m, normalizedSender, participantsByLid)
normalizedSender = await normalizeMessageIdentifiers(conn, m, normalizedSender, participantsByLid)
const permissionContext = buildPermissionContext(conn, m, normalizedSender, participants)
if (m?.isGroup && !(permissionContext.isAdmin || permissionContext.isOwner || permissionContext.isROwner || canManageBotSecurity(normalizedSender, conn))) return true
if (!m?.isGroup && !isAuthorizedOwner(normalizedSender)) return true
const chat = global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat]
if (!chat) return true
resetChatBotRouting(chat)
forgetPrimaryBot(m.chat)
rememberPrimaryBot(m.chat, chat)
global.db?.updateChat?.(m.chat, chat)
await global.db?.write?.()
cleanupSessionState(conn)
if(Array.isArray(global.conns))for(const sub of global.conns)cleanupSessionState(sub)
global.__rubyPrimaryBotCache?.set?.(m.chat,'')
await conn.reply?.(m.chat, '✅ Estado de bots restablecido: sin bot primario y con todos los sub-bots habilitados en este grupo.', m)
return true
}

function getStickerHashFromMessage(m = {}) {
const sha = m?.msg?.fileSha256 || m?.message?.stickerMessage?.fileSha256 || m?.message?.imageMessage?.fileSha256
if (!sha) return ''
try {
return Buffer.from(sha).toString('base64')
} catch {
return ''
}
}

function getStickerCommandText(hash = '', sender = '') {
if (!hash || !sender) return ''
try {
const stickerSection = global.db?.getSection?.('sticker') || global.db?.data?.sticker || {}
const record = stickerSection[hash]
const personal = getPersonalStickerCommand(record, sender)
return typeof personal?.text === 'string' ? personal.text.trim() : ''
} catch (error) {
console.error('[sticker-cmd] no se pudo consultar el comando del sticker', error)
return ''
}
}

function hydrateStickerCommandText(m = {}) {
if (m.text) return false
const text = getStickerCommandText(getStickerHashFromMessage(m), m.sender)
if (!text) return false
m.text = text
m.body = text
m.__stickerCommandHydrated = true
if (m.msg && typeof m.msg === 'object') m.msg.caption = text
return true
}


function shouldProcessRawGroupMessage(conn, message = {}) {
const chat = conn?.decodeJid?.(getRawMessageChat(message)) || getRawMessageChat(message)
if (!chat?.endsWith?.('@g.us')) return true
if (canBypassSilencedChat(message)) return true
const chatData = getFreshChatRecord(chat)
if (shouldBlockForPrimaryBot(conn, chat)) return false
const hasActiveAntiLink = Boolean(chatData?.antiLink || chatData?.antilink)
if (hasActiveAntiLink && messageHasModeratedLink(message)) return true
return !shouldSilenceChatForBot(chatData, normalizeConnectionJid(conn))
}

function getQueueKey(message) {
return message?.key?.participant || message?.participant || message?.key?.remoteJid || message?.chat || 'unknown'
}

function getQueueChatKey(message) {
return message?.key?.remoteJid || message?.chat || message?.remoteJid || 'unknown-chat'
}

function getEventTime(update = {}) {
const raw = Number(update.timestamp || update.time || update.messageTimestamp || update.creation || update.date || 0)
if (!raw) return 0
return raw < 10_000_000_000 ? raw * 1000 : raw
}

function isRealtimeGroupEvent(conn, update = {}) {
const now = Date.now()
const readyAt = Number(conn?.__groupEventReadyAt || 0)
if (readyAt && now < readyAt) return false
const startedAt = Number(conn?.__groupEventStartedAt || global.uptimeStart || now)
if (!readyAt && now - startedAt < REALTIME_EVENT_GRACE_MS) return false
const eventTime = getEventTime(update)
if (!eventTime) return true
if (eventTime < startedAt) return false
if (now - eventTime > REALTIME_EVENT_MAX_AGE_MS) return false
return true
}


function clockString(ms){
const h=Math.floor(ms/3600000)
const m=Math.floor(ms/60000)%60
const s=Math.floor(ms/1000)%60
return [h,m,s].map(v=>v.toString().padStart(2,'0')).join(':')
}

async function clearAfkBeforePrefix(conn,m,sender){
if(!m||m.fromMe||!sender||!global.db?.getUser)return false
const user=global.db.getUser(sender)
if(!user||!(user.afk>-1))return false
const timeAfk=clockString(Date.now()-user.afk)
const reasonText=user.afkReason?`
         🧇̫͠ ꒰  *𝖬𝗈𝗍𝗂𝗏𝗈:* ${user.afkReason}`:''
const text=`> 🍰 𝖣𝖾𝗃𝖺𝗌𝗍𝖾     𝖽𝖾     𝖾𝗌𝗍𝖺𝗋     𝗂𝗇𝖺𝖼𝗍𝗂𝗏𝗈     !

୨ㅤ࣪ㅤ︶︶︶︶ ㅤ꒰ 🎀 ꒱ㅤ︶︶︶︶ㅤ࣪ㅤ୧

🍪̮͡ 〣  *𝖳𝗂𝖾𝗆𝗉𝗈     𝖨𝗇𝖺𝖼𝗍𝗂𝗏𝗈:* ${timeAfk}${reasonText}

> \`𝖡𝗂𝖾𝗇𝗏𝖾𝗇𝗂𝖽𝗈     𝖽𝖾     𝗏𝗎𝖾𝗅𝗍𝖺     ♡\``
user.afk=-1
user.afkReason=''
global.db?.scheduleFlush?.()
await conn.reply?.(m.chat,text,m)
return true
}

function shouldIgnoreBaileysMessage(m) {
if (!m?.fromMe && !m?.isBaileys) return false
const id = m?.id || m?.key?.id || ''
return IGNORED_BAILEYS_IDS.some((pattern) => pattern.test(id))
}

function normalizeConnectionJid(conn) {
return normalizeSessionJid(conn?.subBotJid || conn?.authState?.creds?.me?.jid || conn?.authState?.creds?.me?.id || conn?.user?.jid || conn?.user?.id || conn?.session?.id || conn)
}

function rememberPrimaryBot(chatId = '', chat = null) {
if (!chatId) return PRIMARY_BOT_EMPTY
const primaryBot = getPrimaryBotJid(chat)
PRIMARY_BOT_CACHE.set(chatId, primaryBot || PRIMARY_BOT_EMPTY)
return primaryBot
}

function forgetPrimaryBot(chatId = '') {
if (chatId) PRIMARY_BOT_CACHE.delete(chatId)
}

function getCachedPrimaryBot(chatId = '') {
if (!chatId) return PRIMARY_BOT_EMPTY
const cached = PRIMARY_BOT_CACHE.get(chatId)
if (cached !== undefined) return cached || PRIMARY_BOT_EMPTY
const chat = global.db?.data?.chats?.[chatId] || null
return rememberPrimaryBot(chatId, chat)
}

function isCurrentBotPrimaryForCachedChat(conn, chatId = '') {
const primaryBot = getCachedPrimaryBot(chatId)
if (!primaryBot) return true
return normalizeConnectionJid(conn) === primaryBot
}

function getFreshChatRecord(chatId = '') {
if (!chatId) return null
try {
const chat = global.db?.getChat?.(chatId)
if (chat) {
rememberPrimaryBot(chatId, chat)
return chat
}
} catch (error) {
console.error('[primary-bot] no se pudo consultar el chat en SQLite', error)
}
const chat = global.db?.data?.chats?.[chatId] || null
rememberPrimaryBot(chatId, chat)
return chat
}

function shouldBlockForPrimaryBot(conn, chatId = '') {
if (!chatId) return false
const chat = getFreshChatRecord(chatId)
const primaryBot = getPrimaryBotJid(chat)
if (!primaryBot) return false
PRIMARY_BOT_CACHE.set(chatId, primaryBot)
return !isPrimaryBotForChat(chat, normalizeConnectionJid(conn))
}

function enforcePrimaryBotMiddleware(conn, m = {}) {
if (!m?.isGroup || isCelestialCommandText(m?.text || '')) return false
const chat = getFreshChatRecord(m.chat)
const primaryBot = getPrimaryBotJid(chat)
if (!primaryBot) return false
PRIMARY_BOT_CACHE.set(m.chat, primaryBot)
const currentBot = normalizeConnectionJid(conn)
if (!currentBot || !isPrimaryBotForChat(chat, currentBot)) return true
if (chat && typeof chat === 'object') {
if (chat.primaryBot !== primaryBot) chat.primaryBot = primaryBot
if (chat.botPrimario !== primaryBot) chat.botPrimario = primaryBot
rememberPrimaryBot(m.chat, chat)
global.db?.updateChat?.(m.chat, chat)
}
return false
}

async function normalizeJidForDatabase(conn, jid, participantsByLid = null) {
return normalizeIdentityJid(conn, jid, participantsByLid) || jid
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
for (const jid of m.mentionedJid) {
mentionedJid.push(await normalizeJidForDatabase(conn, jid, participantsByLid))
}
try { m.mentionedJid = mentionedJid } catch {}
m.mentions = mentionedJid
} else {
m.mentions = []
}
return normalizedSender
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
if (typeof global.db?.incrementUserActivityFast === 'function') await global.db.incrementUserActivityFast(sender, {
exp: m.exp || 0,
coin: -((m.coin || 0) * 1),
messages: 1
})
else {
const current = global.db?.getUser?.(sender)
const nextMsgCount = (Number(current?.msg_count) || 0) + 1
if (current) await global.db.updateUser(sender, {
exp: (Number(current.exp) || 0) + (m.exp || 0),
coin: (Number(current.coin) || 0) - ((m.coin || 0) * 1),
msg_count: nextMsgCount
})
}
await global.db?.scheduleFlush?.()
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
if (m.error == null && !m.pluginFailed) {
stat.success += 1
stat.lastSuccess = now
}
}

export async function handler(chatUpdate) {
try {
installPrimaryBotEgressGuard(this)
installTimelockGuard(this)
attachSessionState(this)
runMaintenance(this)
const messages = getIncomingMessages(chatUpdate)
if (!messages.length) return
if (global.db && global.db.data == null) await global.loadDatabase?.()
const fastMessages = []
for (const message of messages) {
try {
const rawChat = this?.decodeJid?.(getRawMessageChat(message)) || getRawMessageChat(message)
if (rawChat?.endsWith?.('@g.us') && shouldBlockForPrimaryBot(this, rawChat) && !canBypassSilencedChat(message)) continue
const fastPath = getRawFastPath(this, message)
if (!fastPath) continue
message.__rubyFastPath = fastPath
fastMessages.push(message)
} catch (error) {
console.error('[messages.upsert] error preparando mensaje', error)
}
}
if (!fastMessages.length) return
const liveMessages = fastMessages.filter((message) => {
try { return shouldProcessRawGroupMessage(this, message) } catch (error) { console.error('[messages.upsert] filtro fallido', error); return false }
})
if (!liveMessages.length) return
this.pushMessage?.(liveMessages).catch(error => console.error('[messages.upsert] pushMessage falló', error))
for (const rawMessage of liveMessages) {
const fastPath = rawMessage.__rubyFastPath || getRawFastPath(this, rawMessage)
if (shouldUsePassiveFastPath(this, rawMessage, fastPath)) {
recordPassiveFastPath(this, rawMessage, fastPath)
continue
}
const key = getQueueKey(rawMessage)
const priority = getMessageQueuePriority(rawMessage)
messageQueue.enqueue(key, () => processMessage.call(this, chatUpdate, rawMessage), { chatKey: getQueueChatKey(rawMessage), priority })
}
} catch (error) {
console.error('[messages.upsert] error no controlado; el listener sigue activo', error)
}
}

async function processMessage(chatUpdate, rawMessage) {
let m = null
let sender = null
try {
const fastPath = rawMessage.__rubyFastPath || getRawFastPath(this, rawMessage)
if (!fastPath) return
m = smsg(this, rawMessage) || rawMessage
if (!m) return
const opts = this.opts || global.opts || {}
const plainText = pickPlainMessageText(rawMessage, fastPath.text)
if (typeof m.text !== 'string') m.text = ''
if (!m.text && plainText) m.text = plainText
if (!m.body && plainText) m.body = plainText
trackLocalGroupActivity(this, m, m.isGroup ? (m.key?.participant || m.sender) : '', { countMessage: true, isCommand: false })

const rawCommand = fastPath.rawCommand || getRawCommandName(m.text)
if (rawCommand === 'resetbot') {
sender = m.isGroup ? (m.key?.participant || m.sender) : (m.key?.remoteJid || m.sender)
if (!sender) return
const resetContext = m.isGroup ? await getParticipantContext(this, m.chat, { requireParticipants: true, force: true }) : { groupMetadata: {}, participants: [], participantsByLid: null }
const groupMetadata = resetContext.groupMetadata
const participants = resetContext.participants
const participantsByLid = resetContext.participantsByLid
await forceResetBotState(this, m, sender, participantsByLid, participants)
return
}

const prefixMatch = fastPath.usedPrefix ? [[fastPath.usedPrefix], null] : getPrefixMatch(this, {}, m.text)
const parsed = fastPath.parsed || (prefixMatch?.[0]?.[0] ? parseCommand(m.text, prefixMatch[0][0]) : null)
const commandEntry = fastPath.commandEntry || (parsed?.command ? commandsMap.get(parsed.command) : null)
sender = m.isGroup ? (m.key?.participant || m.sender) : (m.key?.remoteJid || m.sender)
if (!sender) return
m.__deleteKey = m.key ? { ...m.key } : null
const strictParticipantMetadata = Boolean(global.strictParticipantMetadata || process.env.RUBY_STRICT_PARTICIPANT_METADATA === 'true')
const activeBeforeHooks = global.beforeHooks || beforeHooks || []
const beforeHooksNeedParticipants = activeBeforeHooks.some(({ plugin } = {}) => typeof plugin?.before === 'function' && (!strictParticipantMetadata || plugin?.needsParticipants === true))
const needsParticipants = Boolean(m.isGroup && (fastPath.needsModeration || pluginRequiresGroupParticipants(commandEntry?.plugin) || beforeHooksNeedParticipants))
const requiresFreshAdminMetadata = Boolean(commandEntry?.plugin?.admin || commandEntry?.plugin?.botAdmin || commandEntry?.plugin?.needsParticipants || fastPath.needsModeration)
let { groupMetadata, participants, participantsByLid } = needsParticipants ? await getParticipantContext(this, m.chat, { requireParticipants: true, force: requiresFreshAdminMetadata }) : { groupMetadata: {}, participants: [], participantsByLid: null }
sender = normalizeLidReferences(m, sender, participantsByLid)
sender = await normalizeMessageIdentifiers(this, m, sender, participantsByLid)
if (needsParticipants && (!participants.length || !participants.some((participant) => {
const ids = [participant?.jid, participant?.id, participant?.lid].filter(Boolean).map((jid) => String(this.decodeJid?.(jid) || jid).split('@')[0])
const senderNumber = String(this.decodeJid?.(sender) || sender).split('@')[0]
return senderNumber && ids.includes(senderNumber)
}))) {
({ groupMetadata, participants, participantsByLid } = await getParticipantContext(this, m.chat, { requireParticipants: true, force: true }))
sender = normalizeLidReferences(m, sender, participantsByLid)
sender = await normalizeMessageIdentifiers(this, m, sender, participantsByLid)
}

m.exp = 0
m.coin = false
const { user: _user, settings } = hydrateDatabaseForMessage(this, m, sender)
await clearAfkBeforePrefix(this,m,sender)
if (enforcePrimaryBotMiddleware(this, m)) return

await global.updateMessageGlobals?.(m, this)
hydrateStickerCommandText(m)

if (opts.nyimak) return
if (!m.fromMe && opts.self) return
if (opts.swonly && m.chat !== 'status@broadcast') return

const permissionContext = buildPermissionContext(this, m, sender, participants)
const { userGroup, botGroup, isRAdmin, isAdmin, isBotAdmin, isROwner, isOwner, isMods, isPrems } = permissionContext
m.isAdmin = isAdmin
m.isBotAdmin = isBotAdmin
if (!isBotSender(this, m, sender) && await runAutoModeration(this, m, sender, permissionContext)) return
if (!isBotSender(this, m, sender) && !m.isGroup && !canManageBotSecurity(sender, this)) {
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
for (const hook of global.allHooks || allHooks || []) {
const { name, plugin } = hook || {}
if (!plugin || plugin.disabled) continue
const __filename = join(pluginDir, name)
const baseContext = { chatUpdate, __dirname: pluginDir, __filename }
await runPluginHooks(this, plugin, name, m, baseContext)
if (m.__pluginHalt) return
}
for (const hook of activeBeforeHooks) {
const chatDataForAdminMode = m.isGroup ? getFreshChatRecord(m.chat) : null
if (parsed?.command && prefixMatch?.[0]?.[0] && chatDataForAdminMode?.modoadmin && !isAdmin && !isOwner && !isROwner) return
const { name, plugin } = hook || {}
if (!shouldRunBeforeHook(plugin, m, rawMessage, parsed)) continue
if (!opts.restrict && plugin.tags?.includes?.('admin')) continue
const __filename = join(pluginDir, name)
const match = getPrefixMatch(this, plugin, m.text)
const beforeContext = buildPluginContext(this, { match, m, messageText: m.text, participants, groupMetadata, user: userGroup, bot: botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: pluginDir, __filename })
let beforeResult = false
try {
beforeResult = await plugin.before.call(this, m, beforeContext)
} catch (error) {
console.error(`[plugin-before] ${name}`, error)
m.pluginFailed = true
continue
}
if (m.__pluginHalt) return
if (beforeResult && commandEntry?.name === name) return
if (m.__pluginHalt) return
}
if (!commandEntry) {
if (parsed?.command && prefixMatch?.[0]?.[0]) await runInvalidCommandNotice(this, m, parsed, prefixMatch[0][0])
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
const isCelestialCommand = CELESTIAL_COMMANDS.has(commandParsed.command) || UNBAN_COMMAND_FILES.includes(name)
global.comando = commandParsed.command
if (shouldIgnoreBaileysMessage(m) && !isBotSender(this, m, sender) && !isCelestialCommand) return
m.plugin = name
const chatData = getFreshChatRecord(m.chat) || {}
const isBotBannedInThisChat = isChatBannedForBot(chatData, normalizeConnectionJid(this))
const isBotSecurityManager = canManageBotSecurity(sender, this)
if (!isOwner && !isROwner && !isBotSender(this, m, sender) && isBotBannedInThisChat && !isCelestialCommand && !isBotSecurityManager) return
const __filename = join(pluginDir, name)
await readCommandMessageSafely(this, m, commandEntry)
trackLocalGroupActivity(this, m, sender, { countMessage: false, isCommand: true })
const extra = buildPluginContext(this, { match, usedPrefix, ...commandParsed, participants, groupMetadata, user: userGroup, bot: botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: pluginDir, __filename })
await withCommandPresence(this, m, () => executePlugin(this, plugin, name, m, extra, permissionContext, sender, { chat: chatData, user: global.db?.data?.users?.[sender], isCelestialCommand }))
} catch (error) {
console.error(error)
} finally {
try {
if (!m?.__skipStats) await updateStatsAndEconomy(this, m, sender)
} catch (error) {
console.error(error)
}
try {
if (!((this.opts || global.opts || {}).noprint) && m) await (await import('../library/print.js')).default(m, this)
} catch (error) {
console.log(chalk.red('Error en print.js'), error)
}
}
}

function buildGroupUpdateStub(update = {}) {
const chat = update.id
if (!chat) return null
const actor = update.author || update.sender || update.participant || update.owner || ''
if (typeof update.subject === 'string') return { chat, isGroup: true, sender: actor, messageStubType: 21, messageStubParameters: [update.subject] }
if (typeof update.desc === 'string' || typeof update.description === 'string') return { chat, isGroup: true, sender: actor, messageStubType: 24, messageStubParameters: [update.desc || update.description || ''] }
if (Object.prototype.hasOwnProperty.call(update, 'announce')) return { chat, isGroup: true, sender: actor, messageStubType: 26, messageStubParameters: [update.announce ? 'on' : 'off'] }
if (Object.prototype.hasOwnProperty.call(update, 'restrict')) return { chat, isGroup: true, sender: actor, messageStubType: 25, messageStubParameters: [update.restrict ? 'on' : 'off'] }
if (Object.prototype.hasOwnProperty.call(update, 'inviteCode') || Object.prototype.hasOwnProperty.call(update, 'ephemeralDuration')) return { chat, isGroup: true, sender: actor, messageStubType: 23, messageStubParameters: [] }
if (update.picture || update.imgUrl || update.icon) return { chat, isGroup: true, sender: actor, messageStubType: 22, messageStubParameters: [] }
return null
}

export async function groupsUpdate(updates = []) {
const list = Array.isArray(updates) ? updates : [updates]
for (const update of list) {
try {
const chat = this.decodeJid?.(update?.id) || update?.id
if (!chat || !chat.endsWith('@g.us')) continue
if (!isRealtimeGroupEvent(this, update)) continue
const chatData = global.db?.getChat?.(chat) || global.db?.data?.chats?.[chat]
if (shouldSilenceChatForBot(chatData, normalizeConnectionJid(this))) continue
if (!chatData?.detect) continue
if (update.participants !== undefined && !Array.isArray(update.participants)) continue
if (this.ev === undefined) continue
const stub = buildGroupUpdateStub({ ...update, id: chat })
if (!stub) continue
const groupMetadata = await getGroupMetadataOnDemand(this, chat, { requireParticipants: true })
const participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
if (!participants.length) continue
await autodetectPlugin.before.call(this, stub, { conn: this, participants, groupMetadata: groupMetadata || {} })
} catch (error) {
console.error('[detect] groups.update error', error)
}
}
}

export async function participantsUpdate(update = {}) {
try {
const chat = this.decodeJid?.(update.id) || update.id
if (!chat || !chat.endsWith('@g.us')) return
if (update.participants === undefined || !Array.isArray(update.participants) || !update.participants.length) return
if (this.ev === undefined) return
// Baileys forks may omit timestamps on live participant updates;
// isRealtimeGroupEvent already rejects stale events when timestamps exist.
if (!isRealtimeGroupEvent(this, update)) return
const action = String(update.action || '').toLowerCase()
const messageStubType = action === 'add' || action === 'invite' ? 27 : action === 'remove' || action === 'leave' ? 28 : null
if (!messageStubType) return
const chatData = global.db?.getChat?.(chat) || global.db?.data?.chats?.[chat]
if (shouldSilenceChatForBot(chatData, normalizeConnectionJid(this))) return
if (!chatData?.welcome) return
const groupMetadata = await getGroupMetadataOnDemand(this, chat, { requireParticipants: true })
const participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
const affectedParticipants = Array.isArray(update.participants) ? update.participants.filter(Boolean) : []
const firstParticipant = affectedParticipants[0]
const sender = typeof firstParticipant === 'object' ? (firstParticipant.id || firstParticipant.jid || firstParticipant.lid || '') : firstParticipant
const m = {
chat,
isGroup: true,
sender,
messageStubType,
messageStubParameters: affectedParticipants,
}
await welcomePlugin.before.call(this, m, { conn: this, participants, groupMetadata: groupMetadata || {} })
} catch (error) {
console.error('[welcome] group-participants.update error', error)
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

export default { handler }
