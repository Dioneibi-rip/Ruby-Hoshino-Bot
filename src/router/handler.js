import chalk from '../library/ansi.js'
import { smsg } from '../library/simple.js'
import failureHandler from '../library/respuesta.js'
import { commandRegistry } from '../runtime/command-registry.js'
import { commandLoader } from '../runtime/command-loader.js'
import { createDefaultPipeline } from '../runtime/middleware-pipeline.js'

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
participants: [],
groupMetadata: {},
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
await registryReady
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
const synthetic = {
key: { remoteJid: chat, participant: participants[0], id: `participants-${Date.now()}` },
chat,
sender: participants[0],
isGroup: true,
messageStubType: update.action === 'add' || update.action === 'invite' ? 27 : 28,
messageStubParameters: participants,
groupMetadata: metadata
}
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
