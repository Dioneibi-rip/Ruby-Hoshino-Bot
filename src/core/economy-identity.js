/**
 * Capa de identidad para los plugins de economia.
 *
 * Problema que resuelve:
 * Tras la migracion a `@lid` un mismo usuario puede tener DOS filas en `users`:
 *   - la vieja, con su telefono (`5219999999999@s.whatsapp.net`)
 *   - la nueva, con su LID (`123456789@lid`)
 * Los comandos de lectura masiva (`baltop`, `lb`, `topxp`) leian una u otra segun el
 * identificador que trajera la metadata del grupo, mostrando saldos partidos, ceros
 * o crasheando al hacer `.toLocaleString()` sobre un campo inexistente.
 *
 * Este modulo centraliza tres cosas:
 *   1. Resolver el JID canonico via `jid_aliases` / `lid-registry` (sincrono, sin I/O).
 *   2. Expandir un JID a TODAS sus variantes conocidas para poder consultarlas de golpe.
 *   3. Agregar las filas leidas por identidad canonica, sumando los campos acumulables,
 *      de modo que un usuario partido aparezca una sola vez con su saldo completo.
 */

import { getKnownLidFor, resolveAliasSync } from './lid-registry.js'
import { normalizeJid } from './identity-utils.js'

/** Campos que se SUMAN al unificar dos filas del mismo usuario. */
const SUMMED_FIELDS = new Set(['coin', 'coins', 'bank', 'exp', 'msg_count', 'messages'])
/** Campos donde gana el valor mas alto (progreso, no acumulacion). */
const MAX_FIELDS = new Set(['level', 'role', 'lastclaim', 'health', 'stamina'])

/**
 * JID canonico de un usuario para la base de datos.
 * Si el LID no tiene alias conocido devuelve el `@lid` intacto: es una identidad valida
 * y NUNCA se debe inventar un telefono a partir de sus digitos.
 */
export function canonicalEconomyJid(jid) {
  const normalized = normalizeJid(jid)
  if (!normalized) return ''
  return resolveAliasSync(normalized) || normalized
}

/**
 * Todas las variantes conocidas de un usuario (telefono + LID), sin duplicados.
 * Se usa para consultar la DB una sola vez y no perder la fila que quedo con la
 * identidad "vieja".
 */
export function identityVariants(jid) {
  const normalized = normalizeJid(jid)
  if (!normalized) return []
  const canonical = resolveAliasSync(normalized) || normalized
  const variants = new Set([normalized, canonical])
  const knownLid = getKnownLidFor(canonical)
  if (knownLid) variants.add(knownLid)
  return [...variants].filter(Boolean)
}

/**
 * Ids canonicos de los participantes de un grupo + todas sus variantes para consultar.
 *
 * Devuelve `{ lookupIds, canonicalById }`:
 *   - `lookupIds`: lista plana y deduplicada para el `WHERE id IN (...)`
 *   - `canonicalById`: mapa variante -> canonico, para colapsar las filas al agregar
 */
export function buildParticipantIdentityIndex(participants = []) {
  const lookupIds = new Set()
  const canonicalById = new Map()
  for (const participant of Array.isArray(participants) ? participants : []) {
    // Un participante puede exponer su identidad en cualquiera de estos campos segun
    // la version de Baileys y si el grupo tiene numeros ocultos.
    const raw = [participant?.id, participant?.jid, participant?.lid, participant?.phoneNumber]
    const canonical = raw.map(canonicalEconomyJid).find(Boolean)
    if (!canonical) continue
    for (const candidate of raw) {
      for (const variant of identityVariants(candidate)) {
        lookupIds.add(variant)
        canonicalById.set(variant, canonical)
      }
    }
    lookupIds.add(canonical)
    canonicalById.set(canonical, canonical)
  }
  return { lookupIds: [...lookupIds], canonicalById }
}

