import { loadCharacters, findCharacterByName } from '../../library/gacha-characters.js'

let handler = async (m, { args }) => {
if (!args[0]) return m.reply('✿ Debes escribir el nombre del personaje que deseas establecer como favorito.')

const characters = await loadCharacters()
const characterName = args.join(' ').toLowerCase().trim()
const userId = m.sender
const character = findCharacterByName(characters, characterName)
if (!character) return m.reply('✿ Personaje no encontrado.')

const favId = String(character.id || character.name)
const current = global.db?.get?.('character_favorites', userId) || global.db?.getSection?.('character_favorites')?.[userId]
if (current === favId) return m.reply(`✿ *${character.name}* ya es tu personaje favorito.`)

global.db?.set?.('character_favorites', userId, favId)

await m.reply(`✐ Ahora *${character.name}* es tu personaje favorito!`)
}

handler.help = ['setfav <nombre>']
handler.tags = ['anime']
handler.command = ['setfav', 'setfavorito']
handler.group = true
handler.register = true

export default handler
