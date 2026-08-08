import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { resolveAliasSync, rememberMapping } from './lid-registry.js'

const LID_SERVERS = new Set(['lid', 'hosted.lid'])

/**
 * Normaliza un JID de forma SINCRONA al identificador canonico usado en la base de datos.
 *
 * Reglas:
 *  - `@c.us` se traduce a `@s.whatsapp.net`.
 *  - El sufijo de device (`:12`) se descarta siempre.
 *  - Un `@lid` se traduce a telefono SOLO si el registro de alias ya conoce el mapeo.
 *    Si no lo conoce, se devuelve el `@lid` INTACTO.
 *
 * Importante: nunca se convierte el numero interno de un LID en un `@s.whatsapp.net`.
 * Un LID no es un telefono; hacerlo generaba usuarios fantasma en la base de datos.
 */
export function normalizeJid(jid) {
if (!jid || typeof jid !== 'string') return ''
const raw = String(jid).trim()
if (!raw) return ''
const normalizedByBaileys = jidNormalizedUser(raw) || raw
const lower = String(normalizedByBaileys).trim().toLowerCase()
const match = lower.match(/^([^@]+)@([^@]+)$/)
if (!match) return lower.replace(/:\d+(?=@|$)/, '')
const user = match[1].replace(/:\d+$/, '')
let server = match[2]
if (server === 'c.us') server = 's.whatsapp.net'
if (LID_SERVERS.has(server)) {
const mapped = resolveAliasSync(`${user}@${server}`)
// Sin mapeo conocido conservamos el `@lid` real: es una identidad valida y estable.
return mapped || `${user}@${server}`
}
if (server === 's.whatsapp.net') {
const digits = user.replace(/\D/g, '')
return digits ? `${digits}@s.whatsapp.net` : `${user}@${server}`
}
return `${user}@${server}`
}

global.normalizeJid = normalizeJid

/**
 * Prepara un numero para `requestPairingCode()`.
 *
 * Baileys exige digitos puros en formato internacional SIN `+`. Cualquier basura
 * (espacios, guiones, parentesis, sufijo `@s.whatsapp.net`, prefijo `00`, un `+`
 * suelto, un sufijo de device `:12`) provoca un pairing code invalido, un 400
 * opaco del servidor o —peor— un codigo valido que NUNCA dispara la notificacion
 * push en el telefono porque el numero no coincide con ninguna cuenta.
 *
 * Reglas aplicadas (en orden):
 *  - Se descarta todo lo que venga despues de `@` (por si llega un JID completo).
 *  - Se descarta el sufijo de device (`:12`) antes de limpiar digitos, para no
 *    concatenarlo al numero real.
 *  - Se eliminan todos los caracteres que no sean digitos.
 *  - Se quita el prefijo de marcacion internacional `00` (00521... -> 521...).
 *  - Se quitan TODOS los ceros troncales iniciales: E.164 nunca empieza con `0`.
 *  - Se valida la longitud E.164 (7 a 15 digitos).
 *
 * El resultado es SIEMPRE una cadena de solo digitos, sin `+` y sin ceros
 * iniciales: exactamente lo que el servidor de Meta necesita para emparejar el
 * codigo con la cuenta y emitir el push.
 *
 * @returns {string} digitos listos para Baileys, o `''` si el numero no es usable
 */
export function sanitizePairingNumber(value = '') {
const raw = String(Array.isArray(value) ? value[0] : value ?? '').trim()
if (!raw) return ''
// El sufijo de device se corta ANTES del filtro de digitos: `5219999:12` no debe
// convertirse en `521999912`.
let digits = raw.split('@')[0].split(':')[0].replace(/\D/g, '')
if (!digits) return ''
// `00` es prefijo de salida internacional, no parte del numero.
if (digits.startsWith('00')) digits = digits.slice(2)
// Un `0` troncal inicial tampoco pertenece al formato E.164 (nunca, sin importar
// la longitud: la condicion anterior `length > 11` dejaba pasar `0999999999`).
digits = digits.replace(/^0+/, '')
if (!/^\d{7,15}$/.test(digits)) return ''
return digits
}

