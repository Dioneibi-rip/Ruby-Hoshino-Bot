export const ROLL_PROTECTION_MS = 20_000
export const ROLL_EXPIRATION_MS = 40_000

function getStore() {
if (!global.activeRolls || typeof global.activeRolls !== 'object') global.activeRolls = {}
return global.activeRolls
}

export function buildRollKey(groupId = '', characterId = '') {
return `${String(groupId || '').trim()}:${String(characterId || '').trim()}`
}

export function setActiveRoll(groupId = '', characterId = '', userId = '', now = Date.now()) {
if (!groupId || !characterId || !userId) return null
const store = getStore()
const entry = { user: userId, time: now }
store[buildRollKey(groupId, characterId)] = entry
return entry
}

export function getActiveRoll(groupId = '', characterId = '') {
const store = getStore()
return store[buildRollKey(groupId, characterId)] || null
}

export function deleteActiveRoll(groupId = '', characterId = '') {
const store = getStore()
delete store[buildRollKey(groupId, characterId)]
return true
}

export function pruneActiveRolls(now = Date.now()) {
const store = getStore()
let removed = 0
for (const [key, rollData] of Object.entries(store)) {
if (!rollData?.time || now - Number(rollData.time) > ROLL_EXPIRATION_MS) {
delete store[key]
removed++
}
}
return removed
}

export function evaluateRollWindow(rollData = null, userId = '', now = Date.now()) {
if (!rollData?.time) return { state: 'none', elapsedMs: 0, protectionRemainingMs: 0, expirationRemainingMs: 0, isOwner: false, canClaim: false }
const elapsedMs = Math.max(0, now - Number(rollData.time))
const isOwner = Boolean(userId) && String(rollData.user || '') === String(userId || '')
const protectionRemainingMs = Math.max(0, ROLL_PROTECTION_MS - elapsedMs)
const expirationRemainingMs = Math.max(0, ROLL_EXPIRATION_MS - elapsedMs)
if (elapsedMs > ROLL_EXPIRATION_MS) return { state: 'expired', elapsedMs, protectionRemainingMs: 0, expirationRemainingMs: 0, isOwner, canClaim: false, owner: rollData.user }
if (protectionRemainingMs > 0 && !isOwner) return { state: 'protected', elapsedMs, protectionRemainingMs, expirationRemainingMs, isOwner, canClaim: false, owner: rollData.user }
return { state: 'open', elapsedMs, protectionRemainingMs, expirationRemainingMs, isOwner, canClaim: true, owner: rollData.user }
}

export function listActiveRolls(groupId = '', now = Date.now()) {
const store = getStore()
const prefix = `${String(groupId || '').trim()}:`
const rolls = []
for (const [key, rollData] of Object.entries(store)) {
if (!groupId || !key.startsWith(prefix)) continue
if (!rollData?.time || now - Number(rollData.time) > ROLL_EXPIRATION_MS) continue
rolls.push({ characterId: key.slice(prefix.length), user: rollData.user, time: Number(rollData.time) })
}
return rolls.sort((a, b) => b.time - a.time)
}

export function formatWindowSeconds(ms = 0) {
return `${Math.max(0, Math.ceil(Number(ms || 0) / 1000))}s`
}

export default { ROLL_PROTECTION_MS, ROLL_EXPIRATION_MS, setActiveRoll, getActiveRoll, deleteActiveRoll, pruneActiveRolls, evaluateRollWindow, listActiveRolls, buildRollKey, formatWindowSeconds }
