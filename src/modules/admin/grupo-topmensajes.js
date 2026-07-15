import { areJidsSameUser } from '@whiskeysockets/baileys'

const PER_PAGE = 10

const normalizeJid = jid => typeof jid === 'string' ? jid.split(':')[0] : jid

const parsePositiveInt = value => {
const number = Number.parseInt(value, 10)
return Number.isFinite(number) && number > 0 ? number : null
}

const getParticipantJid = participant => normalizeJid(participant?.jid || participant?.id || participant?.lid)

const getIdentityKeys = participant => [participant?.jid, participant?.id, participant?.lid]
.map(normalizeJid)
.filter(Boolean)

const getCurrentParticipants = async (conn, m, participants = []) => {
if (Array.isArray(participants) && participants.length) return participants
try {
const metadata = await conn.groupMetadata(m.chat)
return Array.isArray(metadata?.participants) ? metadata.participants : []
} catch (error) {
console.error('[topmensajes] no se pudo obtener metadata del grupo', error)
return []
}
}

const isBotJid = (jid, conn) => {
const normalized = normalizeJid(jid)
if (!normalized) return false
const botJids = [conn?.user?.jid, conn?.user?.id, conn?.authState?.creds?.me?.jid, conn?.authState?.creds?.me?.id]
.map(value => normalizeJid(conn?.decodeJid?.(value) || value))
.filter(Boolean)
return botJids.some(bot => areJidsSameUser(bot, normalized) || bot === normalized)
}

const sumStatsMessages = statsUser => {
if (!statsUser?.days || typeof statsUser.days !== 'object') return 0
return Object.values(statsUser.days).reduce((total, day) => total + (Number(day?.messages) || 0), 0)
}

const getMessageCount = (chatUsers, statsUsers, keys) => {
let total = 0
for (const key of keys) {
const legacyCount = Number(chatUsers[key]?.msgCount) || 0
const statsCount = sumStatsMessages(statsUsers[key])
total = Math.max(total, legacyCount, statsCount)
}
return total
}

let handler = async (m, { conn, args, usedPrefix, participants }) => {
const page = Math.max(parsePositiveInt(args[0]) || 1, 1)
const currentParticipants = await getCurrentParticipants(conn, m, participants)
const offset = (page - 1) * PER_PAGE

const chat = global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat] || {}
const chatUsers = chat.users && typeof chat.users === 'object' ? chat.users : {}
const statsUsers = chat.messageStats?.users && typeof chat.messageStats.users === 'object' ? chat.messageStats.users : {}

const ranking = currentParticipants
.map(participant => {
const jid = getParticipantJid(participant)
const keys = getIdentityKeys(participant)
return { jid, messages: getMessageCount(chatUsers, statsUsers, keys) }
})
.filter(user => user.jid && user.messages > 0 && !isBotJid(user.jid, conn))
.sort((a, b) => b.messages - a.messages)
.slice(offset, offset + PER_PAGE)

if (!ranking.length) {
return m.reply(`❀ Aún no tengo mensajes registrados de usuarios en este grupo.

> Escribe un poco más y vuelve a usar *${usedPrefix}topmensajes*.`)
}

const lines = [`❀ Top de mensajes registrados en este grupo`, '']
for (const [index, user] of ranking.entries()) {
let name = user.jid.split('@')[0]
try { name = await conn.getName(user.jid) || name } catch {}
lines.push(`*${offset + index + 1}.* ${name}`)
lines.push(`   » Mensajes: \`${user.messages}\``)
}

lines.push('')
if (ranking.length === PER_PAGE) lines.push(`> Para ver la siguiente página › *${usedPrefix}topmensajes ${page + 1}*`)
if (page > 1) lines.push(`> Para volver a la primera página › *${usedPrefix}topmensajes 1*`)
lines.push(`> Página *${page}*`)

await conn.sendMessage(m.chat, { text: lines.join('\n'), mentions: ranking.map(user => user.jid) }, { quoted: m })
}

handler.help = ['topmensajes [página]']
handler.tags = ['group']
handler.command = ['topmensajes', 'topmsg', 'topmsgs', 'rankingmensajes', 'mensajesgrupo', 'topactividad', 'actividadgrupo']
handler.group = true

export default handler
