function getTargetJid(m) {
return m.mentionedJid?.[0] || m.quoted?.sender || ''
}

function participantJid(participant = {}) {
return participant.id || participant.jid || participant.lid || ''
}

function isAdminParticipant(participant = {}) {
return ['admin', 'superadmin'].includes(participant.admin)
}

function isSameJid(a = '', b = '') {
return String(a || '').split(':')[0] === String(b || '').split(':')[0]
}

const handler = async (m, { conn, participants = [] }) => {
const user = getTargetJid(m)
if (!user) throw '⚠️ Debes mencionar a un usuario o responder a su mensaje para promoverlo.'

const groupInfo = await conn.groupMetadata(m.chat)
const groupParticipants = Array.isArray(groupInfo?.participants) && groupInfo.participants.length ? groupInfo.participants : participants
const botJid = conn.user?.jid || conn.user?.id || ''
const botParticipant = groupParticipants.find(p => isSameJid(participantJid(p), botJid))
const targetParticipant = groupParticipants.find(p => isSameJid(participantJid(p), user))

if (!isAdminParticipant(botParticipant)) return conn.reply(m.chat, `✦ Necesito ser administrador para promover usuarios.`, m)
if (!targetParticipant) return conn.reply(m.chat, `✦ El usuario no está en el grupo.`, m)
if (isAdminParticipant(targetParticipant)) return conn.reply(m.chat, `✦ El usuario ya es administrador.`, m)

try {
await conn.groupParticipantsUpdate(m.chat, [user], 'promote')
} catch (error) {
console.error('[admin:promote] groupParticipantsUpdate failed', error)
return conn.reply(m.chat, `✦ Ocurrió un error al intentar promover al usuario.`, m)
}
conn.reply(m.chat, `✅ @${user.split('@')[0]} ahora es administrador.`, m, { mentions: [user] })
}

handler.help = ['promote']
handler.tags = ['grupo']
handler.command = ['promote', 'darpija', 'promover']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
