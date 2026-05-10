let handler = async (m, { conn, args, usedPrefix, command }) => {
  const settings = global.db.data.settings[conn.user.jid] || (global.db.data.settings[conn.user.jid] = {})
  if (!Array.isArray(settings.disabledCommands)) settings.disabledCommands = []

  const action = String(args[0] || '').toLowerCase()
  const cmd = String(args[1] || '').toLowerCase().replace(/^[#./!]/, '')

  if (!['on', 'off', 'enable', 'disable', 'activar', 'desactivar'].includes(action) || !cmd) {
    const current = settings.disabledCommands.length
      ? settings.disabledCommands.map(c => `• ${c}`).join('\n')
      : '• (ninguno)'

    return conn.reply(
      m.chat,
      `◢✿ *GESTOR DE COMANDOS* ✿◤\n\n` +
      `✧ Uso:\n` +
      `- *${usedPrefix + command} off <comando>* → desactivar\n` +
      `- *${usedPrefix + command} on <comando>* → activar\n\n` +
      `✧ Desactivados actualmente:\n${current}`,
      m
    )
  }

  const disable = ['off', 'disable', 'desactivar'].includes(action)
  if (disable) {
    if (!settings.disabledCommands.includes(cmd)) settings.disabledCommands.push(cmd)
    return conn.reply(m.chat, `✅ Comando *${cmd}* desactivado correctamente.`, m)
  }

  settings.disabledCommands = settings.disabledCommands.filter(c => c !== cmd)
  return conn.reply(m.chat, `✅ Comando *${cmd}* activado nuevamente.`, m)
}

handler.help = ['togglecmd <on|off> <comando>', 'cmd <on|off> <comando>']
handler.tags = ['owner']
handler.command = ['togglecmd', 'cmd', 'comando']
handler.rowner = true

export default handler
