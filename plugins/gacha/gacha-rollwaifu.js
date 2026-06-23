import { loadHarem, saveHarem, findClaim, isSameUserId } from '../../lib/gacha-group.js'
import { loadCharactersOptimized, invalidateCache } from '../../lib/gacha-cache-manager.js'
import { normalizeCharacterId } from '../../lib/gacha-characters.js'
import { getExclusiveOwner } from '../../lib/gacha-restrictions.js'

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
if (url.includes('github.com') && url.includes('/blob/')) {
url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
}
if (url.includes('github.com') && url.includes('?raw=true')) {
url = url.replace('github.com', 'raw.githubusercontent.com').replace('?raw=true', '')
}
if (url.includes('raw.github.com')) {
url = url.replace('raw.github.com', 'raw.githubusercontent.com')
}
return url
}

let handler = async (m, { conn, participants = [] }) => {
const userId = m.sender
const groupId = m.chat
const now = Date.now()

let expCount = 0
for (const [rollKey, rollData] of Object.entries(global.activeRolls)) {
if (!rollData?.time || now - rollData.time > 3 * 60 * 1000) {
delete global.activeRolls[rollKey]
expCount++
if (expCount >= 50) break
}
}

try {
const characters = await loadCharactersOptimized()
if (!characters.length) throw new Error('❀ No hay personajes disponibles para el gacha.')

const randomCharacter = characters[Math.floor(Math.random() * characters.length)]
randomCharacter.id = normalizeCharacterId(randomCharacter.id)

const imageList = Array.isArray(randomCharacter.img) ? randomCharacter.img : []
let randomImage = imageList[Math.floor(Math.random() * imageList.length)]
if (!randomImage) throw new Error(`❀ El personaje ${randomCharacter.name} no tiene imágenes válidas.`)

randomImage = formatUrl(randomImage)

if (randomImage.match(/\.webp($|\?)/i)) {
randomImage = `https://wsrv.nl/?url=${encodeURIComponent(randomImage)}&output=png`
}

const harem = await loadHarem()
let claimedInGroup = findClaim(harem, groupId, randomCharacter.id)
if (claimedInGroup && !isUserInGroup(claimedInGroup.userId, participants)) {
removeClaimEntry(harem, claimedInGroup)
await saveHarem(harem)
claimedInGroup = null
}
const exclusiveOwner = getExclusiveOwner(randomCharacter.id)

let ownerName = 'Nadie'
if (claimedInGroup) {
ownerName = await conn.getName(claimedInGroup.userId)
} else if (exclusiveOwner) {
ownerName = await conn.getName(exclusiveOwner).catch(() => `@${exclusiveOwner.split('@')[0]}`)
}

const statusText = claimedInGroup
? '🚫 Ocupado'
: (exclusiveOwner ? '🔒 Exclusivo' : '✅ Libre')

if (!claimedInGroup) {
const rollOwner = exclusiveOwner || userId
global.activeRolls[`${groupId}:${randomCharacter.id}`] = { user: rollOwner, time: Date.now() }
}

const message = `
ㅤㅤ⏜⋮ㅤㅤ꒰ㅤ꒰ㅤㅤ𖹭⃞🎲⃞𖹭��ㅤ꒱ㅤ꒱ㅤㅤ⋮⏜
꒰ㅤ꒰͡ㅤ 🄽🅄🄴🅅🄾 🄿🄴🅁🅂🄾🄽🄰🄹🄴ㅤㅤ͡꒱ㅤ꒱

▓𓏴𓏴 ۪ ֹ 🄽꯭🄾꯭🄼꯭🄱꯭🅁꯭🄴 :
╰┈➤ ❝ ${randomCharacter.name} ❞

▓𓏴𓏴 ۪ ֹ 🅅꯭🄰꯭🄻꯭🄾꯭🅁 :
╰┈➤ 🪙 ${randomCharacter.value}

▓𓏴𓏴 ۪ ֹ 🄴꯭🅂꯭🅃꯭🄰꯭🄳꯭🄾 :
╰┈➤ ✨ ꯭${statusText}

▓𓏴𓏴 ۪ ֹ 🄳꯭🅄꯭🄴꯭🄽꯭̃🄾 :
╰┈➤ 👤 ${ownerName}

▓𓏴𓏴 ۪ ֹ 🄵꯭🅄꯭🄴꯭🄽꯭🅃꯭🄴 :
╰┈➤ 📖 ${randomCharacter.source}

┉͜┄͜─┈┉⃛┄─꒰֟፝͡ 🅸🅳: ${randomCharacter.id} ꒱─┄⃨┉┈─͡┄͡┉
ㅤㅤㅤㅤㅤㅤ© ᑲ᥆𝗍 𝗀ɑᥴ꯭hɑ 𝗌𝗒sł꯭ᥱꭑ꒱
`

await conn.sendMessage(m.chat, {
image: { url: randomImage },
mimetype: "image/jpeg",
caption: message
}, { quoted: m })

} catch (error) {
console.error(error)
await conn.reply(m.chat, `✘ Error al cargar el personaje: ${error.message}`, m)
}
}

handler.help = ['rw', 'rollwaifu']
handler.tags = ['gacha']
handler.command = ['rw', 'rollwaifu']
handler.group = true
handler.cooldown = 900000

export default handler
