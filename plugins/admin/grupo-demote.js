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

let handler = async (m, { conn, usedPrefix, command, participants = [] }) => {
const user = getTargetJid(m)
if (!user) return m.reply(`✳️ Ingresa el tag de un usuario. Ejemplo :\n\n*${usedPrefix + command}* @tag`)

const groupInfo = await conn.groupMetadata(m.chat)
const groupParticipants = Array.isArray(groupInfo?.participants) && groupInfo.participants.length ? groupInfo.participants : participants
const botJid = conn.user?.jid || conn.user?.id || ''
const botParticipant = groupParticipants.find(p => isSameJid(participantJid(p), botJid))
const targetParticipant = groupParticipants.find(p => isSameJid(participantJid(p), user))
const ownerGroup = groupInfo.owner || `${m.chat.split`-`[0]}@s.whatsapp.net`

if (!isAdminParticipant(botParticipant)) return m.reply(`✦ Necesito ser administrador para degradar usuarios.`)
if (!targetParticipant) return m.reply(`✦ El usuario no está en el grupo.`)
if (isSameJid(user, botJid)) return m.reply(`✳️ No puedo degradarme a mí mismo.`)
if (isSameJid(user, ownerGroup)) return m.reply(`✦ No puedo degradar al propietario del grupo.`)
if (!isAdminParticipant(targetParticipant)) return m.reply(`✦ El usuario no es administrador.`)

try {
await conn.groupParticipantsUpdate(m.chat, [user], 'demote')
} catch (error) {
console.error('[admin:demote] groupParticipantsUpdate failed', error)
return m.reply(`✦ Ocurrió un error al intentar degradar al usuario.`)
}
m.reply(`✅ Usuario degradado de administrador con éxito`)
}

handler.help = ['demote @user']
handler.tags = ['group']
handler.command = ['demote', 'degradar']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
