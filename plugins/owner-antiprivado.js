import { ensureBotSettings } from '../src/core/chat-state.js'

const MODES = {
  ban: ['ban', 'block', 'bloquear', 'agresivo'],
  ignore: ['ignore', 'ignorar', 'silent', 'silencio'],
  off: ['off', 'disable', 'desactivar'],
  on: ['on', 'enable', 'activar'],
}

function findMode(arg = '') {
  const normalized = arg.toLowerCase()
  for (const [mode, aliases] of Object.entries(MODES)) {
    if (aliases.includes(normalized)) return mode
  }
  return ''
}

let handler = async (m, { conn, args, usedPrefix }) => {
  const settings = ensureBotSettings(conn)
  const mode = findMode(args[0])

  if (!mode) {
    return m.reply(`╭━━〔 🚫 Anti-Privado 〕━━⬣\n┃ Estado: *${settings.antiPrivate ? 'ACTIVO' : 'INACTIVO'}*\n┃ Modo: *${settings.antiPrivateMode || 'ban'}*\n╰━━━━━━━━━━━━━━━━⬣\n\n*Uso:*\n• ${usedPrefix}antiprivado ban\n  Bloquea agresivamente a quien use comandos en privado.\n\n• ${usedPrefix}antiprivado ignore\n  Marca/ignora silenciosamente comandos en privado.\n\n• ${usedPrefix}antiprivado off\n  Desactiva el sistema.`)
  }

  if (mode === 'off') {
    settings.antiPrivate = false
    return m.reply('✅ Anti-Privado desactivado.')
  }

  settings.antiPrivate = true
  if (mode !== 'on') settings.antiPrivateMode = mode
  settings.antiPrivateMode ||= 'ban'
  return m.reply(`✅ Anti-Privado activado en modo *${settings.antiPrivateMode}*.`)
}

handler.help = ['antiprivado <ban|ignore|off>']
handler.tags = ['owner']
handler.command = ['antiprivado', 'antipriv', 'antiprivate']
handler.owner = true

export default handler
