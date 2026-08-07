import { fileURLToPath } from 'url'
import failureHandler from '../library/respuesta.js'
import { commandRegistry } from '../runtime/command-registry.js'
import { commandLoader } from '../runtime/command-loader.js'
import MiddlewarePipeline from '../runtime/middleware-pipeline.js'
import { getGroupMetadataOnDemand } from '../library/global-cache.js'
import { shouldSilenceChatForBot, normalizeSessionJid } from '../core/session-utils.js'
import { executePlugin } from './plugin-executor.js'
import { getPersonalStickerCommand } from '../core/sticker-command-utils.js'
import { getCurrencyName } from '../core/currency.js'
import { isMentionText } from './handler-utils.js'
import { buildUnknownCommandNotice, replyWithFkontak } from '../core/notice.js'

const registryReady = commandRegistry.init()
const pipeline = new MiddlewarePipeline({ registry: commandRegistry })
const PRESENCE_STATES = new Set(['composing', 'paused'])

function isForbiddenError(error) {
const text = [error?.message, error?.stack, error?.reason, error?.code, error?.statusCode, error?.output?.statusCode, error?.data?.statusCode].filter(Boolean).join(' ').toLowerCase()
return text.includes('403') || text.includes('forbidden')
}

global.uptimeStart ||= Date.now()
global.dfail = (type, m, conn) => failureHandler(type, conn, m)

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


function stickerCommandMessage(rawMessage = {}) {
try {
const sticker = rawMessage?.message?.stickerMessage
const fileSha256 = sticker?.fileSha256
if (!fileSha256) return rawMessage
const sha = Buffer.from(fileSha256).toString('base64')
const record = global.db?.getSection?.('sticker')?.[sha]
const sender = rawMessage.key?.participant || rawMessage.key?.remoteJid || ''
const personal = getPersonalStickerCommand(record, sender)
if (!personal?.text) return rawMessage
const text = String(personal.text || '').trim()
if (!text) return rawMessage
return {
...rawMessage,
message: { conversation: text },
__stickerCommandHydrated: true,
__stickerCommandHash: sha
}
} catch {
return rawMessage
}
}

function getIncomingMessages(chatUpdate = {}) {
if (chatUpdate?.type && chatUpdate.type !== 'notify') return []
return Array.isArray(chatUpdate?.messages) ? chatUpdate.messages.filter(Boolean) : []
}

function canSendPresenceUpdate(conn, state, jid) {
return Boolean(conn && typeof conn.sendPresenceUpdate === 'function' && PRESENCE_STATES.has(state) && typeof jid === 'string' && jid)
}

async function withPresence(conn, m, run) {
if (canSendPresenceUpdate(conn, 'composing', m?.chat)) conn.sendPresenceUpdate('composing', m.chat).catch(() => {})
try {
return await run()
} finally {
if (canSendPresenceUpdate(conn, 'paused', m?.chat)) conn.sendPresenceUpdate('paused', m.chat).catch(() => {})
}
}

function buildExecutionContext(ctx = {}) {
const parsed = ctx.parsed || {}
return {
conn: ctx.conn,
botProfile: ctx.conn?.botProfile || null,
match: ctx.prefixMatch,
usedPrefix: ctx.usedPrefix || parsed.usedPrefix || '',
prefix: ctx.usedPrefix || parsed.prefix || '',
command: ctx.commandName || parsed.command || '',
args: parsed.args || [],
_arg: parsed.args || [],
_args: parsed.args || [],
text: parsed.text || '',
noPrefix: parsed.body || '',
participants: ctx.participants || [],
groupMetadata: ctx.groupMetadata || {},
user: ctx.permissionContext?.userGroup || {},
bot: ctx.permissionContext?.botGroup || {},
isROwner: Boolean(ctx.permissionContext?.isROwner || ctx.isOwner),
isOwner: Boolean(ctx.permissionContext?.isOwner || ctx.isOwner),
isRAdmin: Boolean(ctx.permissionContext?.isRAdmin),
isAdmin: Boolean(ctx.permissionContext?.isAdmin),
isBotAdmin: Boolean(ctx.permissionContext?.isBotAdmin),
isPrems: Boolean(ctx.permissionContext?.isPrems),
chatUpdate: ctx.chatUpdate,
__dirname: fileURLToPath(new URL('../commands/', import.meta.url)),
__filename: ctx.commandMetadata?.filePath || ''
}
}

async function replyInvalidCommand(conn, m, parsed = {}, usedPrefix = '') {
if (!parsed?.command || !usedPrefix) return false
if (isMentionText(m?.text || m?.body || '')) return false
const text = buildUnknownCommandNotice(usedPrefix, parsed.command)
await replyWithFkontak(conn, m, text, { name: '(,,•᷄ࡇ•᷅ ,,)? C᥆mᥲᥒძ᥆ ძᥱsᥴ᥆ᥒ᥆ᥴіძ᥆' })
return true
}

