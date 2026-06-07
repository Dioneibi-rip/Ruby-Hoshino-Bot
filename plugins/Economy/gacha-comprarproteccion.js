import { loadHarem, saveHarem, isSameUserId } from '../../lib/gacha-group.js'
import { loadCharacters } from '../../lib/gacha-characters.js'
import {
  PROTECTION_DURATIONS,
  isProtectionActive,
  formatProtectionDate,
  getUserFunds,
  spendUserFunds
} from '../../lib/gacha-protection.js'

const ALL_PATTERN = /^(all|todos|todo)$/i
const COMMAND_PROTECTION_PRICES = {
  '3d': 5000,
  '7d': 9000,
  '15d': 16000,
  '30d': 28000
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
      `◢✿ *PROTECCIÓN DE HAREM* ✿◤\n\n` +
      `✧ Uso: *#comprarproteccion <duración> <personaje|all>*\n` +
      `✧ Duraciones: *3d | 7d | 15d | 30d*\n\n` +
      `✦ Ejemplos:\n` +
      `- #comprarproteccion 7d all\n` +
      `- #comprarproteccion 15d miku`, m)
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
    let selected = byAll
      ? userChars
      : dedupeByCharacterId(userChars.filter(c => {
        const char = characterMap.get(String(c.characterId))
        return char?.name?.toLowerCase().includes(target)
      }))

    if (!selected.length) return conn.reply(m.chat, '✘ No encontré ese personaje en tu harem.', m)

    const alreadyProtected = selected.filter(isProtectionActive)
    selected = selected.filter(c => !isProtectionActive(c))

    if (!selected.length) {
      return conn.reply(m.chat,
        `✘ Todos los personajes seleccionados ya tienen protección activa.\n` +
        `Usa *#renovarproteccion* para extenderla.`, m)
    }

    const quantity = selected.length
    const { total: totalCost, unitPrice } = calculateStableCost({ duration, quantity })
    const funds = getUserFunds(user)

    if (funds.total < totalCost) {
      return conn.reply(m.chat,
        `◢✿ *SALDO INSUFICIENTE* ✿◤\n\n` +
        `✧ Necesitas: *¥${totalCost.toLocaleString()} ${moneda}*\n` +
        `✧ Cálculo: *${quantity}* x *¥${unitPrice.toLocaleString()}* (${duration})\n` +
        `✧ Cartera: *¥${funds.coin.toLocaleString()} ${moneda}*\n` +
        `✧ Banco: *¥${funds.bank.toLocaleString()} ${moneda}*\n` +
        `✧ Total: *¥${funds.total.toLocaleString()} ${moneda}*`, m)
    }

    const expiresAt = Date.now() + durationData.ms
    for (const char of selected) {
      char.protection = {
        protected: true,
        expiresAt,
        duration,
        purchasedAt: Date.now()
      }
    }

    const paid = spendUserFunds(user, totalCost)
    await saveHarem(harem)

    return conn.reply(m.chat,
      `◢✿ *PROTECCIÓN ACTIVADA* ✿◤\n\n` +
      `✧ Protegidos: *${selected.length} personaje(s)*\n` +
      `✧ Duración: *${durationData.label}*\n` +
      `✧ Expira: *${formatProtectionDate(expiresAt)}*\n` +
      `✧ Costo: *¥${totalCost.toLocaleString()} ${moneda}*\n` +
      `✧ Cálculo: *${quantity}* x *¥${unitPrice.toLocaleString()}* (${duration})\n` +
      `✧ Cobro: banco *¥${(paid?.fromBank || 0).toLocaleString()}* + cartera *¥${(paid?.fromCoin || 0).toLocaleString()}*\n` +
      `✧ Cartera: *¥${(user.coin || 0).toLocaleString()} ${moneda}*\n` +
      `✧ Banco: *¥${(user.bank || 0).toLocaleString()} ${moneda}*` +
      `${alreadyProtected.length ? `\n\n⚠️ Ya protegidos (sin cobro): *${alreadyProtected.length}*` : ''}`,
      m)
  } catch (error) {
    console.error(error)
    return conn.reply(m.chat, `✘ Error al comprar protección: ${error.message}`, m)
  }
}

handler.help = ['comprarproteccion <duración> <personaje|all>']
handler.tags = ['gacha', 'economia']
handler.command = ['comprarproteccion', 'buyprotection', 'proteger']
handler.group = true
handler.register = true

export default handler