global.sanitizePairingNumber = sanitizePairingNumber

/**
 * Version ASINCRONA: puede preguntarle a Baileys por el mapeo LID->PN.
 * Cada resolucion exitosa se guarda en el registro de alias, de modo que
 * `normalizeJid()` (sincrona) pueda resolver ese mismo LID a partir de entonces.
 */
export async function normalizeIdentityJid(conn, jid, participantsByLid = null) {
if (!jid || typeof jid !== 'string') return ''
let normalized = jidNormalizedUser(jid) || jid
if (normalized.endsWith('@lid') || normalized.endsWith('@hosted.lid')) {
const lidKey = normalized
// 1) Alias ya conocido: resolucion inmediata, sin I/O.
const cached = resolveAliasSync(lidKey)
if (cached) return cached
const participant = participantsByLid?.get?.(normalized) || participantsByLid?.get?.(jid)
if (participant?.jid) normalized = jidNormalizedUser(participant.jid) || participant.jid
else {
// 2) Preguntar al mapeo LID/PN de Baileys.
const mapped = await conn?.signalRepository?.lidMapping?.getPNForLID?.(normalized).catch(() => null)
if (mapped) normalized = jidNormalizedUser(mapped) || mapped
}
// 3) Aprender el mapeo para futuras resoluciones sincronas.
if (normalized && normalized !== lidKey) rememberMapping(lidKey, normalized)
}
return normalized
}


export async function resolveIdentityJids(conn, jids = [], participantsByLid = null) {
const list = Array.isArray(jids) ? jids : []
const out = []
for (const jid of list) {
const normalized = await normalizeIdentityJid(conn, jid, participantsByLid)
if (normalized) out.push(normalized)
}
return [...new Set(out)]
}

global.resolveIdentityJids = resolveIdentityJids

export async function resolveInteractionTarget(m, conn = null, options = {}) {
const { participantsByLid = null } = options
const rawTarget = Array.isArray(m?.mentionedJid) && m.mentionedJid[0]
? m.mentionedJid[0]
: m?.quoted?.sender || m?.quoted?.participant || m?.quoted?.key?.participant || m?.sender || ''
const jid = await normalizeIdentityJid(conn, rawTarget, participantsByLid)
return jid || rawTarget
}

export async function resolveTarget(m, conn = null, options = {}) {
const { participantsByLid = null, errorMessage = 'Debes mencionar o responder al mensaje del usuario. 🧐' } = options
const rawTarget = Array.isArray(m?.mentionedJid) && m.mentionedJid[0]
? m.mentionedJid[0]
: m?.quoted?.sender || m?.quoted?.participant || m?.quoted?.key?.participant || ''
if (!rawTarget) {
if (errorMessage && typeof m?.reply === 'function') await m.reply(errorMessage)
return null
}
const jid = await normalizeIdentityJid(conn, rawTarget, participantsByLid)
return jid || rawTarget
}

global.resolveTarget = resolveTarget
global.resolveInteractionTarget = resolveInteractionTarget


export async function resolveIdentityName(conn, jid, options = {}) {
const { participantsByLid = null, fallback = 'Usuario' } = options
const normalized = await normalizeIdentityJid(conn, jid, participantsByLid)
const identityJid = normalized || jid || ''
if (!identityJid) return fallback
try {
const name = await conn?.getName?.(identityJid)
if (typeof name === 'string' && name.trim()) return name.trim()
} catch {}
return fallback || `@${String(identityJid).split('@')[0]}`
}

export function buildParticipantsByLid(participants = []) {
const map = new Map()
for (const participant of participants || []) {
if (participant?.lid) map.set(participant.lid, participant)
if (participant?.id) map.set(participant.id, participant)
if (participant?.jid) map.set(participant.jid, participant)
}
return map
}

global.resolveIdentityName = resolveIdentityName
global.buildParticipantsByLid = buildParticipantsByLid
