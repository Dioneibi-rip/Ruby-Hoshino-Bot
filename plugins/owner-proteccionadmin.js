import { loadHarem, saveHarem, isSameUserId } from '../lib/gacha-group.js'
import { loadCharacters } from '../lib/gacha-characters.js'
import { PROTECTION_DURATIONS, formatProtectionDate } from '../lib/gacha-protection.js'

const ALL_PATTERN = /^(all|todos|todo)$/i
const ACTIONS = new Set(['add', 'añadir', 'agregar', 'set', 'renew', 'renovar', 'extender'])

function normalizeAction(raw = '') {
  const action = String(raw || '').toLowerCase()
  if (['renew', 'renovar', 'extender'].includes(action)) return 'renew'
  if (['add', 'añadir', 'agregar', 'set'].includes(action)) return 'add'
  return null
}

function extractTargetJid({ m, args }) {
  let target = m.mentionedJid?.[0] || m.quoted?.sender || null
  let sanitizedArgs = [...args]

  if (!target && sanitizedArgs.length) {
    const maybe = sanitizedArgs[sanitizedArgs.length - 1]
    if (/^@?\d{5,20}$/.test(maybe)) {
      target = `${maybe.replace('@', '')}@s.whatsapp.net`
      sanitizedArgs.pop()
    }
  }

  return { target, sanitizedArgs }
}

let handler = async (m, { conn, args, participants, usedPrefix, command }) => {
  if (!m.isGroup) return conn.reply(m.chat, '✘ Este comando funciona en grupos.', m)

  if (!args.length) {
    return conn.reply(m.chat,
      `◢✿ *OWNER PROTECCIÓN* ✿◤\n\n` +
      `✧ Uso:\n` +
      `*${usedPrefix + command} <add|renew> <duración> <personaje|all> @usuario*\n\n` +
      `✧ Duraciones: *3d | 7d | 15d | 30d*\n` +
      `✧ Si no mencionas usuario, se aplica a ti.\n\n` +
      `✦ Ejemplos:\n` +
      `- *${usedPrefix + command} add 7d all @user*\n` +
      `- *${usedPrefix + command} renew 15d miku @user*\n` +
      `- *${usedPrefix + command} add 30d all*`, m)
  }

  let action = normalizeAction(args[0])
  let shiftedArgs = [...args]
  if (action) shiftedArgs.shift()
  else action = 'add'

  const duration = String(shiftedArgs[0] || '').toLowerCase()
  const durationData = PROTECTION_DURATIONS[duration]
  if (!durationData) {
    return conn.reply(m.chat, '✘ Duración no válida. Usa: *3d, 7d, 15d o 30d*.', m)
  }

  shiftedArgs.shift()
  const { target, sanitizedArgs } = extractTargetJid({ m, args: shiftedArgs })
  const targetRaw = target || m.sender

  const normalizeToJid = (rawJid) => {
    if (!rawJid || typeof rawJid !== 'string') return rawJid
    if (!rawJid.endsWith('@lid')) return rawJid
    const pInfo = participants.find(p => p?.lid === rawJid)
    return pInfo?.id || rawJid
  }

  const targetJid = normalizeToJid(targetRaw)
  const groupId = m.chat
  const query = sanitizedArgs.join(' ').trim().toLowerCase()
  if (!query) {
    return conn.reply(m.chat, '✘ Debes indicar *personaje* o *all*.', m)
  }

  try {
    const [harem, characters] = await Promise.all([loadHarem(), loadCharacters()])
    const characterMap = new Map(characters.map(c => [String(c.id), c]))

    const userChars = harem.filter(c => c.groupId === groupId && isSameUserId(c.userId, targetJid))
    if (!userChars.length) return conn.reply(m.chat, '✘ Ese usuario no tiene personajes en este grupo.', m)

    const selected = ALL_PATTERN.test(query)
      ? userChars
      : userChars.filter(c => {
        const char = characterMap.get(String(c.characterId))
        return char?.name?.toLowerCase().includes(query)
      })

    if (!selected.length) return conn.reply(m.chat, '✘ No encontré ese personaje en su harem.', m)

    const now = Date.now()
    let maxExpiry = 0

    for (const char of selected) {
      const currentExpiry = Number(char?.protection?.expiresAt || 0)
      const baseTime = action === 'renew' && currentExpiry > now ? currentExpiry : now
      const newExpiry = baseTime + durationData.ms
      char.protection = {
        ...char.protection,
        protected: true,
        expiresAt: newExpiry,
        duration,
        ownerGranted: true,
        ownerAction: action,
        updatedAt: now
      }
      if (newExpiry > maxExpiry) maxExpiry = newExpiry
    }

    await saveHarem(harem)

    return conn.reply(m.chat,
      `◢✿ *PROTECCIÓN OWNER APLICADA* ✿◤\n\n` +
      `✧ Acción: *${action === 'renew' ? 'Renovación' : 'Asignación'}*\n` +
      `✧ Usuario: *@${targetJid.split('@')[0]}*\n` +
      `✧ Afectados: *${selected.length} personaje(s)*\n` +
      `✧ Duración: *${durationData.label}*\n` +
      `✧ Vence (máximo): *${formatProtectionDate(maxExpiry)}*\n` +
      `✧ Costo: *¥0 ${m.moneda || 'Coins'}*`,
      m,
      { mentions: [targetJid] }
    )
  } catch (error) {
    console.error(error)
    return conn.reply(m.chat, `✘ Error en protección owner: ${error.message}`, m)
  }
}

handler.help = ['ownerprotection <add|renew> <duración> <personaje|all> @user']
handler.tags = ['owner', 'gacha']
handler.command = ['ownerprotection', 'oprotection', 'giveprotection']
handler.rowner = true
handler.group = true

export default handler
