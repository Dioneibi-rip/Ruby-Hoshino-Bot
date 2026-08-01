import chalk from '../library/ansi.js'
import { smsg } from '../library/simple.js'
import failureHandler from '../library/respuesta.js'
import { commandRegistry } from '../runtime/command-registry.js'
import { commandLoader } from '../runtime/command-loader.js'
import { createDefaultPipeline } from '../runtime/middleware-pipeline.js'
import welcomePlugin from '../commands/functions/_welcome.js'
import autodetectPlugin from '../commands/enable/_autodetect.js'
const registryReady = commandRegistry.load().catch((error) => {
console.error('[command-registry] load error', error)
return commandRegistry
})
const pipeline = createDefaultPipeline({ registry: commandRegistry })
global.uptimeStart ||= Date.now()
global.dfail = (type, m, conn) => failureHandler(type, conn, m)
function unwrapMessages(chatUpdate) {
return Array.isArray(chatUpdate?.messages) ? chatUpdate.messages.filter(Boolean) : []
}
function isProtocolMessage(message) {
return Boolean(message?.message?.protocolMessage || message?.message?.senderKeyDistributionMessage)
}
function getMessageId(message) {
return String(message?.key?.id || '')
}
function shouldIgnoreMessage(message) {
if (!message?.message) return true
if (message.key?.remoteJid === 'status@broadcast') return true
if (/^(NJX-|BAE5.{12}$|B24E.{16}$)/.test(getMessageId(message))) return true
return isProtocolMessage(message)
}
async function serializeMessage(conn, raw, chatUpdate) {
if (!raw) return null
try {
return await smsg(conn, raw, global.store, chatUpdate)
} catch (error) {
console.error('[handler] serialize error', error)
return null
}
}
function getDb() {
return global.db || null
}
function buildExecutionExtra(ctx) {
const permissions = ctx.permissions || {}
return {
conn: ctx.conn,
db: ctx.db,
usedPrefix: ctx.route.prefix,
command: ctx.route.command,
args: ctx.route.args,
text: ctx.route.text,
metadata: ctx.route.meta,
registry: commandRegistry,
loader: commandLoader,
groupMetadata: ctx.groupMetadata || {},
isOwner: Boolean(permissions.isOwner),
isAdmin: Boolean(permissions.isAdmin),
isROwner: Boolean(permissions.isROwner),
isBotAdmin: Boolean(permissions.isBotAdmin),
isPrems: Boolean(permissions.isPrems),
participants: Array.isArray(ctx.participants) ? ctx.participants : [],
chatUpdate: ctx.chatUpdate,
__dirname: ctx.route.meta.path.replace(/[/\\][^/\\]+$/, ''),
__filename: ctx.route.meta.path
}
}
async function markRead(conn, raw) {
if (!conn?.readMessages || !raw?.key) return
try {
await conn.readMessages([raw.key])
} catch {}
}
async function printMessage(conn, m) {
if ((conn.opts || global.opts || {}).noprint || !m) return
try {
const printer = await import('../library/print.js')
await printer.default(m, conn)
} catch (error) {
console.log(chalk.red('Error en print.js'), error)
}
}
function normalizeAdmin(participant = {}) {
const admin = participant.admin || false
if (admin === true || admin === 'admin') return 'admin'
if (admin === 'superadmin' || admin === 'owner' || admin === 'creator') return 'superadmin'
return false
}
function sameIdentity(conn, left, right) {
const a = conn?.decodeJid?.(left) || left
const b = conn?.decodeJid?.(right) || right
const an = String(a || '').split('@')[0]
const bn = String(b || '').split('@')[0]
return Boolean(an && bn && (a === b || an === bn))
}
async function hydrateGroupContext(ctx) {
ctx.groupMetadata = {}
ctx.participants = []
ctx.permissions = { isOwner: false, isAdmin: false, isROwner: false, isBotAdmin: false, isPrems: false }
const senderNum = String(ctx.sender || '').split('@')[0].replace(/[^0-9]/g, '')
const owners = Array.isArray(global.owner) ? global.owner : []
ctx.permissions.isOwner = owners.some((owner) => String(Array.isArray(owner) ? owner[0] : owner).replace(/[^0-9]/g, '') === senderNum)
ctx.permissions.isROwner = ctx.permissions.isOwner
ctx.permissions.isPrems = Boolean(global.db?.data?.users?.[ctx.sender]?.premium || (global.prems || []).some((premium) => String(premium).replace(/[^0-9]/g, '') === senderNum))
if (!ctx.m?.isGroup || !ctx.conn?.groupMetadata) return ctx
try {
ctx.groupMetadata = await ctx.conn.groupMetadata(ctx.m.chat)
ctx.participants = Array.isArray(ctx.groupMetadata?.participants) ? ctx.groupMetadata.participants : []
const user = ctx.participants.find((participant) => sameIdentity(ctx.conn, participant.jid || participant.id || participant.lid, ctx.sender)) || {}
const botJid = ctx.conn?.user?.jid || ctx.conn?.user?.id
const bot = ctx.participants.find((participant) => sameIdentity(ctx.conn, participant.jid || participant.id || participant.lid, botJid)) || {}
ctx.permissions.isAdmin = ['admin', 'superadmin'].includes(normalizeAdmin(user))
ctx.permissions.isBotAdmin = ['admin', 'superadmin'].includes(normalizeAdmin(bot))
ctx.m.isAdmin = ctx.permissions.isAdmin
ctx.m.isBotAdmin = ctx.permissions.isBotAdmin
} catch (error) {
ctx.logger?.error?.('[handler] group context error', error)
}
return ctx
}
async function executeRoutedCommand(ctx) {
const meta = ctx.route?.meta
if (!meta) return false
await markRead(ctx.conn, ctx.raw)
const extra = buildExecutionExtra(ctx)
try {
await commandLoader.execute(meta, ctx, extra)
return true
} catch (error) {
ctx.m.error = error
console.error('[command] execution error', error)
try {
await ctx.m.reply?.(String(error?.message || error))
} catch {}
return false
}
}
async function processMessage(conn, raw, chatUpdate) {
if (shouldIgnoreMessage(raw)) return
const m = await serializeMessage(conn, raw, chatUpdate)
if (!m) return
const ctx = { conn, m, raw, chatUpdate, db: getDb(), services: {}, logger: conn.logger || console, metrics: global.metrics || null }
try {
global.conn ||= conn
global.db ||= ctx.db
global.owner ||= []
await registryReady
await hydrateGroupContext(ctx)
await pipeline.run(ctx)
if (!ctx.blocked && ctx.route?.meta) await executeRoutedCommand(ctx)
} catch (error) {
console.error('[handler] pipeline error', error)
try {
await m.reply?.('Ocurrió un error interno al procesar el mensaje.')
} catch {}
} finally {
await printMessage(conn, m)
}
}
export async function handler(chatUpdate = {}) {
try {
const messages = unwrapMessages(chatUpdate)
for (const raw of messages) await processMessage(this, raw, chatUpdate)
} catch (error) {
console.error('[handler] fatal guard captured', error)
}
}
function realtimeReady(conn) {
const readyAt = Number(conn?.__groupEventReadyAt || 0)
return !readyAt || Date.now() >= readyAt
}
function buildGroupUpdateMessage(update = {}, sender = '') {
const chat = update.id
if (!chat) return null
if (typeof update.subject === 'string') return { chat, isGroup: true, sender, messageStubType: 21, messageStubParameters: [update.subject] }
if (typeof update.desc === 'string' || typeof update.description === 'string') return { chat, isGroup: true, sender, messageStubType: 24, messageStubParameters: [update.desc || update.description || ''] }
if (Object.prototype.hasOwnProperty.call(update, 'announce')) return { chat, isGroup: true, sender, messageStubType: 26, messageStubParameters: [update.announce ? 'on' : 'off'] }
if (Object.prototype.hasOwnProperty.call(update, 'restrict')) return { chat, isGroup: true, sender, messageStubType: 25, messageStubParameters: [update.restrict ? 'on' : 'off'] }
if (Object.prototype.hasOwnProperty.call(update, 'inviteCode') || Object.prototype.hasOwnProperty.call(update, 'ephemeralDuration')) return { chat, isGroup: true, sender, messageStubType: 23, messageStubParameters: [] }
if (update.picture || update.imgUrl || update.icon) return { chat, isGroup: true, sender, messageStubType: 22, messageStubParameters: [] }
return null
}
async function getGroupMetadata(conn, chat) {
if (!conn?.groupMetadata || !chat) return {}
try {
return await conn.groupMetadata(chat)
} catch {
return {}
}
}
export async function participantsUpdate(update = {}) {
try {
if (!realtimeReady(this)) return
const chat = this.decodeJid?.(update.id) || update.id
if (!chat || !chat.endsWith('@g.us')) return
const participants = Array.isArray(update.participants) ? update.participants : []
if (!participants.length) return
const metadata = await getGroupMetadata(this, chat)
const participantsList = Array.isArray(metadata?.participants) ? metadata.participants : []
const synthetic = {
key: { remoteJid: chat, participant: participants[0], id: `participants-${Date.now()}` },
chat,
sender: participants[0],
isGroup: true,
messageStubType: update.action === 'add' || update.action === 'invite' ? 27 : 28,
messageStubParameters: participants,
groupMetadata: metadata
}
await welcomePlugin.before?.call(this, synthetic, { conn: this, participants: participantsList, groupMetadata: metadata })
this.ev?.emit?.('ruby.participants.update', { update, message: synthetic })
} catch (error) {
console.error('[handler] participants update error', error)
}
}
export async function groupsUpdate(updates = []) {
const list = Array.isArray(updates) ? updates : [updates]
for (const update of list) {
try {
if (!realtimeReady(this)) continue
const chat = this.decodeJid?.(update?.id) || update?.id
if (!chat || !chat.endsWith('@g.us')) continue
const metadata = await getGroupMetadata(this, chat)
const participantsList = Array.isArray(metadata?.participants) ? metadata.participants : []
const synthetic = buildGroupUpdateMessage({ ...update, id: chat }, participantsList[0]?.id || participantsList[0]?.jid || update.author || update.sender || '')
if (synthetic) await autodetectPlugin.before?.call(this, synthetic, { conn: this, participants: participantsList, groupMetadata: metadata })
this.ev?.emit?.('ruby.groups.update', { ...update, id: chat })
} catch (error) {
console.error('[handler] groups update error', error)
}
}
}
export async function messagesUpdate(updates = []) {
const list = Array.isArray(updates) ? updates : [updates]
for (const update of list) {
try {
this.ev?.emit?.('ruby.messages.update', update)
} catch (error) {
console.error('[handler] messages update error', error)
}
}
}
export default { handler, participantsUpdate, groupsUpdate, messagesUpdate }
