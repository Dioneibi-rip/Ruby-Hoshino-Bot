let handler = async (m, { conn, usedPrefix, command }) => {

  if (!m.mentionedJid[0] && !m.quoted) return m.reply(`✳️ Ingresa el tag de un usuario. Ejemplo :\n\n*${usedPrefix + command}* @tag`)
  let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted.sender
  if (conn.user.jid.includes(user)) return m.reply(`✳️ No puedo degradarme a mí mismo.`)

  await conn.groupParticipantsUpdate(m.chat, [user], 'demote')
  m.reply(`✅ Usuario degradado de administrador con éxito`)

}

handler.help = ['demote @user']
handler.tags = ['group']
handler.command = ['demote', 'degradar']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler