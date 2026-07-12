import { smsg } from '../infra/simple.js'
import { format } from 'util'
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
getCachedGroupMetadata,
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
import { getCooldownKey, getCooldownSeconds, isRedisReady, redis, setRedisWithTTL } from '../infra/redis.js'
import { normalizeIdentityJid } from '../core/identity-utils.js'
import { getMessageDeletePayload, isUserMutedInChat, messageHasModeratedLink, runAutoModeration } from '../core/moderation-utils.js'

global.uptimeStart = Date.now()

const SYSTEM_MESSAGE_MAX_AGE_MS = 60_000
const IGNORED_BAILEYS_IDS = [/^NJX-/, /^BAE5.{12}$/, /^B24E.{16}$/]
const UNBAN_COMMAND_FILES = ['grupo-unbanchat.js', 'enable/grupo-unbanchat.js', 'grupo-resetbot.js', 'enable/grupo-resetbot.js']
const CELESTIAL_COMMANDS = new Set(['resetbot', 'unbanchat', 'desbanearchat'])
const REALTIME_EVENT_GRACE_MS = 15_000
const REALTIME_EVENT_MAX_AGE_MS = 60_000


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

function unwrapMessageContent(content = {}) {
return content?.ephemeralMessage?.message
|| content?.viewOnceMessage?.message
|| content?.viewOnceMessageV2?.message
|| content?.documentWithCaptionMessage?.message
|| content
}

function getRawMessageChat(message = {}) {
return message?.key?.remoteJid || message?.chat || message?.remoteJid || ''
}

function getRawMessageText(message = {}) {
const content = unwrapMessageContent(message?.message || message)
return content?.conversation
|| content?.extendedTextMessage?.text
|| content?.imageMessage?.caption
|| content?.videoMessage?.caption
|| content?.documentMessage?.caption
|| content?.buttonsResponseMessage?.selectedButtonId
|| content?.listResponseMessage?.singleSelectReply?.selectedRowId
|| content?.templateButtonReplyMessage?.selectedId
|| ''
}

function getRawStickerHash(message = {}) {
const content = unwrapMessageContent(message?.message || message)
const sha = content?.stickerMessage?.fileSha256 || content?.imageMessage?.fileSha256
if (!sha) return ''
try {
return Buffer.from(sha).toString('base64')
} catch {
return ''
}
}

