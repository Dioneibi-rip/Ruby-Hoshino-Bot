import { loadHarem, saveHarem, isSameUserId } from '../../lib/gacha-group.js'
import { loadCharacters } from '../../lib/gacha-characters.js'
import { normalizeProtectionDuration, formatProtectionDate, applyProtection, getProtectionRenewalPlan, MAX_PROTECTION_DAYS } from '../../lib/gacha-protection.js'

const ALL_PATTERN = /^(all|todos|todo)$/i

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

function dedupeByCharacterId(list = []) {
const seen = new Set()
return list.filter(item => {
const key = String(item?.characterId || '')
if (!key || seen.has(key)) return false
seen.add(key)
return true
})
}

let handler = async (m, { conn, args, participants, usedPrefix, command }) => {
if (!m.isGroup) return conn.reply(m.chat, '✘ Este comando funciona en grupos.', m)
const prefix = usedPrefix || '#'
if (!args.length) return conn.reply(m.chat, `◢✿ *OWNER PROTECCIÓN* ✿◤\n\n✧ Uso:\n*${prefix + command} <add|renew> <días> <personaje|all> @usuario*\n\n✧ Límite máximo: *${MAX_PROTECTION_DAYS} días*\n✧ Si no mencionas usuario, se aplica a ti.\n\n✦ Ejemplos:\n- *${prefix + command} add 7 all @user*\n- *${prefix + command} renew 15d miku @user*\n- *${prefix + command} add 30 all*`, m)
let action = normalizeAction(args[0])
let shiftedArgs = [...args]
if (action) shiftedArgs.shift()
else action = 'add'
const durationData = normalizeProtectionDuration(shiftedArgs[0])
if (!durationData) return conn.reply(m.chat, `✘ Duración no válida. Elige entre *1* y *${MAX_PROTECTION_DAYS}* días.`, m)
shiftedArgs.shift()
const { target, sanitizedArgs } = extractTargetJid({ m, args: shiftedArgs })
const targetRaw = target || m.sender
const normalizeToJid = rawJid => {
if (!rawJid || typeof rawJid !== 'string') return rawJid
if (!rawJid.endsWith('@lid')) return rawJid
const pInfo = participants.find(p => p?.lid === rawJid)
return pInfo?.id || rawJid
}
const targetJid = normalizeToJid(targetRaw)
const groupId = m.chat
const query = sanitizedArgs.join(' ').trim().toLowerCase()
if (!query) return conn.reply(m.chat, '✘ Debes indicar *personaje* o *all*.', m)
try {
const [harem, characters] = await Promise.all([loadHarem(), loadCharacters()])
const characterMap = new Map(characters.map(c => [String(c.id), c]))
const userChars = dedupeByCharacterId(harem.filter(c => c?.groupId === groupId && isSameUserId(c?.userId, targetJid)))
if (!userChars.length) return conn.reply(m.chat, '✘ Ese usuario no tiene personajes en este grupo.', m)
const selected = ALL_PATTERN.test(query) ? userChars : dedupeByCharacterId(userChars.filter(c => {
const char = characterMap.get(String(c.characterId))
return char?.name?.toLowerCase().includes(query)
}))
if (!selected.length) return conn.reply(m.chat, '✘ No encontré ese personaje en su harem.', m)
const now = Date.now()
let maxExpiry = 0
let affected = 0
let cappedCount = 0
for (const char of selected) {
let effectiveData = durationData
if (action === 'renew') {
const plan = getProtectionRenewalPlan(char, durationData, now)
if (plan.effectiveDays <= 0) continue
if (plan.capped) cappedCount++
effectiveData = { ...durationData, days: plan.effectiveDays, ms: plan.effectiveMs }
}
const plan = applyProtection(char, effectiveData, { now, mode: action === 'renew' ? 'renew' : 'purchase', extra: { ownerGranted: true, ownerAction: action } })
if (!plan) continue
affected++
if (plan.expiresAt > maxExpiry) maxExpiry = plan.expiresAt
}
if (!affected) return conn.reply(m.chat, `◢✿ *LÍMITE ALCANZADO* ✿◤\n\n✧ No se aplicaron cambios porque la protección ya llegó a *${MAX_PROTECTION_DAYS} días*.`, m)
await saveHarem(harem)
return conn.reply(m.chat, `◢✿ *PROTECCIÓN OWNER APLICADA* ✿◤\n\n✧ Acción: *${action === 'renew' ? 'Renovación' : 'Asignación'}*\n✧ Usuario: *@${targetJid.split('@')[0]}*\n✧ Afectados: *${affected} personaje(s)*\n✧ Duración solicitada: *${durationData.label}*\n✧ Vence (máximo): *${formatProtectionDate(maxExpiry)}*\n✧ Límite activo: *${MAX_PROTECTION_DAYS} días máximo*\n✧ Costo: *¥0 ${m.moneda || 'Coins'}*${cappedCount ? `\n\n⚠️ Ajustados al límite: *${cappedCount}*` : ''}`, m, { mentions: [targetJid] })
} catch (error) {
console.error(error)
return conn.reply(m.chat, `✘ Error en protección owner: ${error.message}`, m)
}
}

handler.help = ['ownerprotection <add|renew> <días> <personaje|all> @user']
handler.tags = ['owner', 'gacha']
handler.command = ['ownerprotection', 'oprotection', 'giveprotection']
handler.rowner = true
handler.group = true

export default handler
