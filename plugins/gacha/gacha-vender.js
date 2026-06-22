import { loadHarem, saveHarem, removeClaim, isSameUserId, addOrUpdateVenta } from '../../lib/gacha-group.js'
import { loadCharacters, findCharacterById, findCharacterByName, extractCharacterIdFromText } from '../../lib/gacha-characters.js'

function normalizeToJid(rawJid, participants = []) {
if (!rawJid || typeof rawJid !== 'string') return rawJid
if (!rawJid.endsWith('@lid')) return rawJid
const pInfo = participants.find(p => p?.lid === rawJid)
return pInfo?.id || pInfo?.jid || rawJid
}

function getUserCharacterList(user) {
if (!user.extras || typeof user.extras !== 'object' || Array.isArray(user.extras)) user.extras = {}
if (!Array.isArray(user.extras.characters)) user.extras.characters = []
return user.extras.characters
}

function removeFromUserInventory(user, characterId) {
const characters = getUserCharacterList(user)
const before = characters.length
user.extras.characters = characters.filter(id => String(id) !== String(characterId))
return before !== user.extras.characters.length
}

async function resolveCharacter(m, args) {
const characters = await loadCharacters()
if (m.quoted?.text) {
const id = extractCharacterIdFromText(m.quoted.text)
if (!id) return { error: '✧ No se pudo encontrar el ID del personaje citado.' }
const character = findCharacterById(characters, id)
const priceInput = args.join(' ').trim()
return character ? { character, priceInput } : { error: '✧ Ese personaje citado no existe en el catálogo.' }
}
const raw = args.join(' ').trim()
if (!raw) return { error: '✧ Ingresa el nombre del personaje y el precio de venta.' }
const parts = raw.split(/\s+/)
const last = parts.at(-1)
const hasPrice = /^\d+$/.test(last || '')
const priceInput = hasPrice ? last : ''
const query = hasPrice ? parts.slice(0, -1).join(' ').trim() : raw
if (!query) return { error: '✧ Ingresa el nombre del personaje antes del precio.' }
const character = findCharacterByName(characters, query) || findCharacterById(characters, query)
return character ? { character, priceInput } : { error: `✧ Personaje *"${query}"* no encontrado.` }
}

let handler = async (m, { args, conn, participants }) => {
const userId = normalizeToJid(m.sender, participants)
const groupId = m.chat
const { character, priceInput, error } = await resolveCharacter(m, args)
if (error) return m.reply(error)
const price = Number.parseInt(priceInput)
if (!Number.isFinite(price) || price < 1) return m.reply('✧ Ingresa un precio válido. Ejemplo: *#vender Rem 5000*')
const harem = await loadHarem()
const claim = harem.find(entry => entry.groupId === groupId && String(entry.characterId) === String(character.id) && isSameUserId(entry.userId, userId))
const user = global.db.getUser(userId)
const removedFromExtras = removeFromUserInventory(user, character.id)
if (!claim && !removedFromExtras) return m.reply('✧ Esta waifu no te pertenece en este grupo.')
if (claim) removeClaim(harem, groupId, userId, character.id)
if (removedFromExtras) global.db.updateUser(userId, { extras: user.extras })
await saveHarem(harem)
await addOrUpdateVenta([], groupId, { id: String(character.id), name: character.name, precio: price, vendedor: userId, fecha: Date.now() })
await global.db.write?.()
return conn.reply(m.chat, `✿ Pusiste a *${character.name}* en el mercado por *¥${price.toLocaleString()} ${m.moneda}*.`, m)
}

handler.help = ['venderwaifu <personaje> <precio>']
handler.tags = ['waifus', 'economia']
handler.command = ['vender', 'sell']
handler.group = true
handler.register = true

export default handler
