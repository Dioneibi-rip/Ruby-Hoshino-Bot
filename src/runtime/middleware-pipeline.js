import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { smsg } from '../library/simple.js'
import { getPrefixMatch, hydrateDatabaseForMessage, buildPermissionContext, beforeHooks, allHooks } from '../router/handler-utils.js'
import { getGroupMetadataOnDemand } from '../library/global-cache.js'
import { canManageBotSecurity, getAntiPrivateState, isChatBannedForBot, normalizeSessionJid, shouldSilenceChatForBot } from '../core/session-utils.js'
import { messageHasModeratedLink, runAutoModeration } from '../core/moderation-utils.js'
import { buildGuardContext, pluginNeedsJob, pluginRequiresGroupParticipants, runPluginGuards, userHasJob } from '../router/permission-guard.js'
import { getNativeBotProfile, hydrateBotProfile } from '../core/botProfileStore.js'
import { formatCooldown, getCanonicalCommand, peekCooldownMs, resolveCooldownMs } from '../library/cooldown-store.js'
import { buildCooldownNotice, replyWithFkontak } from '../core/notice.js'

const DEFAULT_RATE_LIMIT_WINDOW_MS = 3_000
const DEFAULT_RATE_LIMIT_MAX = 6
const PRIMARY_RESET_COMMANDS = new Set(['resetbot', 'resetprimary', 'delprimary'])

