export class MiddlewarePipeline {
constructor(stages = []) {
this.stages = []
for (const stage of stages) this.use(stage)
}

use(stage) {
if (!stage || typeof stage.run !== 'function') throw new TypeError('Middleware stage must expose run(ctx, next)')
this.stages.push(stage)
return this
}

async run(ctx) {
if (!ctx || typeof ctx !== 'object') throw new TypeError('Pipeline context must be an object')
let index = -1
const dispatch = async (position) => {
if (position <= index) throw new Error('Middleware next() called multiple times')
index = position
const stage = this.stages[position]
if (!stage) return ctx
return stage.run(ctx, () => dispatch(position + 1))
}
await dispatch(0)
return ctx
}
}

function extractText(message = {}) {
const content = message.message || message
const direct = content.conversation || content.extendedTextMessage?.text || content.imageMessage?.caption || content.videoMessage?.caption || content.documentMessage?.caption
if (direct) return String(direct)
const button = content.buttonsResponseMessage?.selectedButtonId || content.templateButtonReplyMessage?.selectedId || content.listResponseMessage?.singleSelectReply?.selectedRowId
if (button) return String(button)
const interactive = content.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
if (interactive) {
try {
const parsed = JSON.parse(interactive)
return String(parsed?.id || parsed?.text || '')
} catch {
return ''
}
}
return ''
}

function defaultPrefixes(ctx) {
const candidates = [ctx?.conn?.prefix, global.prefix, global.opts?.prefix].filter(Boolean)
const values = candidates.flatMap((value) => Array.isArray(value) ? value : [value]).map(String).filter(Boolean)
return values.length ? values : ['.', '#', '!', '/']
}

export function createDefaultPipeline({ registry, rateLimitMs = 900 } = {}) {
const rateState = new Map()
return new MiddlewarePipeline([
{
name: 'normalization',
async run(ctx, next) {
const m = ctx.m
ctx.text = String(m?.text || extractText(m) || '').trim()
ctx.sender = String(m?.sender || m?.key?.participant || m?.key?.remoteJid || '')
ctx.chat = String(m?.chat || m?.key?.remoteJid || '')
ctx.isGroup = Boolean(m?.isGroup || ctx.chat.endsWith('@g.us'))
ctx.prefixes = defaultPrefixes(ctx)
return next()
}
},
{
name: 'security',
async run(ctx, next) {
if (!ctx.m || ctx.m.key?.remoteJid === 'status@broadcast') return ctx
if (ctx.m.key?.id && /^(NJX-|BAE5.{12}$|B24E.{16}$)/.test(ctx.m.key.id)) return ctx
const chat = ctx.db?.data?.chats?.[ctx.chat] || ctx.db?.getChat?.(ctx.chat) || {}
if (chat?.isBanned || chat?.banned) return ctx
const antiLink = chat?.antiLink || chat?.antilink || chat?.antienlace
if (antiLink && ctx.isGroup && /chat\.whatsapp\.com\/\S+/i.test(ctx.text)) {
ctx.blocked = true
ctx.blockReason = 'antilink'
return ctx
}
return next()
}
},
{
name: 'rate-limit',
async run(ctx, next) {
const key = `${ctx.conn?.user?.jid || 'bot'}:${ctx.chat}:${ctx.sender}`
const timestamp = Date.now()
const previous = rateState.get(key) || 0
if (timestamp - previous < rateLimitMs) {
ctx.blocked = true
ctx.blockReason = 'rate-limit'
return ctx
}
rateState.set(key, timestamp)
if (rateState.size > 10000) {
const cutoff = timestamp - 60_000
for (const [entryKey, value] of rateState) if (value < cutoff) rateState.delete(entryKey)
}
return next()
}
},
{
name: 'routing',
async run(ctx, next) {
for (const prefix of ctx.prefixes) {
if (!ctx.text.startsWith(prefix)) continue
const body = ctx.text.slice(prefix.length).trim()
const [rawCommand, ...args] = body.split(/\s+/).filter(Boolean)
if (!rawCommand) continue
const command = rawCommand.toLowerCase()
const meta = registry?.get(command)
if (!meta) continue
ctx.route = { prefix, command, args, text: args.join(' '), meta }
ctx.m.command = command
ctx.m.isCommand = true
ctx.m.plugin = meta.file
break
}
return next()
}
}
])
}

export default MiddlewarePipeline
