const RANGE_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

const normalizeJid = jid => global.normalizeJid?.(jid) || (typeof jid === 'string' ? jid.split(':')[0] : '')
const participantJids = participant => [participant?.jid, participant?.id, participant?.lid].map(normalizeJid).filter(Boolean)

const getCurrentParticipants = async (conn, chat, fallback = []) => {
if (Array.isArray(fallback) && fallback.length) return fallback
try {
const metadata = await conn.groupMetadata(chat)
return Array.isArray(metadata?.participants) ? metadata.participants : []
} catch (error) {
console.error('[topmensajes] no se pudo obtener metadata del grupo', error)
return []
}
}

const getActivity = (chatUsers, participant) => {
for (const jid of participantJids(participant)) {
const data = chatUsers[jid]
if (data && typeof data === 'object') return { jid, data }
}
return { jid: participantJids(participant)[0] || '', data: {} }
}

let handler = async (m, { conn, participants = [] }) => {
const currentParticipants = await getCurrentParticipants(conn, m.chat, participants)
const chat = global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat] || {}
const chatUsers = chat.users && typeof chat.users === 'object' ? chat.users : {}
const minTime = Date.now() - (RANGE_DAYS * DAY_MS)

const ranking = currentParticipants
.map(participant => {
const { jid, data } = getActivity(chatUsers, participant)
const lastMessageTime = Number(data?.lastMessageTime ?? data?.lastMsg) || 0
const messages = lastMessageTime >= minTime ? Number(data?.msgCount) || 0 : 0
const commands = lastMessageTime >= minTime ? Number(data?.cmdCount) || 0 : 0
return { jid, name: data?.name || '', messages, commands }
})
.filter(user => user.jid && user.messages > 0)
.sort((a, b) => (b.messages - a.messages) || (b.commands - a.commands))
.slice(0, 10)

if (!ranking.length) return m.reply(`❀ Top de mensajes de los últimos *${RANGE_DAYS}* días`)

const lines = [`❀ Top de mensajes de los últimos *${RANGE_DAYS}* días`, '']
for (const [index, user] of ranking.entries()) {
let name = user.name || user.jid.split('@')[0]
try { name = await conn.getName(user.jid) || name } catch {}
lines.push(`*#${index + 1} » ${name}*`)
lines.push(`  » Mensajes: \`${user.messages}\`, Comandos: \`${user.commands}\``)
}

await conn.sendMessage(m.chat, { text: lines.join('\n') }, { quoted: m })
}

handler.help = ['topmensajes']
handler.tags = ['group']
handler.command = ['topmensajes', 'topmsg', 'topmsgs', 'rankingmensajes', 'mensajesgrupo', 'topactividad', 'actividadgrupo']
handler.group = true

handler.needsParticipants = true

export default handler
