import { normalizeSessionJid } from '../../core/session-utils.js'

function pickTargetBot(m, text = '') {
const mentioned = Array.isArray(m.mentionedJid) ? m.mentionedJid.filter(Boolean) : []
const quoted = m.quoted?.sender || m.quoted?.participant || ''
const token = String(text || '').trim().split(/\s+/).find(Boolean) || ''
const raw = mentioned[0] || quoted || token
return normalizeSessionJid(raw.replace(/^@/, ''))
}

const handler = async (m, { conn, text, usedPrefix, command, isAdmin, isOwner, isROwner }) => {
if (m.isGroup && !(isAdmin || isOwner || isROwner)) {
global.dfail('admin', m, conn)
throw false
}

const selectedBot = pickTargetBot(m, text)
if (!selectedBot) {
throw `✳️ Uso: *${usedPrefix}${command} @bot*\nResponde a un mensaje del bot o menciona el sub-bot que debe hablar en este grupo.`
}

const chat = global.db.getChat(m.chat)
chat.primaryBot = selectedBot
chat.botPrimario = selectedBot
if (!chat.botSettings || typeof chat.botSettings !== 'object' || Array.isArray(chat.botSettings)) chat.botSettings = {}
chat.botSettings[selectedBot] ||= {}
chat.botSettings[selectedBot].isBanned = false
if (chat.isBanned && typeof chat.isBanned === 'object') delete chat.isBanned[selectedBot]
chat.bannedBots = Object.entries(chat.botSettings)
.filter(([, value]) => value?.isBanned === true)
.map(([jid]) => jid)

global.db.updateChat(m.chat, chat)
await global.db.write?.()

await conn.reply(m.chat, `✅ Bot primario actualizado para este grupo:\n@${selectedBot.split('@')[0]}\n\nSolo ese bot procesará comandos y respuestas desde ahora.`, m, { mentions: [selectedBot] })
}

handler.help = ['setprimary @bot']
handler.tags = ['grupo']
handler.command = ['setprimary', 'botprimario', 'setbot']
handler.admin = true
handler.group = true

export default handler
