let handler = async (m, { conn, text }) => {
  const emoji = global.emoji || '✦'
  const emoji2 = global.emoji2 || '✘'
  const owner = global.suittag || global.owner?.[0]?.[0]

  if (!text) return conn.reply(m.chat, `${emoji} Por favor, ingrese el error que desea reportar.`, m)
  if (text.length < 10) return conn.reply(m.chat, `${emoji} Especifique bien el error, mínimo 10 caracteres.`, m)
  if (text.length > 1000) return conn.reply(m.chat, `${emoji2} *Máximo 1000 caracteres para enviar el error.*`, m)
  if (!owner) return conn.reply(m.chat, `${emoji2} No hay un propietario configurado para recibir reportes.`, m)

  const reportText = `*✖️ \`R E P O R T E\` ✖️*\n\n☁️ Número:\n• Wa.me/${m.sender.split`@`[0]}\n\n👤 Usuario:\n• ${m.pushName || 'Anónimo'}\n\n💬 Mensaje:\n• ${text}`
  const quotedText = m.quoted?.text ? `\n\n↪️ Mensaje citado:\n${m.quoted.text}` : ''

  await conn.reply(`${owner}@s.whatsapp.net`, reportText + quotedText, m, { mentions: conn.parseMention(reportText) })
  return m.reply(`${emoji} El reporte se envió a mi creador, cualquier informe falso puede ocasionar baneo.`)
}

handler.help = ['reportar']
handler.tags = ['info']
handler.command = ['reporte', 'report', 'reportar', 'bug', 'error']

export default handler
