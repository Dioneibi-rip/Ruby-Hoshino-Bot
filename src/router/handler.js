import { smsg } from '../infra/simple.js'
import * as ws from 'ws'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import failureHandler from '../infra/respuesta.js'
import welcomePlugin from '../modules/functions/_welcome.js'
import autodetectPlugin from '../modules/enable/_autodetect.js'
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
import { canManageBotSecurity, getAntiPrivateState, getPrimaryBotJid, isChatBannedForBot, normalizeSessionJid, shouldSilenceChatForBot } from '../core/session-utils.js'
import { attachSessionState, cleanupSessionState } from '../core/session-manager.js'
import messageQueue from '../core/message-queue.js'
import { normalizeIdentityJid, normalizeJid } from '../core/identity-utils.js'
import { getMessageDeletePayload, isUserMutedInChat, messageHasModeratedLink, runAutoModeration } from '../core/moderation-utils.js'
import { getGroupMetadataOnDemand } from '../infra/global-cache.js'
import { getInteractiveResponseText, getRawCommandName, getRawFastPath as buildRawFastPath, getRawMessageChat, getRawMessageText, getRawStickerHash, isFreshRawMessage, unwrapMessageContent } from './raw-filter.js'
import { executePlugin } from './plugin-executor.js'
import { isBotSender, pluginRequiresGroupParticipants } from './permission-guard.js'

global.uptimeStart = Date.now()

const SYSTEM_MESSAGE_MAX_AGE_MS = 60_000
const IGNORED_BAILEYS_IDS = [/^NJX-/, /^BAE5.{12}$/, /^B24E.{16}$/]
const UNBAN_COMMAND_FILES = ['grupo-unbanchat.js', 'enable/grupo-unbanchat.js', 'grupo-resetbot.js', 'enable/grupo-resetbot.js']
const CELESTIAL_COMMANDS = new Set(['resetbot', 'unbanchat', 'desbanearchat'])
const REALTIME_EVENT_GRACE_MS = 15_000
const REALTIME_EVENT_MAX_AGE_MS = 60_000
const READ_MESSAGE_MIN_INTERVAL_MS = 1_500
const PRIMARY_BOT_CACHE = global.__rubyPrimaryBotCache ||= new Map()
const PRIMARY_BOT_EMPTY = ''



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
const command = getRawCommandName(getRawMessageText(message) || getStickerCommandText(getRawStickerHash(message)))
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
conn.__rubyReadMessagesLast ||= new Map()
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
const text = getRawMessageText(message) || getStickerCommandText(getRawStickerHash(message))
return isCelestialCommandText(text)
}

function canBypassSilencedChat(message = {}) {
return isCelestialCommandMessage(message)
}

async function forceResetBotState(conn, m, sender, participantsByLid = null) {
let normalizedSender = sender
if (m?.isGroup && participantsByLid) normalizedSender = normalizeLidReferences(m, normalizedSender, participantsByLid)
normalizedSender = await normalizeMessageIdentifiers(conn, m, normalizedSender, participantsByLid)
if (!isAuthorizedOwner(normalizedSender)) return true
const chat = global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat]
if (!chat) return true
chat.primaryBot = null
chat.botPrimario = null
forgetPrimaryBot(m.chat)
chat.isBanned = {}
chat.bannedBots = []
if (chat.botSettings && typeof chat.botSettings === 'object') {
for (const settings of Object.values(chat.botSettings)) {
if (settings && typeof settings === 'object') settings.isBanned = false
}
}
rememberPrimaryBot(m.chat, chat)
global.db?.updateChat?.(m.chat, chat)
await global.db?.write?.()
cleanupSessionState(conn)
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

function getStickerCommandText(hash = '') {
if (!hash) return ''
try {
const record = global.db?.getStickerCommand?.(hash) || global.db?.getSection?.('sticker')?.[hash] || global.db?.data?.sticker?.[hash]
return typeof record?.text === 'string' ? record.text.trim() : ''
} catch (error) {
console.error('[sticker-cmd] no se pudo consultar el comando del sticker', error)
return ''
}
}

