import { promises as fs } from 'fs'

const charactersFilePath = './src/database/characters.json'
const haremFilePath = './src/database/harem.json'

async function loadCharacters() {
try {
const data = await fs.readFile(charactersFilePath, 'utf-8')
return JSON.parse(data)
} catch (error) {
throw new Error('No se pudo cargar el archivo characters.json.')
}
}

async function saveCharacters(characters) {
try {
await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2), 'utf-8')
} catch (error) {
throw new Error('❀ No se pudo guardar el archivo characters.json.')
}
}

async function loadHarem() {
try {
const data = await fs.readFile(haremFilePath, 'utf-8')
return JSON.parse(data)
} catch (error) {
return []
}
}

async function saveHarem(harem) {
try {
await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2))
} catch (error) {
throw new Error('❀ No se pudo guardar el archivo harem.json.')
}
}

let handler = async (m, { conn, args, participants }) => {
let userId = m.sender;
if (m.sender.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === m.sender);
if (pInfo && pInfo.id) userId = pInfo.id;
}

if (args.length < 2) {
await conn.reply(m.chat, '《✧》Debes especificar el nombre del personaje y mencionar a quien quieras regalarlo.', m)
return
}

const characterName = args.slice(0, -1).join(' ').toLowerCase().trim()
let rawWho = m.mentionedJid[0]

if (!rawWho) {
await conn.reply(m.chat, '《✧》Debes mencionar a un usuario válido.', m)
return
}

let who = rawWho;
if (rawWho.endsWith('@lid') && m.isGroup) {
const pInfo = participants.find(p => p.lid === rawWho);
if (pInfo && pInfo.id) who = pInfo.id;
}

try {
const characters = await loadCharacters()
const character = characters.find(c => c.name.toLowerCase() === characterName && c.user === userId)

if (!character) {
await conn.reply(m.chat, `《✧》*${characterName}* no está reclamado por ti.`, m)
return
}

character.user = who
await saveCharacters(characters)

const harem = await loadHarem()
const userEntryIndex = harem.findIndex(entry => entry.userId === who)

if (userEntryIndex !== -1) {
harem[userEntryIndex].characterId = character.id
harem[userEntryIndex].lastClaimTime = Date.now()
} else {
const userEntry = {
userId: who,
characterId: character.id,
lastClaimTime: Date.now()
}
harem.push(userEntry)
}

await saveHarem(harem)

await conn.reply(m.chat, `✰ *${character.name}* ha sido regalado a @${who.split('@')[0]}!`, m, { mentions: [who] })
} catch (error) {
await conn.reply(m.chat, `✘ Error al regalar el personaje: ${error.message}`, m)
}
}

handler.help = ['regalar <nombre del personaje> @usuario']
handler.tags = ['anime']
handler.command = ['regalar', 'givewaifu', 'givechar']
handler.group = true

export default handler