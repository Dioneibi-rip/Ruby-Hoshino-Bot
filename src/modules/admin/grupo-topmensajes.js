const PER_PAGE = 10

const normalizeJid = jid => typeof jid === 'string' ? jid.split(':')[0] : jid

const parsePositiveInt = value => {
const number = Number.parseInt(value, 10)
return Number.isFinite(number) && number > 0 ? number : null
}

const getParticipantJid = participant => normalizeJid(participant?.id || participant?.jid)

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

let handler = async (m, { conn, args, usedPrefix, participants }) => {
const page = Math.max(parsePositiveInt(args[0]) || 1, 1)
const currentParticipants = await getCurrentParticipants(conn, m, participants)
const participantIds = currentParticipants.map(getParticipantJid).filter(Boolean)
const participantSet = new Set(participantIds)
const offset = (page - 1) * PER_PAGE

const chat = global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat] || {}
const chatUsers = chat.users && typeof chat.users === 'object' ? chat.users : {}

const ranking = participantIds
.map(jid => ({ jid, messages: Number(chatUsers[jid]?.msgCount) || 0 }))
.filter(user => user.messages > 0 && participantSet.has(user.jid))
.sort((a, b) => b.messages - a.messages)
.slice(offset, offset + PER_PAGE)

if (!ranking.length) {
return m.reply(`❀ Aún no tengo mensajes registrados en este grupo.\n\n> Escribe un poco más y vuelve a usar *${usedPrefix}topmensajes*.`)
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
