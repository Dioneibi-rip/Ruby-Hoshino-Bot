const SAFE_MODE = 'safe'
const VALID_BOT_STATE_MODES = new Set(['safe', 'all', 'private', 'group', 'chat', 'blacklist'])
const CONTROL_COMMANDS = new Set(['botstate', 'estadobot', 'modoseguro', 'controlbot', 'banchat', 'unbanchat', 'desbanearchat', 'antiprivado', 'antipriv', 'antiprivate'])

export function getBotJid(conn) {
  return conn?.user?.jid || conn?.user?.id || conn?.authState?.creds?.me?.jid || conn?.session?.id || 'primary'
}

export function normalizeJid(value = '') {
  const input = String(value || '').trim().replace(/[<>]/g, '').replace(/^@/, '')
  if (!input) return ''
  if (input.includes('@')) return input
  const digits = input.replace(/\D/g, '')
  return digits ? `${digits}@s.whatsapp.net` : ''
}

export function ensureBotSettings(conn) {
  global.db.data.settings ||= {}
  const botJid = getBotJid(conn)
  const settings = global.db.data.settings[botJid] ||= {}
  settings.botState ||= {
    mode: SAFE_MODE,
    chat: null,
    blacklist: [],
    initialized: false,
    updatedAt: 0,
  }
  if (!VALID_BOT_STATE_MODES.has(settings.botState.mode)) settings.botState.mode = SAFE_MODE
  if (!Array.isArray(settings.botState.blacklist)) settings.botState.blacklist = []
  settings.antiPrivateMode ||= 'ban'
  return settings
}

export function setBotState(conn, patch = {}) {
  const settings = ensureBotSettings(conn)
  const state = settings.botState
  if (patch.mode && VALID_BOT_STATE_MODES.has(patch.mode)) state.mode = patch.mode
  if ('chat' in patch) state.chat = patch.chat || null
  if (Array.isArray(patch.blacklist)) state.blacklist = [...new Set(patch.blacklist.filter(Boolean))]
  state.initialized = true
  state.updatedAt = Date.now()
  return state
}

export function getBotState(conn) {
  return ensureBotSettings(conn).botState
}

export function isOwnerJid(jid = '') {
  const number = String(jid || '').split('@')[0].replace(/\D/g, '')
  return (global.owner || []).some(([owner]) => String(owner).replace(/\D/g, '') === number)
}

export function getCommandName(text = '') {
  const prefix = global.prefix?.exec?.(text)?.[0]
  if (!prefix) return ''
  return text.slice(prefix.length).trim().split(/\s+/)[0]?.toLowerCase() || ''
}

export function isControlCommand(text = '') {
  return CONTROL_COMMANDS.has(getCommandName(text))
}

export function shouldIgnoreByBotState(conn, m, sender) {
  if (!m || m.fromMe || isOwnerJid(sender) || isControlCommand(m.text)) return false
  const state = getBotState(conn)
  const chatId = m.chat
  if (!chatId) return false
  if (state.mode === 'safe') return true
  if (state.mode === 'all') return false
  if (state.mode === 'private') return Boolean(m.isGroup)
  if (state.mode === 'group') return !m.isGroup
  if (state.mode === 'chat') return state.chat !== chatId
  if (state.mode === 'blacklist') return state.blacklist.includes(chatId)
  return true
}

export function shouldIgnoreByBanChat(conn, m, sender) {
  if (!m?.chat || m.fromMe || isOwnerJid(sender) || isControlCommand(m.text)) return false
  const botJid = getBotJid(conn)
  const chat = global.db?.data?.chats?.[m.chat]
  return Boolean(chat?.bannedBots && botJid && chat.bannedBots.includes(botJid))
}

export function getControlPanelText(conn, prefix = '#') {
  const state = getBotState(conn)
  const modeNames = {
    safe: 'Modo Seguro (reposo total)',
    all: 'Responder en todos los chats',
    private: 'Responder solo en privados',
    group: 'Responder solo en grupos',
    chat: `Responder solo en: ${state.chat || 'sin chat configurado'}`,
    blacklist: `Todos excepto lista negra (${state.blacklist.length})`,
  }
  return `╭━━〔 🛡️ Panel de Control 〕━━⬣\n` +
    `┃ Estado actual: *${modeNames[state.mode] || state.mode}*\n` +
    `┃ Sesión: *${getBotJid(conn)}*\n` +
    `╰━━━━━━━━━━━━━━━━⬣\n\n` +
    `El bot está en reposo seguro hasta que el dueño cambie el estado global.\n\n` +
    `*Comandos del dueño:*\n` +
    `• ${prefix}botstate all — activar todos los chats\n` +
    `• ${prefix}botstate private — solo privados\n` +
    `• ${prefix}botstate group — solo grupos\n` +
    `• ${prefix}botstate chat <jid> — solo un chat\n` +
    `• ${prefix}botstate blacklist <jid1,jid2> — todos excepto lista negra\n` +
    `• ${prefix}botstate safe — volver al modo seguro\n\n` +
    `También puedes usar ${prefix}banchat <jid> y ${prefix}unbanchat <jid> para mutear chats puntuales.`
}

export async function sendStartupControlPanel(conn) {
  const settings = ensureBotSettings(conn)
  if (settings.botState.initialized) return false
  const selfChat = conn?.user?.id || getBotJid(conn)
  await conn.sendMessage(selfChat, { text: getControlPanelText(conn) })
  return true
}
