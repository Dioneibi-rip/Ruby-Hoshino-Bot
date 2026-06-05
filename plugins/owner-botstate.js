import { getBotState, getControlPanelText, normalizeJid, setBotState } from '../src/core/chat-state.js'

const MODES = new Map([
  ['safe', 'safe'], ['seguro', 'safe'], ['off', 'safe'], ['reposo', 'safe'],
  ['all', 'all'], ['todos', 'all'], ['global', 'all'], ['on', 'all'],
  ['private', 'private'], ['privados', 'private'], ['pv', 'private'],
  ['group', 'group'], ['grupos', 'group'], ['gp', 'group'],
  ['chat', 'chat'], ['specific', 'chat'], ['jid', 'chat'],
  ['blacklist', 'blacklist'], ['lista-negra', 'blacklist'], ['excepto', 'blacklist'],
])

function parseJidList(text = '', mentions = []) {
  const raw = text.split(/[\s,|]+/).map(normalizeJid).filter(Boolean)
  return [...new Set([...mentions, ...raw])]
}

let handler = async (m, { conn, args, text, usedPrefix }) => {
  const requested = (args[0] || '').toLowerCase()
  const mode = MODES.get(requested)

  if (!mode || requested === 'status') {
    return m.reply(getControlPanelText(conn, usedPrefix))
  }

  if (mode === 'chat') {
    const target = normalizeJid(args[1]) || m.mentionedJid?.[0]
    if (!target) throw `Indica el JID objetivo. Ejemplo: ${usedPrefix}botstate chat 120363xxxx@g.us`
    setBotState(conn, { mode, chat: target, blacklist: [] })
    return m.reply(`🛡️ Estado actualizado: responderé únicamente en *${target}*.`)
  }

  if (mode === 'blacklist') {
    const listText = text.replace(/^\S+\s*/, '')
    const blacklist = parseJidList(listText, m.mentionedJid || [])
    setBotState(conn, { mode, chat: null, blacklist })
    return m.reply(`🛡️ Estado actualizado: responderé en todos los chats excepto *${blacklist.length}* chat(s) en lista negra.`)
  }

  setBotState(conn, { mode, chat: null, blacklist: getBotState(conn).blacklist })
  const labels = {
    safe: 'Modo Seguro: ignoraré grupos y privados hasta nueva orden.',
    all: 'Modo Global: responderé en todos los chats permitidos.',
    private: 'Modo Privados: ignoraré grupos.',
    group: 'Modo Grupos: ignoraré privados.',
  }
  return m.reply(`🛡️ ${labels[mode]}`)
}

handler.help = ['botstate <safe|all|private|group|chat|blacklist>']
handler.tags = ['owner']
handler.command = ['botstate', 'estadobot', 'modoseguro', 'controlbot']
handler.owner = true

export default handler
