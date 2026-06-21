import { loadHarem, saveHarem, removeClaim, isSameUserId } from '../../lib/gacha-group.js'
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
return character ? { character } : { error: '✧ Ese personaje citado no existe en el catálogo.' }
}
const query = args.join(' ').trim()
if (!query) return { error: '✧ Ingresa el nombre o responde al mensaje del personaje que quieres vender.' }
const character = findCharacterByName(characters, query) || findCharacterById(characters, query)
return character ? { character } : { error: `✧ Personaje *"${query}"* no encontrado.` }
}

let handler = async (m, { args, conn, participants }) => {
const userId = normalizeToJid(m.sender, participants)
const groupId = m.chat
const { character, error } = await resolveCharacter(m, args)
if (error) return m.reply(error)
const harem = await loadHarem()
const claim = harem.find(entry => entry.groupId === groupId && String(entry.characterId) === String(character.id) && isSameUserId(entry.userId, userId))
const user = global.db.getUser(userId)
const removedFromExtras = removeFromUserInventory(user, character.id)
if (!claim && !removedFromExtras) return m.reply('✧ Esta waifu no te pertenece en este grupo.')
if (claim) removeClaim(harem, groupId, userId, character.id)
const reward = Math.max(1, Number.parseInt(character.value) || Number.parseInt(character.price) || 1000)
user.coin = Math.max(0, Number(user.coin) || 0) + reward
global.db.updateUser(userId, { coin: user.coin, extras: user.extras })
await saveHarem(harem)
await global.db.write?.()
return conn.reply(m.chat, `✿ Vendiste a *${character.name}* por *¥${reward.toLocaleString()} ${m.moneda}*.
› Nuevo saldo: *¥${user.coin.toLocaleString()} ${m.moneda}*.`, m)
}

handler.help = ['venderwaifu <personaje>']
handler.tags = ['waifus', 'economia']
handler.command = ['vender', 'sell']
handler.group = true
handler.register = true

export default handler
