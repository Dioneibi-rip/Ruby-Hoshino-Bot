import { isProtectionActive, MAX_PROTECTION_MS } from './gacha-protection.js'

function loadList(section) {
return Object.values(global.db?.getSection?.(section) || {})
}

async function saveList(section, list, mapper) {
if (!global.db?.replaceSection) throw new Error(`SQLite no está inicializado para guardar ${section}.`)
const rows = Object.fromEntries(normalizeList(list, mapper).map((item, index) => [mapper === normalizeHaremEntry ? `${item.groupId}:${item.characterId}` : `${item.groupId}:${item.id || index}`, item]))
global.db.replaceSection(section, rows)
await global.db.write?.()
}

function normalizeId(value) {
return String(value ?? '').trim()
}

function normalizeHaremEntry(entry) {
if (!entry || typeof entry !== 'object') return null
const groupId = normalizeId(entry.groupId)
const userId = normalizeId(entry.userId)
const characterId = normalizeId(entry.characterId)
if (!groupId || !userId || !characterId) return null
const normalized = { ...entry, groupId, userId, characterId, lastClaimTime: Number(entry.lastClaimTime || 0) || Date.now() }
if (normalized.protection && typeof normalized.protection === 'object') {
const expiresAt = Number(normalized.protection.expiresAt || 0)
const now = Date.now()
const ceiling = now + MAX_PROTECTION_MS
normalized.protection.expiresAt = Number.isFinite(expiresAt) ? Math.min(expiresAt, ceiling) : 0
normalized.protection.protected = Boolean(normalized.protection.protected && normalized.protection.expiresAt > now)
isProtectionActive(normalized)
}
return normalized
}

function normalizeVentaEntry(entry) {
if (!entry || typeof entry !== 'object') return null
const groupId = normalizeId(entry.groupId)
const id = normalizeId(entry.id || entry.characterId)
const name = normalizeId(entry.name)
const vendedor = normalizeId(entry.vendedor || entry.sellerJid)
if (!groupId || !id) return null
return { ...entry, groupId, id, characterId: id, name, vendedor, sellerJid: vendedor, precio: Math.max(0, Number(entry.precio || entry.price || 0)), price: Math.max(0, Number(entry.precio || entry.price || 0)), fecha: Number(entry.fecha || entry.createdAt || Date.now()) }
}

function normalizeList(list, mapper) {
const seen = new Set()
const output = []
for (const item of Array.isArray(list) ? list : []) {
const normalized = mapper(item)
if (!normalized) continue
const key = mapper === normalizeHaremEntry ? `${normalized.groupId}:${normalized.characterId}` : `${normalized.groupId}:${normalized.id}`
if (seen.has(key)) continue
seen.add(key)
output.push(normalized)
}
return output
}

async function loadHarem() {
return normalizeList(loadList('harem'), normalizeHaremEntry)
}

async function saveHarem(harem) {
await saveList('harem', harem, normalizeHaremEntry)
}

async function loadVentas() {
if (global.db?.getGachaMarket) return normalizeList(global.db.getGachaMarket(), normalizeVentaEntry)
return normalizeList(loadList('waifus_venta'), normalizeVentaEntry)
}

async function saveVentas(ventas) {
if (global.db?.replaceGachaMarket) {
global.db.replaceGachaMarket(normalizeList(ventas, normalizeVentaEntry))
await global.db.write?.()
return
}
await saveList('waifus_venta', ventas, normalizeVentaEntry)
}

function userKey(groupId, userId) {
return `${groupId}:${userId}`
}

function charKey(groupId, charId) {
return `${groupId}:${charId}`
}

function getUserIdVariants(userId) {
if (!userId || typeof userId !== 'string') return []
const normalized = userId.trim()
if (!normalized) return []
const variants = new Set([normalized])
const [local, domain] = normalized.split('@')
if (local && domain) {
const baseLocal = local.split(':')[0]
variants.add(`${baseLocal}@${domain}`)
if (domain === 's.whatsapp.net') variants.add(`${baseLocal}@lid`)
if (domain === 'lid') variants.add(`${baseLocal}@s.whatsapp.net`)
}
return [...variants]
}

function isSameUserId(a, b) {
if (!a || !b) return false
if (a === b) return true
const variants = new Set(getUserIdVariants(a))
return getUserIdVariants(b).some(v => variants.has(v))
}

function findClaim(harem, groupId, characterId) {
return harem.find(entry => entry.groupId === groupId && entry.characterId === String(characterId)) || null
}

function findClaimByUserAndChar(harem, groupId, userId, characterId) {
return harem.find(entry => entry.groupId === groupId && entry.characterId === String(characterId) && isSameUserId(entry.userId, userId)) || null
}

function getUserClaims(harem, groupId, userId) {
return harem.filter(entry => entry.groupId === groupId && isSameUserId(entry.userId, userId))
}

function addOrUpdateClaim(harem, groupId, userId, characterId) {
const existing = harem.find(e => e.groupId === groupId && e.characterId === String(characterId))
const now = Date.now()
if (existing) {
existing.userId = userId
existing.lastClaimTime = now
return existing
}
const created = { groupId, userId, characterId: String(characterId), lastClaimTime: now }
harem.push(created)
return created
}

function removeClaim(harem, groupId, userId, characterId) {
const idx = harem.findIndex(e => e.groupId === groupId && e.characterId === String(characterId) && isSameUserId(e.userId, userId))
if (idx !== -1) {
harem.splice(idx, 1)
return true
}
return false
}

function findVenta(ventas, groupId, characterIdOrName) {
return ventas.find(v => v.groupId === groupId && (v.id === String(characterIdOrName) || v.name.toLowerCase() === String(characterIdOrName).toLowerCase())) || null
}

function addOrUpdateVenta(ventas, groupId, venta) {
const payload = normalizeVentaEntry({ ...venta, groupId })
if (!payload) return null
if (global.db?.addGachaMarketSale) return global.db.addGachaMarketSale(payload)
const existing = ventas.find(v => v.groupId === groupId && v.id === payload.id)
if (existing) {
Object.assign(existing, payload)
return existing
}
ventas.push(payload)
return payload
}

function removeVenta(ventas, groupId, characterId) {
if (global.db?.removeGachaMarketSale) return global.db.removeGachaMarketSale(groupId, characterId)
const idx = ventas.findIndex(v => v.groupId === groupId && v.id === String(characterId))
if (idx !== -1) return ventas.splice(idx, 1)[0]
return null
}

function getVentasInGroup(ventas, groupId) {
return ventas.filter(v => v.groupId === groupId)
}

export { loadHarem, saveHarem, loadVentas, saveVentas, userKey, charKey, findClaim, findClaimByUserAndChar, getUserClaims, isSameUserId, addOrUpdateClaim, removeClaim, findVenta, addOrUpdateVenta, removeVenta, getVentasInGroup }
