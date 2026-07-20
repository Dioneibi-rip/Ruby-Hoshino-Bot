import { areJidsSameUser } from '@whiskeysockets/baileys'

const KICK_DELAY_MS = 300
const RANGE_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000
const emoji = '👻', emoji2 = '📜', emoji3 = '⚰️', advertencia = '⚠️'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const normalizeJid = jid => global.normalizeJid?.(jid) || (typeof jid === 'string' ? jid.split(':')[0] : '')
const getParticipantJid = participant => normalizeJid(participant?.jid || participant?.id || participant?.lid)
const getIdentityKeys = participant => [participant?.jid, participant?.id, participant?.lid]
.map(normalizeJid)
.filter(Boolean)
const isAdmin = participant => participant?.admin === 'admin' || participant?.admin === 'superadmin'

const getCurrentParticipants = async (conn, m, participants = []) => {
if (Array.isArray(participants) && participants.length) return participants
try {
const metadata = await conn.groupMetadata(m.chat)
return Array.isArray(metadata?.participants) ? metadata.participants : []
} catch (error) {
console.error('[fantasmas] no se pudo obtener metadata del grupo', error)
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

const hasRecentLocalActivity = (chatUsers, keys, now = Date.now()) => {
const minTime = now - (RANGE_DAYS * DAY_MS)
return keys.some(key => {
const localUser = chatUsers[key]
const lastMessageTime = Number(localUser?.lastMessageTime) || 0
return lastMessageTime > 0 && lastMessageTime >= minTime
})
}

const buildGhostList = async (conn, m, participants) => {
const currentParticipants = await getCurrentParticipants(conn, m, participants)
const chat = global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat] || {}
const chatUsers = chat.users && typeof chat.users === 'object' ? chat.users : {}
const now = Date.now()

return currentParticipants
.map(participant => ({ participant, jid: getParticipantJid(participant), keys: getIdentityKeys(participant) }))
.filter(({ participant, jid }) => jid && !isAdmin(participant) && !isBotJid(jid, conn))
.filter(({ keys }) => !hasRecentLocalActivity(chatUsers, keys, now))
.map(({ jid }) => jid)
}

const handler = async (m, { conn, participants, command }) => {
const fantasmas = await buildGhostList(conn, m, participants)

if (command === 'fantasmas' || command === 'fantamas') {
if (!fantasmas.length) {
return conn.reply(m.chat, `${emoji} *¡No se han detectado fantasmas!* Todos los usuarios no administradores escribieron en los últimos *${RANGE_DAYS}* días.`, m)
}

const texto = `╭━━━〔 𝔻𝔼𝕋𝔼ℂ𝕋𝔸𝔻𝕆ℝ 👻 〕━━⬣
┃ ${emoji2} *Lista de Fantasmas:*
${fantasmas.map(u => '┃ ⊳ @' + u.split('@')[0]).join('\n')}
┃
┃ ${advertencia} *Criterio:* usuarios sin mensajes en los últimos *${RANGE_DAYS}* días.
┃ ${advertencia} *Nota:* Se excluyen admins y bots.
╰━━━━━━━━━━━━━━━━━━━━⬣`

return conn.reply(m.chat, texto, m, { mentions: fantasmas })
}

if (command === 'kickfantasmas') {
if (!fantasmas.length) {
return conn.reply(m.chat, `${emoji} *No hay fantasmas que eliminar.* Todos los usuarios no administradores escribieron en los últimos *${RANGE_DAYS}* días.`, m)
}

const texto = `╭────〔 𝔼𝕃𝕀𝕄𝕀ℕ𝔸ℂ𝕀Óℕ ${emoji3} 〕────⬣
┃ Se detectaron *${fantasmas.length} fantasmas*
┃ Iniciando purga en *5 segundos...*
┃
┃ ${emoji2} *Lista de expulsión:*
${fantasmas.map(u => '┃ ⊳ @' + u.split('@')[0]).join('\n')}
╰━━━━━━━━━━━━━━━━━━━━⬣`

await conn.reply(m.chat, texto, m, { mentions: fantasmas })
await delay(5000)

let eliminados = 0
let errores = 0
for (const id of fantasmas) {
try {
await conn.groupParticipantsUpdate(m.chat, [id], 'remove')
eliminados += 1
await delay(KICK_DELAY_MS)
} catch (e) {
console.error(`❌ Error al eliminar ${id}:`, e?.message || e)
errores += 1
}
}

return conn.reply(m.chat, `${emoji3} *Proceso terminado.* ${eliminados} eliminados, ${errores} fallos.`, m)
}
}

handler.command = ['fantasmas', 'fantamas', 'kickfantasmas']
handler.tags = ['grupo']
handler.group = true
handler.admin = true
handler.botAdmin = true
handler.fail = null

export default handler
