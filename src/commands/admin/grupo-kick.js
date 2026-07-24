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

async function handler(m, { conn, participants = [] }) {
const user = getTargetJid(m)
if (!user) return conn.reply(m.chat, ` 𝜗ৎ \`¡𝖧𝗈𝗅𝖺 𝗅𝗂𝗇𝖽𝗑! 𝖣𝖾𝖻𝖾𝗌 𝗆𝖾𝗇𝖼𝗂𝗈𝗇𝖺𝗋 𝗈 𝗋𝖾𝗌𝗉𝗈𝗇𝖽𝖾𝗋 𝖺 𝗎𝗇 𝗎𝗌𝗎𝖺𝗋𝗂𝗈 𝗉𝖺𝗋𝖺 𝖾𝗑𝗉𝗎𝗅𝗌𝖺𝗋𝗅𝗈`\ 🪽`, m)

const groupInfo = await conn.groupMetadata(m.chat)
const groupParticipants = Array.isArray(groupInfo?.participants) && groupInfo.participants.length ? groupInfo.participants : participants
const botJid = conn.user?.jid || conn.user?.id || ''
const botParticipant = groupParticipants.find(p => isSameJid(participantJid(p), botJid))
const targetParticipant = groupParticipants.find(p => isSameJid(participantJid(p), user))
const ownerGroup = groupInfo.owner || `${m.chat.split`-`[0]}@s.whatsapp.net`
const ownerBot = `${global.owner?.[0]?.[0] || ''}@s.whatsapp.net`

if (!targetParticipant) return conn.reply(m.chat, `✦ El usuario no está en el grupo.`, m)
if (isSameJid(user, botJid)) return conn.reply(m.chat, ` No puedo eliminar el bot del grupo.`, m)
if (isSameJid(user, ownerGroup)) return conn.reply(m.chat, ` No puedo eliminar al propietario del grupo.`, m)
if (isSameJid(user, ownerBot)) return conn.reply(m.chat, ` No puedo eliminar al propietario del bot.`, m)
if (isAdminParticipant(targetParticipant)) return conn.reply(m.chat, `✦ No puedo expulsar a un administrador del grupo.`, m)

try {
await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
} catch (error) {
console.error('[admin:kick] groupParticipantsUpdate failed', error)
return conn.reply(m.chat, `✦ Ocurrió un error al intentar expulsar al usuario.`, m)
}
}

handler.help = ['kick']
handler.tags = ['grupo']
handler.command = ['kick','echar','hechar','sacar','ban']
handler.admin = true
handler.group = true
handler.register = true
handler.botAdmin = true