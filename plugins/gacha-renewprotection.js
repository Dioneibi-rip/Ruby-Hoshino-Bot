import { loadHarem, saveHarem, isSameUserId } from '../lib/gacha-group.js'
import { loadCharacters } from '../lib/gacha-characters.js'
import {
  PROTECTION_DURATIONS,
  formatProtectionDate,
  isProtectionActive,
  getUserFunds,
  spendUserFunds
} from '../lib/gacha-protection.js'

const ALL_PATTERN = /^(all|todos|todo)$/i
const COMMAND_PROTECTION_PRICES = {
  '3d': 5_000,
  '7d': 9_000,
  '15d': 16_000,
  '30d': 28_000
}

function getUnitProtectionPrice(duration = '3d') {
  return COMMAND_PROTECTION_PRICES[duration] || COMMAND_PROTECTION_PRICES['3d']
}

function calculateStableCost({ duration = '3d', quantity = 1 }) {
  const safeQuantity = Math.max(1, Number(quantity) || 1)
  const unitPrice = getUnitProtectionPrice(duration)
  let total = unitPrice * safeQuantity
  if (safeQuantity >= 5) total = Math.ceil(total * 0.92)
  if (safeQuantity >= 12) total = Math.ceil(total * 0.88)
  return { total, unitPrice, safeQuantity }
}

function dedupeByCharacterId(list = []) {
  const seen = new Set()
  return list.filter(item => {
    const key = String(item?.characterId)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

let handler = async (m, { conn, args }) => {
  const userId = m.sender
  const groupId = m.chat
  const user = global.db.data.users[userId]
  const moneda = m.moneda || 'Coins'

  if (!user) return conn.reply(m.chat, '✘ Usuario no registrado.', m)

  if (args.length < 2) {
    return conn.reply(m.chat,
      `◢✿ *RENOVAR PROTECCIÓN* ✿◤\n\n` +
      `✧ Uso: *#renovarproteccion <duración> <personaje|all>*\n` +
      `✧ Duraciones: *3d | 7d | 15d | 30d*`, m)
  }

  const duration = String(args[0] || '').toLowerCase()
  const target = args.slice(1).join(' ').trim().toLowerCase()
  const durationData = PROTECTION_DURATIONS[duration]

  if (!durationData) {
    return conn.reply(m.chat, '✘ Duración no válida. Usa: *3d, 7d, 15d o 30d*.', m)
  }

  try {
    const [harem, characters] = await Promise.all([loadHarem(), loadCharacters()])
    const characterMap = new Map(characters.map(c => [String(c.id), c]))

    const userChars = dedupeByCharacterId(harem.filter(c => c.groupId === groupId && isSameUserId(c.userId, userId)))
    if (!userChars.length) return conn.reply(m.chat, '✘ No tienes personajes en este grupo.', m)

    const byAll = ALL_PATTERN.test(target)
    const selected = byAll
      ? userChars
      : dedupeByCharacterId(userChars.filter(c => {
        const char = characterMap.get(String(c.characterId))
        return char?.name?.toLowerCase().includes(target)
      }))

    if (!selected.length) return conn.reply(m.chat, '✘ No encontré ese personaje en tu harem.', m)

    const renewable = selected.filter(isProtectionActive)
    if (!renewable.length) {
      return conn.reply(m.chat,
        '✘ Los personajes elegidos no tienen protección activa para renovar.\nUsa *#comprarproteccion* primero.', m)
    }

    const quantity = renewable.length
    const { total: totalCost, unitPrice } = calculateStableCost({ duration, quantity })
    const funds = getUserFunds(user)

    if (funds.total < totalCost) {
      return conn.reply(m.chat,
        `◢✿ *SALDO INSUFICIENTE* ✿◤\n\n` +
        `✧ Renovación: *¥${totalCost.toLocaleString()} ${moneda}*\n` +
        `✧ Cálculo: *${quantity}* x *¥${unitPrice.toLocaleString()}* (${duration})\n` +
        `✧ Cartera: *¥${funds.coin.toLocaleString()} ${moneda}*\n` +
        `✧ Banco: *¥${funds.bank.toLocaleString()} ${moneda}*\n` +
        `✧ Total: *¥${funds.total.toLocaleString()} ${moneda}*`, m)
    }

    const now = Date.now()
    let maxExpiry = 0

    for (const char of renewable) {
      const currentExpiry = Number(char?.protection?.expiresAt || 0)
      const baseTime = currentExpiry > now ? currentExpiry : now
      const newExpiry = baseTime + durationData.ms
      char.protection = {
        ...char.protection,
        protected: true,
        expiresAt: newExpiry,
        duration,
        renewedAt: now
      }
      if (newExpiry > maxExpiry) maxExpiry = newExpiry
    }

    const paid = spendUserFunds(user, totalCost)
    await saveHarem(harem)

    return conn.reply(m.chat,
      `◢✿ *PROTECCIÓN RENOVADA* ✿◤\n\n` +
      `✧ Renovados: *${renewable.length} personaje(s)*\n` +
      `✧ Extensión: *${durationData.label}*\n` +
      `✧ Vencimiento más lejano: *${formatProtectionDate(maxExpiry)}*\n` +
      `✧ Costo: *¥${totalCost.toLocaleString()} ${moneda}*\n` +
      `✧ Cálculo: *${quantity}* x *¥${unitPrice.toLocaleString()}* (${duration})\n` +
      `✧ Cobro: banco *¥${(paid?.fromBank || 0).toLocaleString()}* + cartera *¥${(paid?.fromCoin || 0).toLocaleString()}*\n` +
      `✧ Cartera: *¥${(user.coin || 0).toLocaleString()} ${moneda}*\n` +
      `✧ Banco: *¥${(user.bank || 0).toLocaleString()} ${moneda}*`, m)
  } catch (error) {
    console.error(error)
    return conn.reply(m.chat, `✘ Error al renovar protección: ${error.message}`, m)
  }
}

handler.help = ['renovarproteccion <duración> <personaje|all>']
handler.tags = ['gacha', 'economia']
handler.command = ['renovarproteccion', 'renewprotection', 'extenderproteccion']
handler.group = true
handler.register = true

export default handler
