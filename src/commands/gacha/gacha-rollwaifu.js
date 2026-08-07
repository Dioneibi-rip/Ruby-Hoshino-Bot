import { loadHarem, saveHarem, findClaim, isSameUserId } from '../../library/gacha-group.js'
import { loadCharactersOptimized } from '../../library/gacha-cache-manager.js'
import { normalizeCharacterId } from '../../library/gacha-characters.js'
import { getExclusiveOwner } from '../../library/gacha-restrictions.js'
import { calculateNextPity, isPityGuaranteed, renderPityBar } from '../../library/gacha-pity.js'
import { pruneActiveRolls, setActiveRoll, ROLL_EXPIRATION_MS, ROLL_PROTECTION_MS } from '../../library/gacha-roll-window.js'
import { replyWithFkontak } from '../../core/notice.js'

const ROLL_TOKEN_COST = 1
const RARITY_TIERS = [
{ key: 'common', name: 'Común', emoji: '⭐', maxPercentile: 0.40, weight: 50 },
{ key: 'rare', name: 'Raro', emoji: '💎', maxPercentile: 0.70, weight: 28 },
{ key: 'epic', name: 'Épico', emoji: '🌟', maxPercentile: 0.90, weight: 14 },
{ key: 'legendary', name: 'Legendario', emoji: '🔥', maxPercentile: 0.98, weight: 6 },
{ key: 'mythic', name: 'Mítico', emoji: '👑', maxPercentile: 1, weight: 2 }
]

function getCharacterValue(character = {}) {
const value = Number(character.value ?? character.valor ?? character.price ?? 0)
return Number.isFinite(value) ? Math.max(0, value) : 0
}

function buildRarityPools(characters = []) {
const values = characters.map(getCharacterValue).sort((a, b) => a - b)
const maxIndex = Math.max(values.length - 1, 0)
const thresholds = RARITY_TIERS.map(tier => values[Math.min(maxIndex, Math.floor(maxIndex * tier.maxPercentile))] ?? 0)
const pools = new Map(RARITY_TIERS.map(tier => [tier.key, []]))

for (const character of characters) {
const value = getCharacterValue(character)
const tierIndex = thresholds.findIndex(limit => value <= limit)
const tier = RARITY_TIERS[tierIndex === -1 ? RARITY_TIERS.length - 1 : tierIndex]
pools.get(tier.key).push(character)
}
return { pools, thresholds }
}

function pickWeightedTier(pools) {
const available = RARITY_TIERS.filter(tier => (pools.get(tier.key) || []).length)
const total = available.reduce((sum, tier) => sum + tier.weight, 0)
let roll = Math.random() * total
for (const tier of available) {
roll -= tier.weight
if (roll <= 0) return tier
}
return available[0]
}

function pickCharacterFromTierPool(pools, tierKeys = []) {
for (const tierKey of tierKeys) {
const tier = RARITY_TIERS.find(item => item.key === tierKey)
const pool = pools.get(tierKey) || []
if (tier && pool.length) return { character: pool[Math.floor(Math.random() * pool.length)], rarity: tier }
}
return null
}

function rollCharacterByRarity(characters = [], options = {}) {
const { pools } = buildRarityPools(characters)
if (options.guaranteedHighRarity) {
const guaranteed = pickCharacterFromTierPool(pools, ['mythic', 'legendary', 'epic'])
if (guaranteed) return guaranteed
}
const tier = pickWeightedTier(pools)
const pool = pools.get(tier.key) || characters
const character = pool[Math.floor(Math.random() * pool.length)]
return { character, rarity: tier }
}

global.gachaCooldowns = global.gachaCooldowns || {}
global.activeRolls = global.activeRolls || {}

function isUserInGroup(userId, participants = []) {
if (!userId) return false
if (!Array.isArray(participants) || !participants.length) return true
return participants.some(participant => {
const ids = [participant?.id, participant?.jid, participant?.lid].filter(Boolean)
return ids.some(id => isSameUserId(id, userId))
})
}

