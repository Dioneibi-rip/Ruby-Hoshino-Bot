import { areJidsSameUser } from '@whiskeysockets/baileys'

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_INACTIVE_DAYS = 7
const KICK_DELAY_MS = 3000
const emoji = '👻', emoji2 = '📜', emoji3 = '⚰️', advertencia = '⚠️'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const normalizeJid = jid => typeof jid === 'string' ? jid.split(':')[0] : jid
const getParticipantJid = participant => normalizeJid(participant?.id || participant?.jid)
const isAdmin = participant => participant?.admin === 'admin' || participant?.admin === 'superadmin'

const parseInactiveDays = text => {
const days = Number.parseInt(text, 10)
return Number.isFinite(days) && days > 0 ? days : DEFAULT_INACTIVE_DAYS
}

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
const botJids = [conn?.user?.jid, conn?.user?.id].map(normalizeJid).filter(Boolean)
return botJids.some(bot => areJidsSameUser(bot, normalized))
}

const buildGhostList = async (conn, m, participants, inactiveDays) => {
const currentParticipants = await getCurrentParticipants(conn, m, participants)
const chat = global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat] || {}
const chatUsers = chat.users && typeof chat.users === 'object' ? chat.users : {}
const inactiveSince = Date.now() - (inactiveDays * DAY_MS)

return currentParticipants
.map(participant => ({ participant, jid: getParticipantJid(participant) }))
.filter(({ participant, jid }) => jid && !isAdmin(participant) && !isBotJid(jid, conn))
.filter(({ jid }) => {
const localUser = chatUsers[jid]
const lastMsg = Number(localUser?.lastMsg) || 0
return !localUser || lastMsg <= 0 || lastMsg < inactiveSince
})
.map(({ jid }) => jid)
}

const handler = async (m, { conn, participants, command, text }) => {
const inactiveDays = parseInactiveDays(text)
const fantasmas = await buildGhostList(conn, m, participants, inactiveDays)

if (command === 'fantasmas') {
if (!fantasmas.length) {
return conn.reply(m.chat, `${emoji} *¡No se han detectado fantasmas!* Umbral: *${inactiveDays} días*.`, m)
}

const texto = `╭━━━〔 𝔻𝔼𝕋𝔼ℂ𝕋𝔸𝔻𝕆ℝ 👻 〕━━⬣
┃ ${emoji2} *Lista de Fantasmas:*
${fantasmas.map(u => '┃ ⊳ @' + u.split('@')[0]).join('\n')}
┃
┃ ${advertencia} *Criterio:* sin registro local o sin mensajes en los últimos *${inactiveDays} días*.
┃ ${advertencia} *Nota:* Se excluyen admins y bots.
╰━━━━━━━━━━━━━━━━━━━━⬣`

return conn.reply(m.chat, texto, m, { mentions: fantasmas })
}

if (command === 'kickfantasmas') {
if (!fantasmas.length) {
return conn.reply(m.chat, `${emoji} *No hay fantasmas que eliminar*, el grupo está activo con el umbral de *${inactiveDays} días*.`, m)
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

handler.command = ['fantasmas', 'kickfantasmas']
handler.tags = ['grupo']
handler.group = true
handler.admin = true
handler.botAdmin = true
handler.fail = null

export default handler
