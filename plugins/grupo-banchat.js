import { normalizeJid } from '../src/core/chat-state.js'

const MODES = new Set(['silent', 'strict'])

function resolveTarget(m, args) {
  const explicit = args.find((arg) => !MODES.has(String(arg).toLowerCase()) && String(arg).toLowerCase() !== 'status')
  return m.mentionedJid?.[0] || normalizeJid(explicit) || m.chat
}

let handler = async (m, { conn, args, usedPrefix }) => {
  const requestedMode = (args.find((arg) => MODES.has(String(arg).toLowerCase())) || 'silent').toLowerCase()
  const wantsStatus = args.some((arg) => String(arg).toLowerCase() === 'status')
  const target = resolveTarget(m, args)
  if (!target) throw `Indica un chat, número o JID. Ejemplo: ${usedPrefix}banchat 120363xxxx@g.us`

  const chat = global.db.data.chats[target] ||= {}
  const botJid = conn.user.jid
  chat.bannedBots = Array.isArray(chat.bannedBots) ? chat.bannedBots : []

  if (wantsStatus) {
    const active = chat.bannedBots.includes(botJid)
    return m.reply(`🔕 Banchat remoto\n\nChat: *${target}*\nEstado: *${active ? 'ACTIVO' : 'INACTIVO'}*\nModo: *${chat.banchatMode || 'silent'}*`)
  }

  if (!chat.bannedBots.includes(botJid)) chat.bannedBots.push(botJid)
  chat.banchatMode = requestedMode

  await m.reply(`🔕 Banchat activado para *${target}* en modo *${requestedMode}*.`)

  if (m.isGroup && target === m.chat) {
    try {
      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: m.key.id,
          participant: m.key.participant || m.sender,
        },
      })
    } catch {}
  }
}

handler.help = ['banchat [jid|número] [silent|strict|status]']
handler.tags = ['owner']
handler.command = ['banchat']
handler.owner = true

export default handler
