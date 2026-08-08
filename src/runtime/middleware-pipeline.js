import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { smsg } from '../library/simple.js'
import { getPrefixMatch, hydrateDatabaseForMessage, buildPermissionContext, beforeHooks, allHooks } from '../router/handler-utils.js'
import { getGroupMetadataOnDemand, groupMetadataCache } from '../library/global-cache.js'
import { buildParticipantsByLid, normalizeIdentityJid } from '../core/identity-utils.js'
import { rememberMapping, resolveAliasSync } from '../core/lid-registry.js'
import { canManageBotSecurity, getAntiPrivateState, isChatBannedForBot, normalizeSessionJid, shouldSilenceChatForBot } from '../core/session-utils.js'
import { messageHasModeratedLink, runAutoModeration } from '../core/moderation-utils.js'
import { buildGuardContext, pluginNeedsJob, runPluginGuards, userHasJob } from '../router/permission-guard.js'
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

const LID_SUFFIX = /@(?:hosted\.)?lid$/i

function isLid(jid) {
return typeof jid === 'string' && LID_SUFFIX.test(jid)
}

/**
 * Devuelve el primer candidato que ya sea un telefono clasico.
 * Baileys parchado expone estas pistas en la key (`participantPn`, `remoteJidAlt`, ...)
 * y son la fuente mas confiable porque vienen del propio servidor.
 */
function pickPhoneHint(...candidates) {
for (const candidate of candidates) {
if (typeof candidate !== 'string' || !candidate) continue
const normalized = jidNormalizedUser(candidate) || candidate
if (normalized.endsWith('@s.whatsapp.net') && /^\d{7,15}@/.test(normalized)) return normalized
}
return ''
}

/**
 * Resuelve un JID a su telefono canonico siguiendo el orden de confianza:
 *   1. pistas de la propia key del mensaje (`participantPn` / `remoteJidAlt` / ...)
 *   2. `participantsByLid` de la metadata del grupo ya cacheada
 *   3. `signalRepository.lidMapping.getPNForLID()` de Baileys
 * Si nada resuelve, devuelve el `@lid` intacto: es una identidad valida.
 */
async function resolveEntityJid(conn, jid, { hints = [], participantsByLid = null } = {}) {
if (!jid || typeof jid !== 'string') return jid
const normalized = jidNormalizedUser(jid) || jid
if (!isLid(normalized)) return normalized
const cached = resolveAliasSync(normalized)
if (cached) return cached
const hint = pickPhoneHint(...hints)
if (hint) {
rememberMapping(normalized, hint)
return hint
}
const resolved = await normalizeIdentityJid(conn, normalized, participantsByLid)
return resolved || normalized
}

/**
 * Sobreescribe una propiedad de forma SEGURA.
 *
 * `proto.WebMessageInfo.prototype` define `chat`, `sender`, `isGroup`, ... como
 * accessors de SOLO LECTURA (`get()` sin `set()`). Una asignacion directa
 * (`m.chat = x`) en modulos ESM (strict mode) lanza:
 *   TypeError: Cannot set property chat of #<WebMessageInfo> which has only a getter
 *
 * Orden de intentos:
 *   1. Si la propiedad tiene setter propio o es un data-property escribible -> asignacion normal.
 *   2. Si no, se instala un data-property PROPIO en la instancia con `Object.defineProperty`,
 *      lo que sombrea el getter del prototipo sin tocarlo.
 * @returns {boolean} true si el valor quedo aplicado
 */
function safeAssign(target, prop, value) {
if (!target || typeof target !== 'object') return false
try {
const own = Object.getOwnPropertyDescriptor(target, prop)
if (own && (own.writable || typeof own.set === 'function')) {
target[prop] = value
return true
}
if (!own) {
// Buscamos un setter heredado (ej. `mentionedJid` / `text` en el prototipo parchado).
let proto = Object.getPrototypeOf(target)
while (proto) {
const inherited = Object.getOwnPropertyDescriptor(proto, prop)
if (inherited) {
if (typeof inherited.set === 'function') {
target[prop] = value
return true
}
break
}
proto = Object.getPrototypeOf(proto)
}
}
if (own && !own.configurable) return false
Object.defineProperty(target, prop, { value, writable: true, enumerable: true, configurable: true })
return true
} catch (error) {
console.error('[identity] no se pudo sobreescribir', prop, error?.message || error)
return false
}
}

