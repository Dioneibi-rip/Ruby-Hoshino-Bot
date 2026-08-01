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
if (!stage) return true
const result = await stage.run(ctx, () => dispatch(position + 1))
if (ctx.blocked) return false
return result === false ? false : true
}
return await dispatch(0)
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
return values.length ? values : ['.', '#', '!', '/', '']
}

async function runAntilink(ctx) {
if (!ctx?.m?.isGroup || !ctx.text) return true
const chat = ctx.db?.data?.chats?.[ctx.chat] || ctx.db?.getChat?.(ctx.chat) || {}
const enabled = chat?.antiLink || chat?.antilink || chat?.antienlace
if (!enabled || !/chat\.whatsapp\.com\/\S+/i.test(ctx.text)) return true
if (ctx.permissions?.isAdmin || ctx.permissions?.isOwner || ctx.permissions?.isROwner || ctx.m.fromMe) return true
if (!ctx.permissions?.isBotAdmin && !ctx.m.isBotAdmin) {
await ctx.m.reply?.('✦ El antilink está activo pero no puedo eliminarte porque no soy admin.').catch(() => {})
ctx.blocked = true
ctx.blockReason = 'antilink-no-admin'
return false
}
await ctx.conn?.sendMessage?.(ctx.chat, { delete: ctx.m.key }).catch(() => {})
await ctx.conn?.sendMessage?.(ctx.chat, { text: `*「 ENLACE DETECTADO 」*\n\n《✧》@${String(ctx.sender || ctx.m.sender).split('@')[0]} Rompiste las reglas del Grupo.`, mentions: [ctx.sender || ctx.m.sender].filter(Boolean) }, { quoted: ctx.m }).catch(() => {})
await ctx.conn?.groupParticipantsUpdate?.(ctx.chat, [ctx.sender || ctx.m.sender], 'remove').catch(() => {})
ctx.blocked = true
ctx.blockReason = 'antilink'
return false
}

export function createDefaultPipeline({ registry, rateLimitMs = 900 } = {}) {
const rateState = new Map()
return new MiddlewarePipeline([
{
name: 'normalization',
async run(ctx, next) {
const m = ctx.m || {}
ctx.text = String(m.text || extractText(m) || '').trim()
ctx.sender = String(m.sender || m.key?.participant || m.key?.remoteJid || '')
ctx.chat = String(m.chat || m.key?.remoteJid || '')
ctx.isGroup = Boolean(m.isGroup || ctx.chat.endsWith('@g.us'))
ctx.prefixes = defaultPrefixes(ctx)
await next()
return true
}
},
{
name: 'security-antilink',
async run(ctx, next) {
if (!ctx.m || ctx.m.key?.remoteJid === 'status@broadcast') return false
if (ctx.m.key?.id && /^(NJX-|BAE5.{12}$|B24E.{16}$)/.test(ctx.m.key.id)) return false
const chat = ctx.db?.data?.chats?.[ctx.chat] || ctx.db?.getChat?.(ctx.chat) || {}
if (chat?.isBanned || chat?.banned) return false
if (await runAntilink(ctx) === false) return false
await next()
return true
}
},
{
name: 'rate-limit',
async run(ctx, next) {
const key = `${ctx.conn?.user?.jid || 'bot'}:${ctx.chat}:${ctx.sender}`
const timestamp = Date.now()
const previous = rateState.get(key) || 0
if (ctx.route?.meta && timestamp - previous < rateLimitMs) {
ctx.blocked = true
ctx.blockReason = 'rate-limit'
return false
}
rateState.set(key, timestamp)
if (rateState.size > 10000) {
const cutoff = timestamp - 60_000
for (const [entryKey, value] of rateState) if (value < cutoff) rateState.delete(entryKey)
}
await next()
return true
}
},
{
name: 'routing',
async run(ctx, next) {
for (const prefix of ctx.prefixes) {
if (prefix && !ctx.text.startsWith(prefix)) continue
const body = prefix ? ctx.text.slice(prefix.length).trim() : ctx.text.trim()
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
await next()
return true
}
}
])
}

export default MiddlewarePipeline
