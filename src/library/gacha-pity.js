const PITY_MAX = 100
const PITY_BAR_BLOCKS = 10
const HIGH_RARITY_KEYS = new Set(['legendary', 'mythic'])
const PITY_GAIN_BY_RARITY = {
common: 18,
rare: 12,
epic: 6,
legendary: 0,
mythic: 0
}

export function normalizePity(value = 0) {
const pity = Number(value || 0)
if (!Number.isFinite(pity)) return 0
return Math.min(PITY_MAX, Math.max(0, Math.round(pity)))
}

export function isPityGuaranteed(value = 0) {
return normalizePity(value) >= PITY_MAX
}

export function calculateNextPity(currentPity = 0, rarityKey = '', { guaranteed = false } = {}) {
if (guaranteed || HIGH_RARITY_KEYS.has(String(rarityKey))) return 0
const gain = PITY_GAIN_BY_RARITY[String(rarityKey)] ?? PITY_GAIN_BY_RARITY.common
return normalizePity(normalizePity(currentPity) + gain)
}

export function renderPityBar(value = 0, blocks = PITY_BAR_BLOCKS) {
const safeBlocks = Math.max(1, Number(blocks) || PITY_BAR_BLOCKS)
const pity = normalizePity(value)
const filled = Math.min(safeBlocks, Math.max(0, Math.round((pity / PITY_MAX) * safeBlocks)))
return `${'█'.repeat(filled)}${'▒'.repeat(safeBlocks - filled)}`
}

export { PITY_MAX, PITY_GAIN_BY_RARITY, HIGH_RARITY_KEYS }