/**
 * Localiza el `contextInfo` REAL (mutable) del mensaje.
 *
 * `m.mentionedJid` y `m.quoted` son getters que derivan de aqui; para que un cambio
 * sobreviva hay que escribir en este objeto y no en el valor derivado.
 * Se prioriza `extendedTextMessage` (menciones de texto) y luego cualquier
 * `contextInfo` anidado (captions de imagen/video, botones, etc.).
 */
function getContextInfo(m) {
if (!m?.message || typeof m.message !== 'object') return null
const direct = m.message.extendedTextMessage?.contextInfo
if (direct && typeof direct === 'object') return direct
const seen = new Set()
const walk = (node, depth = 0) => {
if (!node || typeof node !== 'object' || depth > 6 || seen.has(node)) return null
seen.add(node)
if (node.contextInfo && typeof node.contextInfo === 'object') return node.contextInfo
for (const value of Object.values(node)) {
if (!value || typeof value !== 'object') continue
const found = walk(value, depth + 1)
if (found) return found
}
return null
}
return walk(m.msg) || walk(m.message)
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
if (!sender) return false
// Un `@lid` sin mapeo conocido NO se compara por digitos: el numero interno de un
// LID no es un telefono y compararlo podria dar un falso positivo de owner.
const canonical = resolveAliasSync(sender) || sender
if (isLid(canonical)) return false
const number = String(canonical).replace(/[^0-9]/g, '')
return Boolean(number && (global.owner || []).some(owner => String(Array.isArray(owner) ? owner[0] : owner).replace(/[^0-9]/g, '') === number))
}