async function processMessage(conn, chatUpdate, rawMessage) {
const ctx = await pipeline.run({ conn, chatUpdate, rawMessage, db: global.db })
if (ctx.halted || !ctx.m) return
if (!ctx.commandName) return
if (!ctx.commandMetadata) {
await replyInvalidCommand(conn, ctx.m, ctx.parsed, ctx.usedPrefix)
return
}
const command = await commandLoader.load(ctx.commandMetadata)
ctx.m.plugin = ctx.commandMetadata.name
ctx.m.moneda = getCurrencyName(conn)
ctx.m.exp = Number(ctx.m.exp || 0) + Math.ceil(Math.random() * 10)
const extra = buildExecutionContext(ctx)
if (!await pipeline.beforeCommand(ctx, command, extra)) return
await withPresence(conn, ctx.m, () => executePlugin(conn, command, ctx.commandMetadata.name, ctx.m, extra, ctx.permissionContext || {}, ctx.sender, { chat: ctx.chatData || {}, user: ctx.user || ctx.dbState?.user || {} }))
}

export async function handler(chatUpdate = {}) {
try {
await registryReady
for (const rawMessage of getIncomingMessages(chatUpdate)) {
try {
const routedMessage = stickerCommandMessage(rawMessage)
await processMessage(this, chatUpdate, routedMessage)
} catch (error) {
console.error('[UPSERT ERROR]:', error)
console.error('[handler:message]', error?.stack || error?.message || error)
}
}
} catch (error) {
console.error('[UPSERT ERROR]:', error)
console.error('[handler:upsert]', error?.stack || error?.message || error)
}
}

export async function messagesUpdate(updates = []) {
const list = Array.isArray(updates) ? updates : [updates]
for (const update of list) {
try {
const error = update?.update?.error || update?.error || update
const text = [error?.message, error?.stack, error?.reason, error?.code, error?.statusCode].filter(Boolean).join(' ')
if (!text.includes('463')) continue
const jid = update?.key?.remoteJid || update?.remoteJid || update?.jid || update?.chat
if (!jid || jid.endsWith?.('@g.us')) continue
await global.db?.setTemporaryState?.('timelock_cooldowns', jid, { jid, reason: 'reachout_timelock_463', createdAt: Date.now() }, 12 * 60 * 60 * 1000)
} catch (error) {
console.error('[messages.update]', error?.message || error)
}
}
}

function buildGroupUpdateStub(update = {}) {
const chat = update.id
if (!chat) return null
const actor = update.author || update.sender || update.participant || update.owner || ''
if (typeof update.subject === 'string') return { chat, isGroup: true, sender: actor, messageStubType: 21, messageStubParameters: [update.subject] }
if (typeof update.desc === 'string' || typeof update.description === 'string') return { chat, isGroup: true, sender: actor, messageStubType: 24, messageStubParameters: [update.desc || update.description || ''] }
return null
}

export async function groupsUpdate(updates = []) {
const list = Array.isArray(updates) ? updates : [updates]
for (const update of list) {
try {
const chat = this.decodeJid?.(update?.id) || update?.id
if (!chat?.endsWith?.('@g.us')) continue
const chatData = global.db?.getChat?.(chat) || global.db?.data?.chats?.[chat]
if (!chatData?.detect || shouldSilenceChatForBot(chatData, normalizeSessionJid(this?.user?.jid || this?.user?.id || ''))) continue
const stub = buildGroupUpdateStub({ ...update, id: chat })
if (!stub) continue
const plugin = (await import('../commands/uncategorized/_autodetect.js')).default
const groupMetadata = await getGroupMetadataOnDemand(this, chat, { requireParticipants: true })
await plugin.before.call(this, stub, { conn: this, participants: groupMetadata?.participants || [], groupMetadata: groupMetadata || {} })
} catch (error) {
console.error('[groups.update]', error?.message || error)
}
}
}

export async function participantsUpdate(update = {}) {
try {
const chat = this.decodeJid?.(update.id) || update.id
if (!chat?.endsWith?.('@g.us') || !Array.isArray(update.participants) || !update.participants.length) return
const chatData = global.db?.getChat?.(chat) || global.db?.data?.chats?.[chat]
const sessionJid = normalizeSessionJid(this?.user?.jid || this?.user?.id || '')
const primaryBot = normalizeSessionJid(chatData?.primaryBot || chatData?.botPrimario || chatData?.primaryBotJid || '')
if (primaryBot && primaryBot !== sessionJid) return
if (!chatData?.welcome) return
const action = String(update.action || '').toLowerCase()
const messageStubType = action === 'add' || action === 'invite' ? 27 : action === 'remove' || action === 'leave' ? 28 : null
if (!messageStubType) return
const plugin = (await import('../commands/uncategorized/_welcome.js')).default
let groupMetadata = {}
try {
groupMetadata = await getGroupMetadataOnDemand(this, chat, { requireParticipants: true })
} catch (error) {
if (isForbiddenError(error)) return
throw error
}
await plugin.before.call(this, { chat, isGroup: true, sender: update.participants[0], messageStubType, messageStubParameters: update.participants }, { conn: this, participants: groupMetadata?.participants || [], groupMetadata: groupMetadata || {} })
} catch (error) {
if (!isForbiddenError(error)) console.error('[participants.update]', error?.message || error)
}
}

export default { handler }
