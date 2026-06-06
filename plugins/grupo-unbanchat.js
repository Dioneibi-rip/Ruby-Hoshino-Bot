import { normalizeJid } from '../src/core/chat-state.js'

function resolveTarget(m, args) {
  return m.mentionedJid?.[0] || normalizeJid(args[0]) || m.chat
}

let handler = async (m, { conn, args, usedPrefix }) => {
  const target = resolveTarget(m, args)
  if (!target) throw `Indica un chat, número o JID. Ejemplo: ${usedPrefix}unbanchat 120363xxxx@g.us`

  const chat = global.db.data.chats[target] ||= {}
  const botJid = conn.user.jid
  chat.bannedBots = Array.isArray(chat.bannedBots) ? chat.bannedBots.filter((jid) => jid !== botJid) : []
  chat.banchatMode = 'silent'

  await m.reply(`✅ Banchat desactivado para *${target}*.`)
}

handler.help = ['unbanchat [jid|número]']
handler.tags = ['owner']
handler.command = ['unbanchat', 'desbanearchat']
handler.owner = true

export default handler