function hydrateStickerCommandText(m = {}) {
if (m.text) return false
const text = getStickerCommandText(getStickerHashFromMessage(m))
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

function shouldIgnoreBaileysMessage(m) {
if (!m?.fromMe && !m?.isBaileys) return false
const id = m?.id || m?.key?.id || ''
return IGNORED_BAILEYS_IDS.some((pattern) => pattern.test(id))
}

function normalizeConnectionJid(conn) {
return normalizeSessionJid(conn?.user?.jid || conn?.user?.id || conn)
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
if (PRIMARY_BOT_CACHE.has(chatId)) return PRIMARY_BOT_CACHE.get(chatId) || PRIMARY_BOT_EMPTY
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
return !isCurrentBotPrimaryForCachedChat(conn, chatId)
}

function enforcePrimaryBotMiddleware(conn, m = {}) {
if (!m?.isGroup || isCelestialCommandText(m?.text || '')) return false
const primaryBot = getCachedPrimaryBot(m.chat)
if (!primaryBot) return false
const chat = getFreshChatRecord(m.chat)
const currentBot = normalizeConnectionJid(conn)
if (!currentBot || currentBot !== primaryBot) return true
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
const current = global.db?.getUser?.(sender)
const nextMsgCount = (Number(current?.msg_count) || 0) + 1
if (current) global.db.updateUser(sender, {
exp: (Number(current.exp) || 0) + (m.exp || 0),
coin: (Number(current.coin) || 0) - ((m.coin || 0) * 1),
msg_count: nextMsgCount
})
global.db?.scheduleFlush?.()
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
attachSessionState(this)
runMaintenance(this)
const messages = getIncomingMessages(chatUpdate)
if (!messages.length) return
if (global.db && global.db.data == null) await global.loadDatabase?.()
const fastMessages = []
for (const message of messages) {
const rawChat = this?.decodeJid?.(getRawMessageChat(message)) || getRawMessageChat(message)
if (rawChat?.endsWith?.('@g.us') && shouldBlockForPrimaryBot(this, rawChat) && !canBypassSilencedChat(message)) continue
const fastPath = getRawFastPath(this, message)
if (!fastPath) {
if (isFreshRawMessage(message, SYSTEM_MESSAGE_MAX_AGE_MS)) trackLocalGroupActivity(this, message, getActivitySenderFromRaw(message), { countMessage: true, isCommand: false })
continue
}
message.__rubyFastPath = fastPath
fastMessages.push(message)
}
if (!fastMessages.length) return
const liveMessages = fastMessages.filter((message) => shouldProcessRawGroupMessage(this, message))
if (!liveMessages.length) return
this.pushMessage?.(liveMessages).catch(console.error)
for (const rawMessage of liveMessages) {
const key = getQueueKey(rawMessage)
const priority = getMessageQueuePriority(rawMessage)
messageQueue.enqueue(key, () => processMessage.call(this, chatUpdate, rawMessage), { chatKey: getQueueChatKey(rawMessage), priority })
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
const groupMetadata = m.isGroup ? await getGroupMetadataOnDemand(this, m.chat, { requireParticipants: true }) : {}
const participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
const participantsByLid = m.isGroup ? createParticipantIndex(participants) : null
await forceResetBotState(this, m, sender, participantsByLid)
return
}

const prefixMatch = fastPath.usedPrefix ? [[fastPath.usedPrefix], null] : getPrefixMatch(this, {}, m.text)
const parsed = fastPath.parsed || (prefixMatch?.[0]?.[0] ? parseCommand(m.text, prefixMatch[0][0]) : null)
const commandEntry = fastPath.commandEntry || (parsed?.command ? commandsMap.get(parsed.command) : null)
const requiresPersistence = Boolean(commandEntry || fastPath.needsModeration || rawCommand === 'resetbot')
if (!requiresPersistence) {
if (parsed?.command && prefixMatch?.[0]?.[0]) {
m.__skipStats = true
await runInvalidCommandNotice(this, m, parsed, prefixMatch[0][0])
}
return
}

sender = m.isGroup ? (m.key?.participant || m.sender) : (m.key?.remoteJid || m.sender)
if (!sender) return
m.__deleteKey = m.key ? { ...m.key } : null
const needsParticipants = Boolean(m.isGroup && (fastPath.needsModeration || pluginRequiresGroupParticipants(commandEntry?.plugin)))
const requiresFreshAdminMetadata = Boolean(commandEntry?.plugin?.admin || commandEntry?.plugin?.botAdmin || commandEntry?.plugin?.needsParticipants)
let groupMetadata = needsParticipants ? await getGroupMetadataOnDemand(this, m.chat, { requireParticipants: true, force: requiresFreshAdminMetadata }) : {}
let participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
let participantsByLid = m.isGroup ? createParticipantIndex(participants) : null
sender = normalizeLidReferences(m, sender, participantsByLid)
sender = await normalizeMessageIdentifiers(this, m, sender, participantsByLid)
if (needsParticipants && (!participants.length || !participants.some((participant) => {
const ids = [participant?.jid, participant?.id, participant?.lid].filter(Boolean).map((jid) => String(this.decodeJid?.(jid) || jid).split('@')[0])
const senderNumber = String(this.decodeJid?.(sender) || sender).split('@')[0]
return senderNumber && ids.includes(senderNumber)
}))) {
groupMetadata = await getGroupMetadataOnDemand(this, m.chat, { requireParticipants: true, force: true })
participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
participantsByLid = m.isGroup ? createParticipantIndex(participants) : null
sender = normalizeLidReferences(m, sender, participantsByLid)
sender = await normalizeMessageIdentifiers(this, m, sender, participantsByLid)
}

m.exp = 0
m.coin = false
const { user: _user, settings } = hydrateDatabaseForMessage(this, m, sender)
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

if (!commandEntry && !parsed?.command) return

const pluginDir = getPluginDirectory()
for (const hook of global.allHooks || allHooks || []) {
const { name, plugin } = hook || {}
if (!plugin || plugin.disabled) continue
const __filename = join(pluginDir, name)
const baseContext = { chatUpdate, __dirname: pluginDir, __filename }
await runPluginHooks(this, plugin, name, m, baseContext)
if (m.__pluginHalt) return
}
for (const hook of global.beforeHooks || beforeHooks || []) {
const chatDataForAdminMode = m.isGroup ? getFreshChatRecord(m.chat) : null
if (parsed?.command && prefixMatch?.[0]?.[0] && chatDataForAdminMode?.modoadmin && !isAdmin && !isOwner && !isROwner) return
const { name, plugin } = hook || {}
if (!plugin || plugin.disabled) continue
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
await executePlugin(this, plugin, name, m, extra, permissionContext, sender, { chat: chatData, user: global.db?.data?.users?.[sender], isCelestialCommand })
} catch (error) {
console.error(error)
} finally {
try {
if (!m?.__skipStats) await updateStatsAndEconomy(this, m, sender)
} catch (error) {
console.error(error)
}
try {
if (!((this.opts || global.opts || {}).noprint) && m) await (await import('../infra/print.js')).default(m, this)
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
const stub = buildGroupUpdateStub({ ...update, id: chat })
if (!stub) continue
const groupMetadata = await getGroupMetadataOnDemand(this, chat, { requireParticipants: true })
await autodetectPlugin.before.call(this, stub, { conn: this, participants: groupMetadata?.participants || [], groupMetadata: groupMetadata || {} })
} catch (error) {
console.error('[detect] groups.update error', error)
}
}
}

export async function participantsUpdate(update = {}) {
try {
const chat = this.decodeJid?.(update.id) || update.id
if (!chat || !chat.endsWith('@g.us')) return
if (!isRealtimeGroupEvent(this, update)) return
const action = String(update.action || '').toLowerCase()
const messageStubType = action === 'add' || action === 'invite' ? 27 : action === 'remove' || action === 'leave' ? 28 : null
if (!messageStubType) return
const chatData = global.db?.getChat?.(chat) || global.db?.data?.chats?.[chat]
if (shouldSilenceChatForBot(chatData, normalizeConnectionJid(this))) return
if (!chatData?.welcome) return
const groupMetadata = await getGroupMetadataOnDemand(this, chat, { requireParticipants: true })
const m = {
chat,
isGroup: true,
sender: Array.isArray(update.participants) ? update.participants[0] : '',
messageStubType,
messageStubParameters: Array.isArray(update.participants) ? update.participants : [],
}
await welcomePlugin.before.call(this, m, { conn: this, participants: groupMetadata?.participants || [], groupMetadata: groupMetadata || {} })
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
