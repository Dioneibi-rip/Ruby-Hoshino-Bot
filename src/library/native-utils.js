export class TTLCache {
constructor({ stdTTL = 0, checkperiod = 0, useClones = false, max = 0 } = {}) {
this.stdTTL = Number(stdTTL) || 0
this.useClones = useClones
this.max = Number(max) || 0
this.store = new Map()
if (checkperiod > 0) this.timer = setInterval(() => this.clearExpired(), checkperiod * 1000).unref?.()
}

clone(value) {
if (!this.useClones || value == null) return value
if (typeof structuredClone === 'function') return structuredClone(value)
return JSON.parse(JSON.stringify(value))
}

get(key) {
const entry = this.store.get(key)
if (!entry) return undefined
if (entry.expires && entry.expires <= Date.now()) {
this.store.delete(key)
return undefined
}
return this.clone(entry.value)
}

set(key, value, ttl = this.stdTTL) {
const expires = ttl > 0 ? Date.now() + ttl * 1000 : 0
if (this.store.has(key)) this.store.delete(key)
this.store.set(key, { value: this.clone(value), expires })
while (this.max > 0 && this.store.size > this.max) this.store.delete(this.store.keys().next().value)
return true
}

del(key) { return this.store.delete(key) ? 1 : 0 }
delete(key) { return this.store.delete(key) }
has(key) { return this.get(key) !== undefined }
keys() { this.clearExpired(); return [...this.store.keys()] }
flushAll() { this.store.clear() }
clear() { this.store.clear() }
getStats() { return { keys: this.store.size } }
clearExpired() {
const now = Date.now()
for (const [key, entry] of this.store) if (entry.expires && entry.expires <= now) this.store.delete(key)
}
}

export function formatBytes(bytes = 0) {
const size = Number(bytes) || 0
if (!Number.isFinite(size) || Math.abs(size) < 1024) return `${size} B`
const units = ['KB', 'MB', 'GB', 'TB', 'PB']
let value = Math.abs(size)
let unit = 'B'
for (const next of units) {
value /= 1024
unit = next
if (value < 1024) break
}
const signed = size < 0 ? -value : value
return `${Number(signed.toFixed(2)).toString()} ${unit}`
}

export function formatPhoneInternational(input = '') {
const digits = String(input).replace(/\D/g, '')
if (!digits) return ''
if (digits.length === 11 && digits.startsWith('1')) return `+${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
if (digits.length === 10) return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
return `+${digits}`
}

export function urlRegex() {
return /https?:\/\/(?:www\.)?[^\s<>()]+|www\.[^\s<>()]+/gi
}

export function stringSimilarity(a = '', b = '') {
const left = String(a).toLowerCase()
const right = String(b).toLowerCase()
if (left === right) return 1
if (!left || !right) return 0
const previous = Array.from({ length: right.length + 1 }, (_, i) => i)
const current = Array(right.length + 1).fill(0)
for (let i = 1; i <= left.length; i++) {
current[0] = i
for (let j = 1; j <= right.length; j++) {
const cost = left[i - 1] === right[j - 1] ? 0 : 1
current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost)
}
previous.splice(0, previous.length, ...current)
}
const distance = previous[right.length]
return 1 - distance / Math.max(left.length, right.length)
}
