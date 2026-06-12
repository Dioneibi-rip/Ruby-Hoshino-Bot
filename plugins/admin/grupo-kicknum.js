const handler = async (m, { conn, args, participants, command }) => {
  const prefix = args[0]
  if (!prefix || !prefix.startsWith('+')) {
    return m.reply(`⚠️ Debes especificar un prefijo válido.\nEjemplo: *.${command} +52*`)
  }

  const botNumber = conn.user.id.split(':')[0]

  const groupMetadata = await conn.groupMetadata(m.chat)
  const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id)

  const matching = participants.filter(p => 
    p.id.startsWith(prefix.replace('+', '')) &&
    p.id !== botNumber &&
    !admins.includes(p.id)
  )

  if (command === 'listnum' || command === 'listanum') {
    if (matching.length === 0) return m.reply(`🤖 No se encontraron usuarios con el prefijo ${prefix}`)

    const lista = matching.map((p, i) => `${i + 1}. wa.me/${p.id.split('@')[0]}`).join('\n')
    return m.reply(`🔎 Lista de usuarios con el prefijo ${prefix}:\n\n${lista}`)
  }

  if (command === 'kicknum') {
    if (matching.length === 0) return m.reply(`🤖 No se encontraron usuarios para expulsar con el prefijo ${prefix}`)

    for (let p of matching) {
      await conn.groupParticipantsUpdate(m.chat, [p.id], 'remove').catch(_ => null)
    }
    return m.reply(`✅ Se han expulsado ${matching.length} usuario(s) con el prefijo ${prefix}`)
  }
}

handler.command = ['kicknum', 'listnum', 'listanum']
handler.group = true
handler.botAdmin = true

export default handler