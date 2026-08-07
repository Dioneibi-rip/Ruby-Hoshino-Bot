import { format } from 'util'
import { claimCooldown, formatCooldown, getCanonicalCommand, releaseCooldown, resolveCooldownMs } from '../library/cooldown-store.js'
import { buildCooldownNotice, replyWithFkontak } from '../core/notice.js'
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

async function claimPluginCooldown(conn, plugin, name, m, command, sender, usedPrefix = '') {
const cooldownMs = resolveCooldownMs(plugin)
if (!cooldownMs) return { claimed: false, allowed: true, keys: [] }
const canonical = getCanonicalCommand(plugin, command || name)
const aliases = [...new Set([canonical, String(command || '').toLowerCase()].filter(Boolean))]
try {
const state = await claimCooldown(aliases, sender, cooldownMs)
if (state.allowed) return { ...state, aliases }
const remaining = formatCooldown(state.remainingMs)
const custom = getCooldownMessage(plugin, Math.ceil(state.remainingMs / 1000))
const notice = custom || buildCooldownNotice({ usedPrefix, command: command || canonical, remaining })
await replyWithFkontak(conn, m, notice, { name: '⏳ Rᥙby H᥆shіᥒ᥆ · Cᥙᥱᥒ𝗍ᥲ rᥱgrᥱsіvᥲ' })
return { ...state, aliases }
} catch (error) {
console.error('[cooldown] claim error', error)
return { claimed: false, allowed: true, keys: [] }
}
}

async function releasePluginCooldown(cooldownState) {
if (!cooldownState?.claimed) return
await releaseCooldown(cooldownState.keys)
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

const cooldownState = await claimPluginCooldown(conn, plugin, name, m, extra.command, sender, extra.usedPrefix)
if (!cooldownState.allowed) return false

let pluginResult
try {
pluginResult = await plugin.call(conn, m, extra)
const pluginSucceeded = pluginResult !== false && !m.error
m.pluginFailed = !pluginSucceeded
if (!pluginSucceeded) await releasePluginCooldown(cooldownState)
if (pluginSucceeded && !isEconomyPremium && !isBotSelf) m.coin = m.coin || plugin.coin || false
} catch (error) {
m.error = error
await releasePluginCooldown(cooldownState)
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
