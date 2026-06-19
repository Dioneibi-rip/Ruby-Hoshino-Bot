import { loadCharacters, saveCharacters } from '../../lib/gacha-characters.js';
import { loadHarem } from '../../lib/gacha-group.js'
async function getSeriesImage(title) {
try {
const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`)
const json = await res.json()
if (json.data && json.data.length > 0) return json.data[0].images.jpg.large_image_url
return null
} catch (e) {
return null
}
}
let handler = async (m, { conn, args }) => {
const groupId = m.chat
let query = args.join(' ').replace(/\d+$/,'').trim()
if (!query) return conn.reply(m.chat, '✿ Ingresa el nombre de una serie. Ejemplo: `#ainfo blue lock`', m)
try {
const allCharacters = await loadCharacters()
const harem = await loadHarem()
const sourceMap = new Map()
allCharacters.forEach(c => {
const normalized = String(c.source || '').toLowerCase().trim()
if (normalized && !sourceMap.has(normalized)) sourceMap.set(normalized, c.source)
})
const allNormalizedSources = Array.from(sourceMap.keys())
let bestMatchNormalized = allNormalizedSources.find(s => s === query.toLowerCase())
if (!bestMatchNormalized) {
let matches = allNormalizedSources.map(s => ({ source: s, score: similarity(query, s) }))
matches.sort((a, b) => b.score - a.score)
if (matches[0] && matches[0].score > 0.4) bestMatchNormalized = matches[0].source
}
if (!bestMatchNormalized) return conn.reply(m.chat, `✘ No encontré nada parecido a "${query}".`, m)
const animeChars = allCharacters.filter(c => String(c.source || '').toLowerCase().trim() === bestMatchNormalized)
const totalChars = animeChars.length
const claimedEntriesInGroup = harem.filter(e => e.groupId === groupId && animeChars.some(ac => ac.id === e.characterId))
const claimedCount = claimedEntriesInGroup.length
const percentage = totalChars === 0 ? 0 : ((claimedCount / totalChars) * 100).toFixed(0)
let pageArg = args.find(arg => /^\d+$/.test(arg))
const page = parseInt(pageArg) || 1
const perPage = 25
const totalPages = Math.max(1, Math.ceil(totalChars / perPage))
const startIndex = (page - 1) * perPage
const endIndex = Math.min(startIndex + perPage, totalChars)
if (page < 1 || page > totalPages) return conn.reply(m.chat, `✿ Página no válida. Total: *${totalPages}*`, m)
const displayTitle = animeChars[0]?.source || sourceMap.get(bestMatchNormalized) || query
let message = `◢✿ *${displayTitle.toUpperCase()}* ✿◤\n\n`
message += `✧ Personajes: *${totalChars}*\n`
message += `✧ Reclamados: *${claimedCount}/${totalChars} (${percentage}%)*\n\n`
message += `✦ *LISTA DE PERSONAJES:*\n`
const listSlice = animeChars.sort((a, b) => parseInt(b.value || 0) - parseInt(a.value || 0)).slice(startIndex, endIndex)
const mentionSet = new Set()
for (const char of listSlice) {
const claim = harem.find(e => e.groupId === groupId && e.characterId === char.id)
let status = 'Libre'
if (claim && claim.userId) {
try {
const name = await conn.getName(claim.userId)
status = `Reclamado por ${name}`
} catch (e) {
status = `Reclamado por @${String(claim.userId).split('@')[0]}`
}
mentionSet.add(claim.userId)
}
message += `» *${char.name}* (${char.value || 0}) • ${status}\n`
}
message += `\n> ⚝ Página *${page}* de *${totalPages}*`
const mentions = Array.from(mentionSet)
const imageUrl = await getSeriesImage(displayTitle)
if (imageUrl) {
await conn.sendMessage(m.chat, { image: { url: imageUrl }, caption: message, mentions }, { quoted: m })
} else {
await conn.sendMessage(m.chat, { text: message, mentions }, { quoted: m })
}
} catch (error) {
console.error(error)
await conn.reply(m.chat, `✘ Error: ${error.message}`, m)
}
}
handler.help = ['ainfo <serie>']
handler.tags = ['gacha']
handler.command = ['ainfo', 'serieinfo']
handler.group = true
export default handler