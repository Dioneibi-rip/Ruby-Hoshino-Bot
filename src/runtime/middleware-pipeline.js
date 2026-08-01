import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { smsg } from '../library/simple.js'
import { getPrefixMatch, hydrateDatabaseForMessage, buildPermissionContext } from '../router/handler-utils.js'
import { getGroupMetadataOnDemand } from '../library/global-cache.js'
import { canManageBotSecurity, getAntiPrivateState, isChatBannedForBot, normalizeSessionJid, shouldSilenceChatForBot } from '../core/session-utils.js'
import { messageHasModeratedLink, runAutoModeration } from '../core/moderation-utils.js'
import { buildGuardContext, pluginNeedsJob, runPluginGuards, userHasJob } from '../router/permission-guard.js'

const DEFAULT_RATE_LIMIT_WINDOW_MS = 3_000
const DEFAULT_RATE_LIMIT_MAX = 6

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
this.stages = [this.normalize.bind(this), this.security.bind(this), this.automoderation.bind(this), this.rateLimit.bind(this), this.route.bind(this)]
this.cooldowns = new Map()
}

async run(input = {}) {
const ctx = { ...input, db: input.db || this.db, halted: false }
for (const stage of this.stages) {
await stage(ctx)
if (ctx.halted) break
}
return ctx
}

async normalize(ctx) {
const conn = ctx.conn
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
if (m.isGroup && shouldSilenceChatForBot(chatData, normalizeSessionJid(conn?.user?.jid || conn?.user?.id || '')) && !ctx.commandName && !messageHasModeratedLink(m)) ctx.halted = true
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
if (store.size > 5_000) for (const [itemKey, values] of store) if (!values.some(ts => now - ts <= this.rateLimitWindowMs)) store.delete(itemKey)
}

async route(ctx) {
if (!ctx.commandName) return
const metadata = this.registry?.get(ctx.commandName)
ctx.commandMetadata = metadata
if (!metadata) return
const permissions = metadata.permissions || {}
if (permissions.group && !ctx.m.isGroup) {
await ctx.m.reply?.('Este comando solo puede usarse en grupos.')
ctx.halted = true
return
}
if (permissions.owner && !ctx.isOwner) {
await ctx.m.reply?.('Este comando solo puede usarlo el propietario del bot.')
ctx.halted = true
return
}
let participants = []
let groupMetadata = {}
if (ctx.participants || ctx.groupMetadata) {
participants = ctx.participants || []
groupMetadata = ctx.groupMetadata || {}
} else if (ctx.m.isGroup && (permissions.admin || permissions.botAdmin || permissions.group)) {
groupMetadata = await getGroupMetadataOnDemand(ctx.conn, ctx.m.chat, { requireParticipants: true }).catch(() => ({}))
participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
}
ctx.permissionContext ||= buildPermissionContext(ctx.conn, ctx.m, ctx.sender, participants)
if (permissions.admin && !ctx.permissionContext.isAdmin && !ctx.permissionContext.isOwner) {
await ctx.m.reply?.('Este comando requiere permisos de administrador.')
ctx.halted = true
return
}
if (permissions.botAdmin && !ctx.permissionContext.isBotAdmin) {
await ctx.m.reply?.('Necesito ser administrador para ejecutar este comando.')
ctx.halted = true
return
}
if (isChatBannedForBot(ctx.chatData, normalizeSessionJid(ctx.conn?.user?.jid || ctx.conn?.user?.id || '')) && !ctx.isOwner && !canManageBotSecurity(ctx.sender, ctx.conn)) ctx.halted = true
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
const raw = command?.cooldown ?? command?.cooldownMs ?? command?.cooldownTime ?? 0
const value = Number(raw) || 0
if (value <= 0) return 0
return value < 1000 ? value * 1000 : value
}

getCooldownMessage(command, remainingMs) {
const seconds = Math.max(1, Math.ceil(remainingMs / 1000))
const hms = this.formatCooldownTime(remainingMs)
const custom = command?.cooldownMessage || command?.cooldownText || command?.cooldownReply
if (typeof custom === 'function') return custom(seconds, hms, hms)
if (typeof custom === 'string') return custom.replace(/%time%|%hms%/g, hms).replace(/%seconds%/g, String(seconds))
return `⏳ La esfera de Ruby aún está sellada. Espera *${hms}* antes de invocar de nuevo este comando.`
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
const now = Date.now()
const key = `${ctx.sender}:${ctx.commandName}`
const expiresAt = Number(this.cooldowns.get(key) || 0)
if (expiresAt > now) {
await ctx.conn.reply?.(ctx.m.chat, this.getCooldownMessage(command, expiresAt - now), ctx.m)
ctx.halted = true
return false
}
this.cooldowns.set(key, now + cooldownMs)
if (this.cooldowns.size > 10000) for (const [itemKey, itemExpiresAt] of this.cooldowns) if (itemExpiresAt <= now) this.cooldowns.delete(itemKey)
return true
}

async beforeCommand(ctx, command, extra = {}) {
if (!ctx.permissionContext) ctx.permissionContext = buildPermissionContext(ctx.conn, ctx.m, ctx.sender, ctx.participants || [])
if (!await this.userGuards(ctx, command, extra)) return false
return this.cooldown(ctx, command)
}

}

export default MiddlewarePipeline