function removeClaimEntry(harem = [], claim) {
const index = harem.indexOf(claim)
if (index !== -1) harem.splice(index, 1)
}

function formatUrl(url) {
if (!url) return url
url = url.trim()
if (url.includes('github.com') && url.includes('/blob/')) url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
if (url.includes('github.com') && url.includes('?raw=true')) url = url.replace('github.com', 'raw.githubusercontent.com').replace('?raw=true', '')
if (url.includes('raw.github.com')) url = url.replace('raw.github.com', 'raw.githubusercontent.com')
return url
}

let handler = async (m, { conn, participants = [] }) => {
const userId = m.sender
const groupId = m.chat
const user = global.db.getUser(userId)
if (!user) return false
user.tokens = Number(user.tokens || 0)
user.gachaTokens = Number(user.gachaTokens || 0)
user.gachaPity = Number(user.gachaPity || 0)
if (user.gachaTokens < ROLL_TOKEN_COST) {
await replyWithFkontak(conn, m, '(,,•᷄‎ࡇ•᷅ ,,)? ᥒᥱᥴᥱsі𝗍ᥲs *1 T᥆kᥱᥒ Gᥲᥴhᥲ* ⍴ᥲrᥲ 𝗍іrᥲr ᥱᥣ gᥲᥴhᥲ.\n\n» ᥴ᥆m⍴rᥲᥣ᥆ ᥴ᥆ᥒ *#tienda comprar token*', { name: '✘ Rᥙby H᥆shіᥒ᥆ · T᥆kᥱᥒs' })
return false
}
const now = Date.now()
pruneActiveRolls(now)

try {
const characters = await loadCharactersOptimized()
if (!characters.length) throw new Error('❀ No hay personajes disponibles para el gacha.')

const pityBefore = Number(user.gachaPity || 0)
const guaranteedPity = isPityGuaranteed(pityBefore)
const { character: randomCharacter, rarity } = rollCharacterByRarity(characters, { guaranteedHighRarity: guaranteedPity })
randomCharacter.id = normalizeCharacterId(randomCharacter.id)

const imageList = Array.isArray(randomCharacter.img) ? randomCharacter.img : []
let randomImage = imageList[Math.floor(Math.random() * imageList.length)]
if (!randomImage) throw new Error(`❀ El personaje ${randomCharacter.name} no tiene imágenes válidas.`)
randomImage = formatUrl(randomImage)
if (randomImage.match(/\.webp($|\?)/i)) randomImage = `https://wsrv.nl/?url=${encodeURIComponent(randomImage)}&output=png`

const harem = await loadHarem()
let claimedInGroup = findClaim(harem, groupId, randomCharacter.id)
if (claimedInGroup && !isUserInGroup(claimedInGroup.userId, participants)) {
removeClaimEntry(harem, claimedInGroup)
await saveHarem(harem)
claimedInGroup = null
}
const exclusiveOwner = getExclusiveOwner(randomCharacter.id)
let ownerName = 'Nadie'
if (claimedInGroup) ownerName = await conn.getName(claimedInGroup.userId)
else if (exclusiveOwner) ownerName = await conn.getName(exclusiveOwner).catch(() => `@${exclusiveOwner.split('@')[0]}`)

const statusText = claimedInGroup ? '🚫 Ocupado' : (exclusiveOwner ? '🔒 Exclusivo' : '✅ Libre')
const nextGachaTokens = Math.max(0, Number(user.gachaTokens || 0) - ROLL_TOKEN_COST)
const nextGachaPity = calculateNextPity(pityBefore, rarity.key, { guaranteed: guaranteedPity })
const pityStatus = `${renderPityBar(nextGachaPity)} ${nextGachaPity}%`
const pityNote = guaranteedPity ? ' ✦ Garantía activada' : ''

const rollOwner = !claimedInGroup ? (exclusiveOwner || userId) : null

const message = `
ㅤㅤ⏜⋮ㅤㅤ꒰ㅤ꒰ㅤㅤ𖹭⃞🎲⃞𖹭ㅤㅤ꒱ㅤ꒱ㅤㅤ⋮⏜
꒰ㅤ꒰͡ㅤ 🄽🅄🄴🅅🄾 🄿🄴🅁🅂🄾🄽🄰🄹🄴ㅤㅤ͡꒱ㅤ꒱

▓𓏴𓏴 ۪ ֹ 🄽꯭🄾꯭🄼꯭🄱꯭🅁꯭🄴 :
╰┈➤ ❝ ${rarity.emoji} ${randomCharacter.name} ❞

▓𓏴𓏴 ۪ ֹ 🅁꯭🄰꯭🅁꯭🄴꯭🅉꯭🄰 :
╰┈➤ ${rarity.emoji} ${rarity.name}

▓𓏴𓏴 ۪ ֹ 🅅꯭🄰꯭🄻꯭🄾꯭🅁 :
╰┈➤ 🪙 ${randomCharacter.value}

▓𓏴𓏴 ۪ ֹ 🄴꯭🅂꯭🅃꯭🄰꯭🄳꯭🄾 :
╰┈➤ ✨ ꯭${statusText}

▓𓏴𓏴 ۪ ֹ 🄳꯭🅄꯭🄴꯭🄽꯭̃🄾 :
╰┈➤ 👤 ${ownerName}

▓𓏴𓏴 ۪ ֹ 🄵꯭🅄꯭🄴꯭🄽꯭🅃꯭🄴 :
╰┈➤ 📖 ${randomCharacter.source}

┉͜┄͜─┈┉⃛┄─꒰֟፝͡ 🅸🅳: ${randomCharacter.id} ꒱─┄⃨┉┈─͡┄͡┉
▓𓏴𓏴 ۪ ֹ 🄿꯭🄸꯭🅃꯭🅈 :
╰┈➤ ${pityStatus}${pityNote}

▓𓏴𓏴 ۪ ֹ 🅃꯭🄾꯭🄺꯭🄴꯭🄽꯭🅂 :
╰┈➤ 🎟️ ${nextGachaTokens} restantes

▓𓏴𓏴 ۪ ֹ 🅅꯭🄴꯭🄽꯭🅃꯭🄰꯭🄽꯭🄰 :
╰┈➤ 🛡️ ${Math.round(ROLL_PROTECTION_MS / 1000)}s solo para ti · ⏳ expira en ${Math.round(ROLL_EXPIRATION_MS / 1000)}s

ㅤㅤㅤㅤㅤㅤ© ᑲ᥆𝗍 𝗀ɑᥴ꯭hɑ 𝗌𝗒sł꯭ᥱꭑ꒱
`

await conn.sendMessage(m.chat, { image: { url: randomImage }, mimetype: 'image/jpeg', caption: message }, { quoted: m })
if (rollOwner) setActiveRoll(groupId, randomCharacter.id, rollOwner, Date.now())
user.gachaTokens = nextGachaTokens
user.gachaPity = nextGachaPity
if (global.db.updateUser) global.db.updateUser(userId, { gachaTokens: user.gachaTokens, gachaPity: user.gachaPity })
else global.db.scheduleFlush?.()
} catch (error) {
console.error(error)
await replyWithFkontak(conn, m, `(,,•᷄‎ࡇ•᷅ ,,)? ᥒ᥆ sᥱ ⍴ᥙძ᥆ ᥴᥲrgᥲr ᥱᥣ ⍴ᥱrs᥆ᥒᥲjᥱ.\n\n» ${error.message}`, { name: '✘ Rᥙby H᥆shіᥒ᥆ · Err᥆r' })
return false
}
}

handler.help = ['rw', 'rollwaifu']
handler.tags = ['gacha']
handler.command = ['rw', 'rollwaifu']
handler.group = true
handler.cooldown = 900000
handler.cooldownMessage = (seconds, time, hms) => `⏳ Espera ${hms || time || seconds + 's'} antes de volver a usar este comando.`

export default handler
