/**
 * Registro de alias LID <-> PN (numero de telefono clasico).
 *
 * Existe para resolver un choque de disenio:
 *   - `normalizeJid()` es SINCRONA y esta incrustada en toda la capa de base de datos.
 *   - La resolucion LID->PN de Baileys (`signalRepository.lidMapping`) es ASINCRONA.
 *
 * La resolucion async ocurre una sola vez en el pipeline de mensajes y su resultado
 * se persiste aqui. A partir de ese momento `normalizeJid()` puede resolver el mismo
 * LID de forma sincrona leyendo el Map en memoria.
 *
 * Este modulo NO importa la capa de base de datos: la persistencia se inyecta con
 * `attachStore()` para evitar dependencias circulares.
 */

const PN_SERVERS = new Set(['s.whatsapp.net'])
const LID_SERVERS = new Set(['lid', 'hosted.lid'])

/** lid -> pn */
const lidToPn = new Map()
/** pn -> lid */
const pnToLid = new Map()
/** pares ya fusionados en la DB, para no reintentar la fusion en cada mensaje */
const mergedPairs = new Set()

let store = null
let hydrated = false

/**
 * Limpieza minima y sincrona de un JID: minusculas, sin sufijo de device (`:12`)
 * y con `c.us` traducido a `s.whatsapp.net`.
 * Deliberadamente NO usa `normalizeJid` de identity-utils para evitar recursion.
 */
function canonicalKey(jid) {
  if (!jid || typeof jid !== 'string') return ''
  const lower = jid.trim().toLowerCase()
  if (!lower) return ''
  const match = lower.match(/^([^@]+)@([^@]+)$/)
  if (!match) return ''
  const user = match[1].replace(/:\d+$/, '')
  let server = match[2]
  if (server === 'c.us') server = 's.whatsapp.net'
  if (!user) return ''
  return `${user}@${server}`
}

function serverOf(jid) {
  const idx = jid.indexOf('@')
  return idx === -1 ? '' : jid.slice(idx + 1)
}

export function isLidJid(jid) {
  const key = canonicalKey(jid)
  return !!key && LID_SERVERS.has(serverOf(key))
}

export function isPhoneJid(jid) {
  const key = canonicalKey(jid)
  return !!key && PN_SERVERS.has(serverOf(key))
}

/**
 * Conecta la persistencia (la implementa sqlite-database).
 * @param {{ load: () => Array<{lid:string,pn:string,merged_at:number}>, save: (lid:string,pn:string)=>void, merge: (fromId:string,toId:string)=>void, markMerged: (lid:string)=>void }} adapter
 */
export function attachStore(adapter) {
  store = adapter || null
  hydrated = false
  hydrate()
}

/** Carga los alias ya conocidos desde la tabla `jid_aliases`. */
export function hydrate() {
  if (hydrated || !store?.load) return
  hydrated = true
  let rows = []
  try {
    rows = store.load() || []
  } catch (error) {
    console.error('[v0][lid-registry] fallo al hidratar alias:', error?.message || error)
    return
  }
  for (const row of rows) {
    const lid = canonicalKey(row?.lid)
    const pn = canonicalKey(row?.pn)
    if (!lid || !pn) continue
    if (!LID_SERVERS.has(serverOf(lid)) || !PN_SERVERS.has(serverOf(pn))) continue
    lidToPn.set(lid, pn)
    if (!pnToLid.has(pn)) pnToLid.set(pn, lid)
    if (row?.merged_at) mergedPairs.add(`${lid}|${pn}`)
  }
}

/**
 * Devuelve el PN canonico de un LID conocido, o `null` si aun no hay mapeo.
 * NUNCA inventa un numero: si el LID es desconocido, quien llama debe conservar
 * el `@lid` tal cual.
 */
export function resolveAliasSync(jid) {
  const key = canonicalKey(jid)
  if (!key) return null
  if (PN_SERVERS.has(serverOf(key))) return key
  if (!LID_SERVERS.has(serverOf(key))) return null
  hydrate()
  return lidToPn.get(key) || null
}

/** Devuelve el LID conocido de un telefono, util para enviar/comparar participantes. */
export function getKnownLidFor(jid) {
  const key = canonicalKey(jid)
  if (!key) return null
  hydrate()
  return pnToLid.get(key) || null
}

/**
 * Registra un mapeo LID -> PN, lo persiste y dispara (una unica vez por par)
 * la fusion de las filas duplicadas que el bug anterior pudo dejar en la DB.
 * @returns {string|null} el PN canonico, o `null` si el par era invalido
 */
export function rememberMapping(lid, pn) {
  const lidKey = canonicalKey(lid)
  const pnKey = canonicalKey(pn)
  if (!lidKey || !pnKey) return null

  // Guardas de seguridad: solo aceptamos LID real -> telefono real.
  // Sin esto volveriamos a contaminar la DB con identidades inventadas.
  if (!LID_SERVERS.has(serverOf(lidKey))) return null
  if (!PN_SERVERS.has(serverOf(pnKey))) return null
  if (!/^\d{7,15}$/.test(pnKey.split('@')[0])) return null

  const previous = lidToPn.get(lidKey)
  lidToPn.set(lidKey, pnKey)
  pnToLid.set(pnKey, lidKey)

  if (previous !== pnKey) {
    try {
      store?.save?.(lidKey, pnKey)
    } catch (error) {
      console.error('[v0][lid-registry] fallo al persistir alias:', error?.message || error)
    }
  }

  const pairKey = `${lidKey}|${pnKey}`
  if (!mergedPairs.has(pairKey)) {
    mergedPairs.add(pairKey)
    // El LID pudo haber creado una fila basura con el bug viejo
    // (`<digitos-del-lid>@s.whatsapp.net`) y/o una fila legitima con `@lid`.
    // Fusionamos ambas variantes hacia el telefono canonico.
    const ghosts = [lidKey, `${lidKey.split('@')[0]}@s.whatsapp.net`]
    for (const ghost of ghosts) {
      if (ghost === pnKey) continue
      try {
        store?.merge?.(ghost, pnKey)
      } catch (error) {
        console.error('[v0][lid-registry] fallo al fusionar', ghost, '->', pnKey, error?.message || error)
      }
    }
    try {
      store?.markMerged?.(lidKey)
    } catch {}
  }

  return pnKey
}

/** Estadisticas simples para comandos de diagnostico. */
export function getRegistryStats() {
  hydrate()
  return { aliases: lidToPn.size, merged: mergedPairs.size, persisted: !!store }
}

export const lidRegistry = {
  attachStore,
  hydrate,
  resolveAliasSync,
  rememberMapping,
  getKnownLidFor,
  getRegistryStats,
  isLidJid,
  isPhoneJid,
}

global.lidRegistry = lidRegistry
