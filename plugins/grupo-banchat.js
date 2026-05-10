let handler = async (m, { conn, isROwner, args, usedPrefix }) => {
  if (!isROwner && m.sender !== conn.user.jid) {
    throw 'Este comando solo puede ser utilizado por el creador o por el mismo bot.'
  }

  if (!m.isGroup) throw 'Este comando solo puede usarse en grupos.'

  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
  const botJid = conn.user.jid
  chat.bannedBots = Array.isArray(chat.bannedBots) ? chat.bannedBots : []

  const mode = (args[0] || 'silent').toLowerCase()
  const allowedModes = ['silent', 'strict', 'status']
  if (!allowedModes.includes(mode)) {
    throw `Modo no válido. Usa: ${usedPrefix}banchat silent | strict | status`
  }

  if (mode === 'status') {
    const active = chat.bannedBots.includes(botJid)
    const activeMode = chat.banchatMode || 'silent'
    return m.reply(`Estado banchat: *${active ? 'ACTIVO' : 'INACTIVO'}*\nModo: *${activeMode}*`)
  }

  if (!chat.bannedBots.includes(botJid)) chat.bannedBots.push(botJid)
  chat.banchatMode = mode

  // Respuesta discreta
  await m.react('🔕')

  // Si el bot es admin, borra el comando para mayor discreción
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

handler.help = ['banchat [silent|strict|status]']
handler.tags = ['owner']
handler.command = ['banchat']
handler.group = true

export default handler