export class MiddlewarePipeline {
constructor({ registry, db = global.db, rateLimitWindowMs = DEFAULT_RATE_LIMIT_WINDOW_MS, rateLimitMax = DEFAULT_RATE_LIMIT_MAX } = {}) {
this.registry = registry
this.db = db
this.rateLimitWindowMs = rateLimitWindowMs
this.rateLimitMax = rateLimitMax
this.stages = [this.normalize.bind(this), this.identity.bind(this), this.security.bind(this), this.afkReturn.bind(this), this.pluginHooks.bind(this), this.automoderation.bind(this), this.rateLimit.bind(this), this.route.bind(this)]
this.cooldowns = new Map()
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
ctx.prefixMatch = match
ctx.parsed = usedPrefix ? parseCommandText(text, usedPrefix) : null
ctx.commandName = ctx.parsed?.command || ''
ctx.usedPrefix = usedPrefix
}

/**
 * Etapa de normalizacion de identidad.
 *
 * Es la UNICA etapa asincrona donde se resuelve `@lid` -> telefono canonico, y por eso
 * debe correr ANTES de `security`, `afkReturn`, `route` y de la hidratacion de la DB.
 * Todo lo que venga despues trabaja siempre con la identidad canonica, y `normalizeJid()`
 * (sincrona) ya puede resolver ese mismo LID gracias al registro de alias.
 */
async identity(ctx) {
const { conn, m } = ctx
if (!m) {
ctx.halted = true
return
}

// Metadata de grupo ya cacheada: fuente barata y confiable de pares lid/pn.
// Nunca se fuerza una consulta de red aqui, solo se aprovecha lo que ya existe.
let participantsByLid = null
if (m.isGroup && m.chat) {
const cachedMetadata = groupMetadataCache?.get?.(m.chat) || conn?.chats?.[m.chat]?.metadata || null
const participants = Array.isArray(cachedMetadata?.participants) ? cachedMetadata.participants : []
if (participants.length) {
participantsByLid = buildParticipantsByLid(participants)
ctx.groupMetadata ||= cachedMetadata
ctx.participants ||= participants
// Aprendemos todos los pares lid<->pn del grupo de una sola pasada.
for (const participant of participants) {
const lid = participant?.lid
const phone = pickPhoneHint(participant?.jid, participant?.id, participant?.phoneNumber)
if (lid && phone) rememberMapping(lid, phone)
}
}
}
ctx.participantsByLid = participantsByLid

const key = m.key || {}
const isGroupChat = Boolean(m.isGroup)
const senderHints = [key.participantPn, key.participantAlt, m.participantPn, m.senderPn, !isGroupChat ? key.remoteJidAlt : '', !isGroupChat ? key.remoteJidPn : '']
const canonicalSender = await resolveEntityJid(conn, ctx.sender, { hints: senderHints, participantsByLid })
if (canonicalSender && canonicalSender !== ctx.sender) {
ctx.sender = canonicalSender
// `sender` es un getter derivado de `key.participant` / `key.remoteJid`.
// Mutamos primero la fuente subyacente (la key SI es escribible) y luego
// sombreamos el getter para que cualquier lectura posterior sea canonica.
if (isGroupChat) {
safeAssign(key, 'participant', canonicalSender)
safeAssign(m, 'participant', canonicalSender)
} else {
safeAssign(key, 'remoteJid', canonicalSender)
}
safeAssign(m, 'sender', canonicalSender)
}

// Chat privado: el `remoteJid` tambien puede llegar como `@lid`.
if (!isGroupChat) {
const canonicalChat = await resolveEntityJid(conn, m.chat, { hints: [key.remoteJidAlt, key.remoteJidPn], participantsByLid })
if (canonicalChat && canonicalChat !== m.chat) {
safeAssign(key, 'remoteJid', canonicalChat)
safeAssign(m, 'chat', canonicalChat)
// `isGroup` deriva de `chat`; al sombrear `chat` hay que fijar el booleano.
safeAssign(m, 'isGroup', false)
}
} else if (isLid(m.chat)) {
// Un grupo nunca deberia ser `@lid`; si lo es, lo dejamos intacto sin resolverlo.
ctx.groupLidChat = true
}

// El autor del mensaje citado alimenta moderacion Y economia (bank/perfil por cita).
// OJO: `m.quoted` es un getter que reconstruye un objeto NUEVO en cada acceso, por lo
// que mutarlo no persiste. La fuente real es `contextInfo.participant`, y ahi si se
// puede escribir. Ademas cacheamos el `quoted` ya resuelto para no perder el mapeo.
const contextInfo = getContextInfo(m)
const quotedSnapshot = m.quoted || null
const quotedRaw = quotedSnapshot?.sender || contextInfo?.participant || quotedSnapshot?.participant || quotedSnapshot?.key?.participant || ''
if (quotedRaw) {
const quotedKey = quotedSnapshot?.key || {}
const canonicalQuoted = await resolveEntityJid(conn, quotedRaw, { hints: [contextInfo?.participantPn, contextInfo?.participantAlt, quotedKey.participantPn, quotedKey.participantAlt, quotedSnapshot?.participantPn], participantsByLid })
const finalQuoted = canonicalQuoted || quotedRaw
ctx.quotedSender = finalQuoted
if (finalQuoted !== quotedRaw && contextInfo) safeAssign(contextInfo, 'participant', finalQuoted)
if (quotedSnapshot) {
safeAssign(quotedSnapshot, 'sender', finalQuoted)
// Congelamos el snapshot ya normalizado para que `m.quoted` deje de regenerarse.
safeAssign(m, 'quoted', quotedSnapshot)
}
}

// Menciones: se resuelven en bloque para que los plugins reciban identidades canonicas.
// Se reescribe TANTO el `contextInfo.mentionedJid` crudo (fuente del getter) como la
// propiedad serializada, porque los comandos leen indistintamente de ambas.
const rawMentions = Array.isArray(contextInfo?.mentionedJid) && contextInfo.mentionedJid.length ? contextInfo.mentionedJid : Array.isArray(m.mentionedJid) ? m.mentionedJid : []
if (rawMentions.length) {
const mentioned = []
for (const jid of rawMentions) {
const resolved = await resolveEntityJid(conn, jid, { participantsByLid })
if (resolved) mentioned.push(resolved)
}
const unique = [...new Set(mentioned)]
if (unique.length) {
if (contextInfo) safeAssign(contextInfo, 'mentionedJid', unique)
safeAssign(m, 'mentionedJid', unique)
ctx.mentionedJid = unique
}
}

// Owner y DB solo se calculan con la identidad ya canonica.
ctx.isOwner = isOwner(ctx.sender)
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
if (store.size > 5_000) for (const [itemKey, values] of store) if (!values.some(ts => now - ts <= this.rateLimitWindowMs)) store.delete(itemKey)
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
