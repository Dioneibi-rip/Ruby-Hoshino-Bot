import { buildParticipantsByLid, normalizeIdentityJid, normalizeJid } from '../../core/identity-utils.js'

function getRawTargetJid(m) {
return m.mentionedJid?.[0] || m.quoted?.sender || m.quoted?.participant || m.quoted?.key?.participant || ''
}

function participantJids(participant = {}) {
return [participant.id, participant.jid, participant.lid].filter(Boolean)
}

function participantActionJid(participant = {}, fallback = '') {
return normalizeJid(participant.jid || participant.id || fallback) || participant.jid || participant.id || fallback
}

function isAdminParticipant(participant = {}) {
return ['admin', 'superadmin'].includes(participant.admin)
}

function normalizeOwnerJid(owner = '') {
const ownerId = Array.isArray(owner) ? owner?.[0] : owner
const cleanOwner = String(ownerId || '').replace(/[^0-9]/g, '')
return cleanOwner ? `${cleanOwner}@s.whatsapp.net` : ''
}

function isSameJid(a = '', b = '') {
const left = normalizeJid(a) || String(a || '').split(':')[0]
const right = normalizeJid(b) || String(b || '').split(':')[0]
return left === right
}

function findParticipantByIdentity(participants = [], jid = '') {
return participants.find(participant => participantJids(participant).some(id => isSameJid(id, jid)))
}

async function handler(m, { conn, participants = [] }) {
const rawTarget = getRawTargetJid(m)
if (!rawTarget) return conn.reply(m.chat, ` Debes mencionar a un usuario para poder expulsarlo del grupo.`, m)

const groupInfo = await conn.groupMetadata(m.chat)
const groupParticipants = Array.isArray(groupInfo?.participants) && groupInfo.participants.length ? groupInfo.participants : participants
const participantsByLid = buildParticipantsByLid(groupParticipants)
const user = await normalizeIdentityJid(conn, rawTarget, participantsByLid) || rawTarget
const botJid = await normalizeIdentityJid(conn, conn.user?.jid || conn.user?.id || '', participantsByLid)
const botParticipant = findParticipantByIdentity(groupParticipants, botJid)
const targetParticipant = findParticipantByIdentity(groupParticipants, user) || findParticipantByIdentity(groupParticipants, rawTarget)
const ownerGroup = groupInfo.owner || `${m.chat.split`-`[0]}@s.whatsapp.net`
const ownerBotJids = (global.owner || []).map(normalizeOwnerJid).filter(Boolean)
const actionJid = participantActionJid(targetParticipant, user)

if (!botParticipant || !isAdminParticipant(botParticipant)) return conn.reply(m.chat, `✦ Necesito ser administrador para expulsar usuarios.`, m)
if (!targetParticipant) return conn.reply(m.chat, `✦ El usuario no está en el grupo.`, m)
if (isSameJid(actionJid, botJid)) return conn.reply(m.chat, ` No puedo eliminar el bot del grupo.`, m)
if (isSameJid(actionJid, ownerGroup)) return conn.reply(m.chat, ` No puedo eliminar al propietario del grupo.`, m)
if (ownerBotJids.some(owner => isSameJid(actionJid, owner))) return conn.reply(m.chat, ` No puedo eliminar al propietario del bot.`, m)
if (isAdminParticipant(targetParticipant)) return conn.reply(m.chat, `✦ No puedo expulsar a un administrador del grupo.`, m)

try {
await conn.groupParticipantsUpdate(m.chat, [actionJid], 'remove')
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

export default handler
