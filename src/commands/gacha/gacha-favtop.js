import { loadCharacters, findCharacterById } from '../../library/gacha-characters.js'

function getFavoriteRows(limit = 11) {
const favorites = global.db?.getSection?.('character_favorites') || {}
const counts = new Map()
for (const characterId of Object.values(favorites)) {
if (!characterId) continue
const key = String(characterId)
counts.set(key, (counts.get(key) || 0) + 1)
}
return [...counts.entries()]
.map(([character_id, total]) => ({ character_id, total }))
.sort((a, b) => b.total - a.total)
.slice(0, limit)
}

let handler = async (m) => {
const characters = await loadCharacters()
const rows = getFavoriteRows()
if (!rows.length) return m.reply('✿ Aún no hay personajes favoritos.')

let txt = `✰ *Top de personajes favoritos:*\n\n`
rows.forEach((row, i) => {
const c = findCharacterById(characters, row.character_id) || characters.find(ch => String(ch.name) === row.character_id)
txt += `#${i + 1} » *${c?.name || row.character_id}*\n\t\t♡ ${row.total} favoritos.\n`
})

m.reply(txt.trim())
}

handler.help = ['favtop']
handler.tags = ['anime']
handler.command = ['favtop', 'favoritetop', 'topfav']
handler.group = true
handler.register = true

export default handler