function isPrimaryResetRequest(text = '') {
const stripped = String(text || '').trim().toLowerCase().replace(/^[#/!.@]+/, '')
if (!stripped) return false
return PRIMARY_RESET_COMMANDS.has(stripped.split(/\s+/)[0])
}

function parseCommandText(text = '', usedPrefix = '') {
const raw = String(text || '').trim()
const body = usedPrefix && raw.startsWith(usedPrefix) ? raw.slice(usedPrefix.length).trim() : raw
const args = body ? body.split(/\s+/).filter(Boolean) : []
const command = String(args.shift() || '').toLowerCase()
return { raw, body, command, args, text: args.join(' '), usedPrefix, prefix: usedPrefix }
}

function getSender(conn, m) {
if (m?.fromMe) return jidNormalizedUser(conn?.user?.id || conn?.user?.jid || m.sender || '')
return m?.isGroup ? m?.key?.participant || m?.sender : m?.key?.remoteJid || m?.sender
}

function getRateStore(conn) {
if (!(conn.__rubyRateLimit instanceof Map)) conn.__rubyRateLimit = new Map()
return conn.__rubyRateLimit
}

function isOwner(sender = '') {
const number = String(sender || '').replace(/[^0-9]/g, '')
return Boolean(number && (global.owner || []).some(owner => String(Array.isArray(owner) ? owner[0] : owner).replace(/[^0-9]/g, '') === number))
}

export class MiddlewarePipeline {
constructor({ registry, db = global.db, rateLimitWindowMs = DEFAULT_RATE_LIMIT_WINDOW_MS, rateLimitMax = DEFAULT_RATE_LIMIT_MAX } = {}) {
this.registry = registry
this.db = db
this.rateLimitWindowMs = rateLimitWindowMs
this.rateLimitMax = rateLimitMax
this.stages = [this.normalize.bind(this), this.security.bind(this), this.afkReturn.bind(this), this.pluginHooks.bind(this), this.automoderation.bind(this), this.rateLimit.bind(this), this.route.bind(this)]
this.rateSweepAt = 0
}

async run(input = {}) {
const ctx = { ...input, db: input.db || this.db, halted: false }
for (const stage of this.stages) {
try {
await stage(ctx)
} catch (error) {
console.error('[UPSERT ERROR]:', error)
ctx.halted = true
break
}
if (ctx.halted) break
}
return ctx
}

async normalize(ctx) {
const conn = ctx.conn
try {
if (conn && !conn.botProfile) conn.botProfile = getNativeBotProfile(conn?.session?.id || conn?.user?.jid || 'primary')
hydrateBotProfile(conn)
} catch (error) {
console.error('[UPSERT ERROR]:', error)
if (conn && !conn.botProfile) conn.botProfile = getNativeBotProfile(conn?.session?.id || conn?.user?.jid || 'primary')
}
const raw = ctx.rawMessage || ctx.message
const m = smsg(conn, raw) || raw
if (!m) {
ctx.halted = true
return
}
const text = String(m.text || m.body || m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || '').trim()
if (text && !m.text) m.text = text
m.body ||= text
m.exp = Number(m.exp || 0)
m.coin = Boolean(m.coin)
const match = getPrefixMatch(conn, {}, text)
const usedPrefix = match?.[0]?.[0] || ''
ctx.m = m
ctx.sender = getSender(conn, m)
ctx.isOwner = isOwner(ctx.sender)
ctx.prefixMatch = match
ctx.parsed = usedPrefix ? parseCommandText(text, usedPrefix) : null
ctx.commandName = ctx.parsed?.command || ''
ctx.usedPrefix = usedPrefix
ctx.dbState = hydrateDatabaseForMessage(conn, m, ctx.sender)
}



async afkReturn(ctx) {
if (!ctx.m || ctx.m.fromMe || !ctx.sender) return
const user = global.db?.getUser?.(ctx.sender) || ctx.dbState?.user
if (!user || !(Number(user.afk) > -1) || ctx.commandName === 'afk') return
const ms = Date.now() - Number(user.afk)
const h = Math.floor(ms / 3600000)
const min = Math.floor(ms / 60000) % 60
const sec = Math.floor(ms / 1000) % 60
const timeAfk = [h, min, sec].map(value => value.toString().padStart(2, '0')).join(':')
const reasonText = user.afkReason ? `\n         🧇̫͠ ꒰  *𝖬𝗈𝗍𝗂𝗏𝗈:* ${user.afkReason}` : ''
const returnText = `> 🍰 𝖣𝖾𝗃𝖺𝗌𝗍𝖾     𝖽𝖾     𝖾𝗌𝗍𝖺𝗋     𝗂𝗇𝖺𝖼𝗍𝗂𝗏𝗈     !

୨ㅤ࣪ㅤ︶︶︶︶ ㅤ꒰ 🎀 ꒱ㅤ︶︶︶︶ㅤ࣪ㅤ୧

🍪̮͡ 〣  *𝖳𝗂𝖾𝗆𝗉𝗈     𝖨𝗇𝖺𝖼𝗍𝗂𝗏𝗈:* ${timeAfk}${reasonText}

> \`𝖡𝗂𝖾𝗇𝗏𝖾𝗇𝗂𝖽𝗈     𝖽𝖾     𝗏𝗎𝖾𝗅𝗍𝖺     ♡\``
await ctx.conn.reply?.(ctx.m.chat, returnText, ctx.m, { mentions: [ctx.sender] })
user.afk = -1
user.afkReason = ''
ctx.m.__afkReturnHandled = true
}

async pluginHooks(ctx) {
const extra = { conn: ctx.conn, participants: ctx.participants || [], groupMetadata: ctx.groupMetadata || {}, chatUpdate: ctx.chatUpdate }
for (const { name, plugin } of allHooks) {
try {
const result = await plugin.all.call(ctx.conn, ctx.m, extra)
if (result === false) {
ctx.halted = true
return
}
} catch (error) {
console.error(`[hook:all:${name}]`, error?.stack || error?.message || error)
}
}
for (const { name, plugin } of beforeHooks) {
try {
const result = await plugin.before.call(ctx.conn, ctx.m, extra)
if (result === false) {
ctx.halted = true
return
}
} catch (error) {
console.error(`[hook:before:${name}]`, error?.stack || error?.message || error)
}
}
}

async security(ctx) {
const { conn, m, sender } = ctx
if (!m || !sender) {
ctx.halted = true
return
}
const opts = conn?.opts || global.opts || {}
if (opts.nyimak || (!m.fromMe && opts.self) || (opts.swonly && m.chat !== 'status@broadcast')) ctx.halted = true
if (ctx.halted) return
const chatData = m.chat ? global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat] || {} : {}
const sessionJid = normalizeSessionJid(conn?.user?.jid || conn?.user?.id || '')
const primaryBot = normalizeSessionJid(chatData?.primaryBot || chatData?.botPrimario || chatData?.primaryBotJid || '')
if (m.isGroup && primaryBot && primaryBot !== sessionJid && !isPrimaryResetRequest(m.text)) {
ctx.halted = true
return
}
if (m.isGroup && shouldSilenceChatForBot(chatData, sessionJid) && !ctx.commandName && !messageHasModeratedLink(m)) ctx.halted = true
if (ctx.halted) return
if (!m.fromMe && !m.isGroup && !canManageBotSecurity(sender, conn)) {
const antiPrivateState = getAntiPrivateState(ctx.dbState?.settings || {})
if (antiPrivateState === 'ignore') ctx.halted = true
if (antiPrivateState === 'block') {
await conn.updateBlockStatus?.(sender, 'block').catch(() => {})
ctx.halted = true
}
}
if (ctx.halted) return
ctx.chatData = chatData
ctx.needsModeration = Boolean(m.isGroup && messageHasModeratedLink(m))
}

async automoderation(ctx) {
if (!ctx.needsModeration || !ctx.m?.isGroup) return
const groupMetadata = await getGroupMetadataOnDemand(ctx.conn, ctx.m.chat, { requireParticipants: true }).catch(() => ({}))
const participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
ctx.participants = participants
ctx.groupMetadata = groupMetadata || {}
ctx.permissionContext = buildPermissionContext(ctx.conn, ctx.m, ctx.sender, participants)
if (await runAutoModeration(ctx.conn, ctx.m, ctx.sender, ctx.permissionContext)) ctx.halted = true
}

async rateLimit(ctx) {
if (!ctx.commandName || ctx.isOwner) return
const key = `${ctx.sender}:${ctx.commandName}`
const now = Date.now()
const store = getRateStore(ctx.conn)
const bucket = (store.get(key) || []).filter(ts => now - ts <= this.rateLimitWindowMs)
if (bucket.length >= this.rateLimitMax) {
ctx.halted = true
return
}
bucket.push(now)
store.set(key, bucket)
if (now - this.rateSweepAt > this.rateLimitWindowMs) {
this.rateSweepAt = now
for (const [itemKey, values] of store) if (!values.some(ts => now - ts <= this.rateLimitWindowMs)) store.delete(itemKey)
}
}

async route(ctx) {
if (!ctx.commandName) return
const metadata = this.registry?.get(ctx.commandName)
ctx.commandMetadata = metadata
if (!metadata) return
const permissions = metadata.permissions || {}
if (permissions.group && !ctx.m.isGroup) {
await global.dfail?.('group', ctx.m, ctx.conn)
ctx.halted = true
return
}
if (permissions.owner && !ctx.isOwner) {
await global.dfail?.('owner', ctx.m, ctx.conn)
ctx.halted = true
return
}
let participants = Array.isArray(ctx.participants) ? ctx.participants : []
let groupMetadata = ctx.groupMetadata || {}
if (!participants.length && ctx.m.isGroup && (pluginRequiresGroupParticipants(permissions) || permissions.group)) {
groupMetadata = await getGroupMetadataOnDemand(ctx.conn, ctx.m.chat, { requireParticipants: true }).catch(() => ({}))
participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
ctx.permissionContext = null
}
ctx.permissionContext ||= buildPermissionContext(ctx.conn, ctx.m, ctx.sender, participants)
if (permissions.admin && !ctx.permissionContext.isAdmin && !ctx.permissionContext.isOwner) {
await global.dfail?.('admin', ctx.m, ctx.conn)
ctx.halted = true
return
}
if (permissions.botAdmin && !ctx.permissionContext.isBotAdmin) {
await global.dfail?.('botAdmin', ctx.m, ctx.conn)
ctx.halted = true
return
}
const chatBanned = isChatBannedForBot(ctx.chatData, normalizeSessionJid(ctx.conn?.user?.jid || ctx.conn?.user?.id || ''))
const canBypassBan = ctx.isOwner || canManageBotSecurity(ctx.sender, ctx.conn) || (isPrimaryResetRequest(ctx.m?.text) && (ctx.permissionContext.isAdmin || ctx.permissionContext.isRAdmin))
if (chatBanned && !canBypassBan) ctx.halted = true
ctx.participants = participants
ctx.groupMetadata = groupMetadata
}
formatCooldownTime(ms = 0) {
const totalSeconds = Math.max(1, Math.ceil(Number(ms || 0) / 1000))
const hours = Math.floor(totalSeconds / 3600)
const minutes = Math.floor((totalSeconds % 3600) / 60)
const seconds = totalSeconds % 60
if (hours) return `${hours}h ${minutes}m ${seconds}s`
if (minutes) return `${minutes}m ${seconds}s`
return `${seconds}s`
}

getCommandCooldownMs(command = {}) {
return resolveCooldownMs(command)
}

getCooldownMessage(command, remainingMs, ctx = {}) {
const seconds = Math.max(1, Math.ceil(remainingMs / 1000))
const hms = formatCooldown(remainingMs)
const custom = command?.cooldownMessage || command?.cooldownText || command?.cooldownReply
if (typeof custom === 'function') return custom(seconds, hms, this.formatCooldownTime(remainingMs))
if (typeof custom === 'string') return custom.replace(/%time%|%hms%/g, hms).replace(/%seconds%/g, String(seconds))
return buildCooldownNotice({ usedPrefix: ctx.usedPrefix || '', command: ctx.commandName || '', remaining: hms })
}

async userGuards(ctx, command, extra = {}) {
const sender = jidNormalizedUser(ctx.sender || ctx.m?.sender || '')
ctx.sender = sender || ctx.sender
const user = global.db?.getUser?.(ctx.sender) || ctx.dbState?.data?.users?.[ctx.sender] || ctx.dbState?.user || {}
const needsJob = pluginNeedsJob(command, ctx.commandMetadata?.name, ctx.commandName) || command?.requiresJob || command?.requireJob || command?.requires?.includes?.('job') || command?.requires?.includes?.('work')
if (needsJob && !userHasJob(user)) {
await ctx.conn.reply?.(ctx.m.chat, `💼 Primero debes pactar una chamba con Ruby. Usa *${ctx.usedPrefix}trabajo lista* y luego *${ctx.usedPrefix}trabajo elegir <trabajo>* para abrir la economía RPG.`, ctx.m)
ctx.halted = true
return false
}
const guardContext = buildGuardContext({ conn: ctx.conn, plugin: command, name: ctx.commandMetadata?.name, m: ctx.m, extra, sender: ctx.sender, permissionContext: ctx.permissionContext || {}, chat: ctx.chatData || {}, user, isEconomyPremium: Boolean(user?.premium), fail: command.fail || global.dfail })
const guardResult = await runPluginGuards(guardContext)
if (guardResult.blocked) {
ctx.halted = true
return false
}
ctx.user = user
return true
}

async cooldown(ctx, command) {
if (ctx.isOwner) return true
const cooldownMs = this.getCommandCooldownMs(command)
if (!cooldownMs) return true
const canonical = getCanonicalCommand(command, ctx.commandName)
const aliases = [...new Set([canonical, ctx.commandName].filter(Boolean))]
const remainingMs = await peekCooldownMs(aliases, ctx.sender)
if (remainingMs > 0) {
const notice = this.getCooldownMessage(command, remainingMs, ctx)
await replyWithFkontak(ctx.conn, ctx.m, notice, { name: '⏳ Rᥙby H᥆shіᥒ᥆ · Cᥙᥱᥒ𝗍ᥲ rᥱgrᥱsіvᥲ' })
ctx.halted = true
return false
}
ctx.cooldownMs = cooldownMs
ctx.cooldownCommands = aliases
return true
}

async beforeCommand(ctx, command, extra = {}) {
if (!ctx.permissionContext) ctx.permissionContext = buildPermissionContext(ctx.conn, ctx.m, ctx.sender, ctx.participants || [])
if (!await this.userGuards(ctx, command, extra)) return false
return this.cooldown(ctx, command)
}

}

export default MiddlewarePipeline