function combineRows(target, row) {
  for (const [key, value] of Object.entries(row || {})) {
    if (key === 'id') continue
    const numeric = Number(value)
    if (SUMMED_FIELDS.has(key)) {
      target[key] = (Number(target[key]) || 0) + (Number.isFinite(numeric) ? numeric : 0)
      continue
    }
    if (MAX_FIELDS.has(key)) {
      target[key] = Math.max(Number(target[key]) || 0, Number.isFinite(numeric) ? numeric : 0)
      continue
    }
    if (target[key] == null || target[key] === '') target[key] = value
  }
  return target
}

/**
 * Colapsa las filas devueltas por la DB en una fila por identidad canonica.
 *
 * @param {Array<object>} rows filas crudas de `users`
 * @param {Map<string,string>} canonicalById mapa variante -> canonico (opcional)
 * @returns {Array<object>} filas unificadas, con `coin`/`bank`/`exp` ya sumados
 */
export function aggregateEconomyRows(rows = [], canonicalById = null) {
  const merged = new Map()
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row?.id) continue
    const canonical = canonicalById?.get(row.id) || canonicalEconomyJid(row.id) || row.id
    const current = merged.get(canonical)
    if (current) combineRows(current, row)
    else merged.set(canonical, combineRows({ id: canonical }, row))
  }
  return [...merged.values()]
}

/**
 * Lectura unificada del saldo de un usuario.
 *
 * Devuelve el objeto de usuario canonico ya con `coin`/`bank`/`total` sumados incluso si
 * el registro esta partido entre su telefono y su `@lid`. Si detecta la particion,
 * dispara la fusion definitiva en la DB para que la siguiente lectura sea directa.
 */
export function readUnifiedUser(jid, { merge = true } = {}) {
  const db = global.db
  const canonical = canonicalEconomyJid(jid)
  if (!canonical || !db?.getUser) return { id: canonical, coin: 0, bank: 0, total: 0 }
  const variants = identityVariants(canonical).filter(variant => variant !== canonical)
  // Fusionamos las variantes hacia el canonico: deja la DB consistente y evita
  // volver a pagar el coste de la union en cada lectura.
  if (merge && typeof db.mergeUserRows === 'function') {
    for (const variant of variants) {
      if (!db.userExists?.(variant)) continue
      try {
        db.mergeUserRows(variant, canonical)
      } catch (error) {
        console.error('[economy-identity] no se pudo fusionar', variant, '->', canonical, error?.message || error)
      }
    }
  }
  const user = db.getUser(canonical) || {}
  const coin = Number(user.coin ?? user.coins ?? 0) || 0
  const bank = Number(user.bank || 0) || 0
  return { user, id: canonical, coin, bank, total: coin + bank }
}

/**
 * Consulta un ranking sobre un conjunto de participantes ya unificado.
 *
 * @returns {Array<object>} filas ordenadas por `totalWealth` (coin + bank) o por `field`
 */
export function rankParticipants(participants = [], { field = 'coin', useTotalWealth = true } = {}) {
  const db = global.db
  const { lookupIds, canonicalById } = buildParticipantIdentityIndex(participants)
  if (!lookupIds.length || typeof db?.topUsersByIds !== 'function') return []
  let rows = []
  try {
    rows = db.topUsersByIds(lookupIds, { field }) || []
  } catch (error) {
    console.error('[economy-identity] fallo la consulta de ranking:', error?.message || error)
    return []
  }
  const unified = aggregateEconomyRows(rows, canonicalById).map(row => {
    const coin = Number(row.coin || 0) || 0
    const bank = Number(row.bank || 0) || 0
    return { ...row, coin, bank, exp: Number(row.exp || 0) || 0, level: Number(row.level || 0) || 0, totalWealth: coin + bank }
  })
  const sortKey = useTotalWealth ? 'totalWealth' : field
  return unified.sort((a, b) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0) || String(a.id).localeCompare(String(b.id)))
}
