import { format } from 'util'
import { getCooldownKey, getCooldownSeconds, isRedisReady, redis, setRedisWithTTL } from '../infra/redis.js'
import { buildGuardContext, isBotSender, runPluginGuards } from './permission-guard.js'

export function segundosAHMS(totalSeconds = 0) {
const safeSeconds = Math.max(0, Math.ceil(Number(totalSeconds) || 0))
const hours = Math.floor(safeSeconds / 3600)
const minutes = Math.floor((safeSeconds % 3600) / 60)
const seconds = safeSeconds % 60
if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
if (minutes > 0) return `${minutes}m ${seconds}s`
return `${seconds}s`
}

function pluginUsesRedisCooldown(plugin) {
return Boolean(getCooldownSeconds(plugin))
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

function sanitizeError(error) {
let text = format(error)
for (const key of Object.values(global.APIKeys || {})) text = text.replace(new RegExp(key, 'g'), 'Administrador')
return text
}

export async function executePlugin(conn, plugin, name, m, extra, permissionContext, sender, { chat = {}, user = {}, isCelestialCommand = false } = {}) {
const isBotSelf = isBotSender(conn, m, sender)
const isEconomyPremium = Boolean(global.db?.data?.users?.[sender]?.premium === true || (global.prems || []).map((v) => String(v).replace(/[^0-9]/g, '')).includes(String(sender || '').split('@')[0].replace(/[^0-9]/g, '')))
const fail = plugin.fail || global.dfail
const guardContext = buildGuardContext({ conn, plugin, name, m, extra, sender, permissionContext, chat, user, isEconomyPremium, fail, isCelestialCommand })
const guardResult = await runPluginGuards(guardContext)
if (guardResult.blocked) return guardResult.result
if (user?.antispam && !user.banned) user.antispam = 0

m.isCommand = true
const xp = 'exp' in plugin ? parseInt(plugin.exp) : 17
if (xp > 200) m.reply('chirrido -_-')
else m.exp += xp

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
