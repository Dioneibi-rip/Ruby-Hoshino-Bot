let handler = async (m, { conn, isROwner }) => {
  if (!isROwner && m.sender !== conn.user.jid) {
    throw 'Este comando solo puede ser utilizado por el creador o el mismo bot.'
  }

  const chat = global.db.data.chats[m.chat]
  if (!chat || !Array.isArray(chat.bannedBots)) {
    await m.react('✅')
    return
  }

  const botJid = conn.user.jid
  chat.bannedBots = chat.bannedBots.filter(jid => jid !== botJid)
  chat.banchatMode = 'silent'

  await m.react('✅')
}

handler.help = ['unbanchat']
handler.tags = ['owner']
handler.command = ['unbanchat', 'desbanearchat']
handler.group = true

export default handler
