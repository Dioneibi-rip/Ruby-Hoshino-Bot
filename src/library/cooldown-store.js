import { getCooldownKey, redis } from './redis.js'

export function resolveCooldownMs(plugin = {}) {
const raw = plugin?.cooldown ?? plugin?.cooldownMs ?? plugin?.cooldownTime ?? 0
const value = Number(raw) || 0
if (value <= 0) return 0
return value < 1000 ? value * 1000 : value
}

export function getCanonicalCommand(plugin = {}, fallback = '') {
const declared = plugin?.command
if (typeof declared === 'string' && declared.trim()) return declared.trim().toLowerCase()
if (Array.isArray(declared)) {
const first = declared.find((item) => typeof item === 'string' && item.trim())
if (first) return first.trim().toLowerCase()
}
return String(fallback || '').trim().toLowerCase()
}

export function formatCooldown(ms = 0) {
const totalSeconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000))
if (!totalSeconds) return '0 segundos'
const days = Math.floor(totalSeconds / 86400)
const hours = Math.floor((totalSeconds % 86400) / 3600)
const minutes = Math.floor((totalSeconds % 3600) / 60)
const seconds = totalSeconds % 60
const parts = []
if (days) parts.push(`${days} día${days === 1 ? '' : 's'}`)
if (hours) parts.push(`${hours} hora${hours === 1 ? '' : 's'}`)
if (minutes) parts.push(`${minutes} minuto${minutes === 1 ? '' : 's'}`)
if (seconds || !parts.length) parts.push(`${seconds} segundo${seconds === 1 ? '' : 's'}`)
return parts.join(' ')
}

function normalizeCommandList(commands = []) {
const list = Array.isArray(commands) ? commands : [commands]
return list.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)
}

export async function peekCooldownMs(commands = [], sender = '') {
const safeSender = String(sender || '').trim()
const list = normalizeCommandList(commands)
if (!safeSender || !list.length) return 0
let remaining = 0
for (const command of list) {
try {
const ttlSeconds = await redis.ttl(getCooldownKey(command, safeSender))
if (Number.isFinite(ttlSeconds) && ttlSeconds > 0) remaining = Math.max(remaining, ttlSeconds * 1000)
} catch (error) {
console.error('[cooldown-store] no se pudo leer el cooldown:', error?.message || error)
}
}
return remaining
}

export async function claimCooldown(commands = [], sender = '', cooldownMs = 0) {
const safeSender = String(sender || '').trim()
const list = normalizeCommandList(commands)
const ms = Number(cooldownMs) || 0
if (!safeSender || !list.length || ms <= 0) return { allowed: true, claimed: false, keys: [], remainingMs: 0 }
const remainingMs = await peekCooldownMs(list, safeSender)
if (remainingMs > 0) return { allowed: false, claimed: false, keys: [], remainingMs }
const seconds = Math.max(1, Math.ceil(ms / 1000))
const keys = []
for (const command of list) {
const key = getCooldownKey(command, safeSender)
try {
await redis.set(key, String(Date.now() + ms), 'EX', seconds)
keys.push(key)
} catch (error) {
console.error('[cooldown-store] no se pudo aplicar el cooldown:', error?.message || error)
}
}
return { allowed: true, claimed: keys.length > 0, keys, remainingMs: 0 }
}

export async function releaseCooldown(keysOrState = []) {
const keys = Array.isArray(keysOrState) ? keysOrState : Array.isArray(keysOrState?.keys) ? keysOrState.keys : []
for (const key of keys) {
if (!key) continue
try {
await redis.del(key)
} catch (error) {
console.error('[cooldown-store] no se pudo liberar el cooldown:', error?.message || error)
}
}
return true
}

export async function clearCooldownFor(commands = [], sender = '') {
const safeSender = String(sender || '').trim()
const list = normalizeCommandList(commands)
if (!safeSender || !list.length) return false
return releaseCooldown(list.map((command) => getCooldownKey(command, safeSender)))
}

export default { resolveCooldownMs, getCanonicalCommand, formatCooldown, peekCooldownMs, claimCooldown, releaseCooldown, clearCooldownFor }
