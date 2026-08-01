import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { smsg } from '../library/simple.js'
import { getPrefixMatch, hydrateDatabaseForMessage, buildPermissionContext } from '../router/handler-utils.js'
import { getGroupMetadataOnDemand } from '../library/global-cache.js'
import { canManageBotSecurity, getAntiPrivateState, isChatBannedForBot, normalizeSessionJid, shouldSilenceChatForBot } from '../core/session-utils.js'
import { messageHasModeratedLink, runAutoModeration } from '../core/moderation-utils.js'

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
this.stages = [this.normalize.bind(this), this.security.bind(this), this.rateLimit.bind(this), this.route.bind(this)]
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
if (m.isGroup && shouldSilenceChatForBot(chatData, normalizeSessionJid(conn?.user?.jid || conn?.user?.id || '')) && !ctx.commandName) ctx.halted = true
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
if (ctx.m.isGroup && (permissions.admin || permissions.botAdmin || permissions.group || ctx.needsModeration)) {
groupMetadata = await getGroupMetadataOnDemand(ctx.conn, ctx.m.chat, { requireParticipants: true }).catch(() => ({}))
participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []
}
ctx.permissionContext = buildPermissionContext(ctx.conn, ctx.m, ctx.sender, participants)
if (ctx.needsModeration && await runAutoModeration(ctx.conn, ctx.m, ctx.sender, ctx.permissionContext)) ctx.halted = true
if (ctx.halted) return
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
}

export default MiddlewarePipeline