function getRawCommandName(text = '') {
const trimmed = String(text || '').trim()
const match = trimmed.match(/^[#!./\\](\S+)/)
return match?.[1]?.toLowerCase() || ''
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

function isCelestialCommandMessage(message = {}) {
const text = getRawMessageText(message) || getStickerCommandText(getRawStickerHash(message))
return isCelestialCommandText(text)
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
chat.isBanned = {}
chat.bannedBots = []
if (chat.botSettings && typeof chat.botSettings === 'object') {
for (const settings of Object.values(chat.botSettings)) {
if (settings && typeof settings === 'object') settings.isBanned = false
}
}
global.db?.updateChat?.(m.chat, chat)
cleanupSessionState(conn)
if (conn === global.conn && typeof global.reloadHandler === 'function') {
setTimeout(() => global.reloadHandler(true).catch(console.error), 500).unref?.()
}
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
if (isCelestialCommandMessage(message)) return true
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

function isFreshMessage(message) {
const rawTimestamp = Number(message?.messageTimestamp || 0)
const messageTime = rawTimestamp > 0 ? rawTimestamp * 1000 : Date.now()
return Date.now() - messageTime <= SYSTEM_MESSAGE_MAX_AGE_MS
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

function getFreshChatRecord(chatId = '') {
if (!chatId) return null
try {
const chat = global.db?.getChat?.(chatId)
if (chat) return chat
} catch (error) {
console.error('[primary-bot] no se pudo consultar el chat en SQLite', error)
}
return global.db?.data?.chats?.[chatId] || null
}

function shouldBlockForPrimaryBot(conn, chatId = '') {
const chat = getFreshChatRecord(chatId)
const primaryBot = getPrimaryBotJid(chat)
if (!primaryBot) return false
const currentBot = normalizeConnectionJid(conn)
return Boolean(currentBot && currentBot !== primaryBot)
}

function enforcePrimaryBotMiddleware(conn, m = {}) {
if (!m?.isGroup || isCelestialCommandText(m?.text || '')) return false
const chat = getFreshChatRecord(m.chat)
const primaryBot = getPrimaryBotJid(chat)
if (!primaryBot) return false
const currentBot = normalizeConnectionJid(conn)
if (!currentBot || currentBot !== primaryBot) return true
if (chat && typeof chat === 'object') {
if (chat.primaryBot !== primaryBot) chat.primaryBot = primaryBot
if (chat.botPrimario !== primaryBot) chat.botPrimario = primaryBot
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

function isSameJid(a, b) {
const left = String(a || '').split('@')[0]
const right = String(b || '').split('@')[0]
return Boolean(left && right && left === right)
}

function isBotSender(conn, m, sender) {
const botJid = conn?.decodeJid?.(conn?.user?.jid) || conn?.user?.jid
return Boolean(m?.fromMe || isSameJid(sender, botJid))
}

function formatCooldownTime(seconds) {
const safeSeconds = Math.max(1, Number(seconds) || 1)
const hours = Math.floor(safeSeconds / 3600)
const minutes = Math.floor((safeSeconds % 3600) / 60)
const remainingSeconds = safeSeconds % 60
const parts = []
if (hours) parts.push(`*${hours}* hora${hours === 1 ? '' : 's'}`)
if (minutes) parts.push(`*${minutes}* minuto${minutes === 1 ? '' : 's'}`)
if (remainingSeconds || !parts.length) parts.push(`*${remainingSeconds}* segundo${remainingSeconds === 1 ? '' : 's'}`)
return parts.join(' y ')
}

function getCooldownMessage(plugin, remainingSeconds) {
const customMessage = plugin?.cooldownMessage || plugin?.cooldownText || plugin?.cooldownReply
if (typeof customMessage === 'function') return customMessage(remainingSeconds, formatCooldownTime(remainingSeconds), segundosAHMS(remainingSeconds))
if (typeof customMessage === 'string') {
return customMessage
.replace(/%time%/g, formatCooldownTime(remainingSeconds))
.replace(/%hms%/g, segundosAHMS(remainingSeconds))
.replace(/%seconds%/g, String(remainingSeconds))
}
return null
}


async function claimRedisCooldown(conn, plugin, name, m, command, sender, bypass = false) {
if (bypass || !pluginUsesRedisCooldown(plugin)) return { claimed: false, allowed: true, key: null }
if (!isRedisReady()) return { claimed: false, allowed: true, key: null }
const seconds = getCooldownSeconds(plugin)
const key = getCooldownKey(command || name, sender)
try {
const ttl = await redis.ttl(key)
if (ttl > 0) {
const message = getCooldownMessage(plugin, ttl)
if (message) await conn.reply(m.chat, message, m)
return { claimed: false, allowed: false, key }
}
const result = await setRedisWithTTL(key, '1', seconds, 'NX')
if (result === 'OK') return { claimed: true, allowed: true, key }
const remainingSeconds = Math.max(1, await redis.ttl(key))
const message = getCooldownMessage(plugin, remainingSeconds)
if (message) await conn.reply(m.chat, message, m)
return { claimed: false, allowed: false, key }
} catch (error) {
console.error('[redis] cooldown claim error', error)
return { claimed: false, allowed: true, key }
}
}


async function releaseRedisCooldown(cooldownState) {
if (!cooldownState?.claimed || !cooldownState?.key || !isRedisReady()) return
try {
await redis.del(cooldownState.key)
} catch (error) {
console.error('[redis] cooldown release error', error)
}
}

function getInvalidCommandMessage(command, usedPrefix) {
const suggestion = commandsMap?.size ? [...commandsMap.keys()].find((name) => name && command && (name.startsWith(command[0]) || command.startsWith(name[0]))) : null
const hint = suggestion ? `\n\n✧ Quizás quisiste usar *${usedPrefix}${suggestion}*` : ''
return `✧ El comando *${usedPrefix}${command || ''}* no existe.${hint}`
}

async function runInvalidCommandNotice(conn, m, parsed, usedPrefix) {
if (!parsed?.command || !usedPrefix) return
if (isBotSender(conn, m, m?.sender)) return
if (shouldIgnoreBaileysMessage(m)) return
if (m.__invalidCommandNotified) return
m.__invalidCommandNotified = true
await conn.reply?.(m.chat, getInvalidCommandMessage(parsed.command, usedPrefix), m)
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

function buildPluginContext(conn, context = {}) {
return {
...context,
conn,
sock: conn,
socket: conn,
baileys: global.baileys || global.Baileys || {},
}
}

async function runPluginHooks(conn, plugin, name, m, context) {
if (typeof plugin?.all === 'function') {
try {
await plugin.all.call(conn, m, buildPluginContext(conn, context))
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
const isBotSelf = isBotSender(conn, m, sender)
const canBypassGroupRestrictions = isBotSelf || isOwner || isROwner
const isEconomyPremium = Boolean(global.db?.data?.users?.[sender]?.premium === true || (global.prems || []).map((v) => String(v).replace(/[^0-9]/g, '')).includes(String(sender || '').split('@')[0].replace(/[^0-9]/g, '')))
const fail = plugin.fail || global.dfail
const chat = getFreshChatRecord(m.chat)
const user = global.db?.data?.users?.[sender]

const isBotSecurityManager = canManageBotSecurity(sender, conn)
if (m.isGroup && !CELESTIAL_COMMANDS.has(extra.command) && !UNBAN_COMMAND_FILES.includes(name) && isChatBannedForBot(chat, normalizeConnectionJid(conn)) && !isBotSelf && !isBotSecurityManager) return true
if (m.text && user?.banned && !isBotSelf) {
if (!user.lastBanMsg || Date.now() - user.lastBanMsg > 30_000) {
m.reply(`《✦》Estas baneado/a, no puedes usar comandos en este bot!\n\n${user.bannedReason ? `✰ *Motivo:* ${user.bannedReason}` : '✰ *Motivo:* Sin Especificar'}\n\n> ✧ Si este Bot es cuenta ...`)
global.db?.updateUser?.(sender, { lastBanMsg: Date.now() })
}
return true
}
if (user?.antispam && !user.banned) user.antispam = 0

const adminMode = chat?.modoadmin
if (adminMode && m.isGroup && !isAdmin && !canBypassGroupRestrictions) return true
if (!canBypassGroupRestrictions && plugin.botAdmin && !isBotAdmin) { fail('botAdmin', m, conn); return false }
if (plugin.rowner && !isROwner && !isBotSelf) { fail('rowner', m, conn); return false }
if (plugin.owner && !isOwner && !isBotSelf) { fail('owner', m, conn); return false }
if (plugin.mods && !isMods && !isBotSelf) { fail('mods', m, conn); return false }
if (!canBypassGroupRestrictions && plugin.premium && !isPrems) { fail('premium', m, conn); return false }
if (!canBypassGroupRestrictions && plugin.admin && !isAdmin) { fail('admin', m, conn); return false }
if (!isBotSelf && plugin.private && m.isGroup) { fail('private', m, conn); return false }
if (!isBotSelf && plugin.group && !m.isGroup) { fail('group', m, conn); return false }
if (!isBotSelf && pluginNeedsJob(plugin, name, extra.command) && !userHasJob(user)) {
conn.reply(m.chat, `💼 Primero debes elegir una chamba. Usa *${extra.usedPrefix}trabajo lista* y luego *${extra.usedPrefix}trabajo elegir <trabajo>* para desbloquear la economía RPG.`, m)
return false
}

m.isCommand = true
const xp = 'exp' in plugin ? parseInt(plugin.exp) : 17
if (xp > 200) m.reply('chirrido -_-')
else m.exp += xp

if (!isBotSelf && !isEconomyPremium && plugin.coin && (global.db?.data?.users?.[sender]?.coin || 0) < plugin.coin * 1) {
conn.reply(m.chat, `❮✦❯ Se agotaron tus ${m.moneda}`, m)
return false
}
if (!isBotSelf && plugin.level > (user?.level || 0)) {
conn.reply(m.chat, `❮✦❯ Se requiere el nivel: *${plugin.level}*\n\n• Tu nivel actual es: *${user?.level || 0}*\n\n• Usa este comando para subir de nivel:\n*${extra.usedPrefix}levelup*`, m)
return false
}

const cooldownState = await claimRedisCooldown(conn, plugin, name, m, extra.command, sender, isBotSelf)
if (!cooldownState.allowed) return false

let pluginResult
try {
pluginResult = await plugin.call(conn, m, extra)
const pluginSucceeded = pluginResult !== false && !m.error
m.pluginFailed = !pluginSucceeded
if (!pluginSucceeded) await releaseRedisCooldown(cooldownState)
if (pluginSucceeded && !isEconomyPremium && !isBotSelf) m.coin = m.coin || plugin.coin || false
} catch (error) {
m.error = error
await releaseRedisCooldown(cooldownState)
console.error(error)
if (error) m.reply(sanitizeError(error))
m.pluginFailed = true
pluginResult = false
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
return pluginResult !== false
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
const messages = getIncomingMessages(chatUpdate).filter(isFreshMessage)
if (!messages.length) return
if (global.db && global.db.data == null) await global.loadDatabase?.()
const liveMessages = messages.filter((message) => shouldProcessRawGroupMessage(this, message))
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
m = smsg(this, rawMessage) || rawMessage
if (!m) return
const opts = this.opts || global.opts || {}
if (typeof m.text !== 'string') m.text = ''
hydrateStickerCommandText(m)
await global.updateMessageGlobals?.(m, this)
hydrateStickerCommandText(m)

const rawCommand = getRawCommandName(m.text)
if (rawCommand === 'resetbot') {
sender = m.isGroup ? (m.key?.participant || m.sender) : (m.key?.remoteJid || m.sender)
if (!sender) return
const groupMetadata = m.isGroup ? await getCachedGroupMetadata(this, m.chat) : {}
const participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
const participantsByLid = m.isGroup ? createParticipantIndex(participants) : null
await forceResetBotState(this, m, sender, participantsByLid)
return
}

if (enforcePrimaryBotMiddleware(this, m)) return

if (m.isGroup && !isCelestialCommandText(m.text)) {
if (shouldBlockForPrimaryBot(this, m.chat)) return
const chat = getFreshChatRecord(m.chat)
const hasActiveAntiLink = Boolean(chat?.antiLink || chat?.antilink)
if (isChatBannedForBot(chat, normalizeConnectionJid(this)) && !(hasActiveAntiLink && messageHasModeratedLink(m))) return
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
if (enforcePrimaryBotMiddleware(this, m)) return

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
const chatDataForAdminMode = m.isGroup ? getFreshChatRecord(m.chat) : null
if (parsed?.command && prefixMatch?.[0]?.[0] && chatDataForAdminMode?.modoadmin && !isAdmin && !isOwner && !isROwner) return
const { name, plugin } = hook || {}
if (!plugin || plugin.disabled) continue
if (!opts.restrict && plugin.tags?.includes?.('admin')) continue
const __filename = join(pluginDir, name)
const match = getPrefixMatch(this, plugin, m.text)
const beforeContext = buildPluginContext(this, { match, participants, groupMetadata, user: userGroup, bot: botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: pluginDir, __filename })
const beforeResult = await plugin.before.call(this, m, beforeContext)
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
const extra = buildPluginContext(this, { match, usedPrefix, ...commandParsed, participants, groupMetadata, user: userGroup, bot: botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: pluginDir, __filename })
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
const groupMetadata = await getCachedGroupMetadata(this, chat)
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
const groupMetadata = await getCachedGroupMetadata(this, chat)
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
