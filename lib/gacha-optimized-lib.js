// Librería de optimizaciones para gacha
// Proporciona búsquedas indexadas y operaciones en lote

/**
 * Crea un índice de búsqueda rápida para caracteres
 */
export function buildCharacterIndex(characters) {
  const indexById = new Map()
  const indexByName = new Map()
  
  for (const char of characters) {
    // Índice por ID
    if (char.id) indexById.set(String(char.id).trim(), char)
    
    // Índice por nombre normalizado
    if (char.name) {
      const normalized = char.name.toLowerCase().trim()
      if (!indexByName.has(normalized)) {
        indexByName.set(normalized, [])
      }
      indexByName.get(normalized).push(char)
    }
  }
  
  return { indexById, indexByName }
}

/**
 * Búsqueda rápida por ID usando índice
 */
export function findCharacterByIdFast(index, id) {
  return index.indexById.get(String(id).trim()) || null
}

/**
 * Construye índices para harem por grupo y usuario
 */
export function buildHaremIndex(harem) {
  const byGroupChar = new Map()    // `${groupId}:${charId}` -> entry
  const byGroupUser = new Map()    // `${groupId}:${userId}` -> [entries]
  
  for (const entry of harem) {
    const gcKey = `${entry.groupId}:${entry.characterId}`
    const guKey = `${entry.groupId}:${entry.userId}`
    
    byGroupChar.set(gcKey, entry)
    
    if (!byGroupUser.has(guKey)) {
      byGroupUser.set(guKey, [])
    }
    byGroupUser.get(guKey).push(entry)
  }
  
  return { byGroupChar, byGroupUser }
}

/**
 * Búsqueda rápida de claim sin loops
 */
export function findClaimFast(index, groupId, characterId) {
  const key = `${groupId}:${characterId}`
  return index.byGroupChar.get(key) || null
}

/**
 * Obtener claims de usuario sin loops
 */
export function getUserClaimsFast(index, groupId, userId) {
  const key = `${groupId}:${userId}`
  return index.byGroupUser.get(key) || []
}

/**
 * Calcula valor total en una sola pasada
 */
export function calculateTotalValue(claims, characterIndex) {
  let total = 0
  for (const claim of claims) {
    const char = characterIndex.indexById.get(String(claim.characterId).trim())
    total += Number(char?.value || 0)
  }
  return total
}

/**
 * Limpia cooldowns expirados (ejecutar periódicamente)
 */
export function cleanExpiredCooldowns(cooldowns) {
  const now = Date.now()
  let cleaned = 0
  
  for (const [key, expiration] of Object.entries(cooldowns)) {
    if (now > expiration) {
      delete cooldowns[key]
      cleaned++
    }
  }
  
  return cleaned
}

/**
 * Procesa operaciones en lote sin bloquear
 */
export async function batchProcess(items, batchSize, processor) {
  const results = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    )
    results.push(...batchResults)
    
    // Permite que otros procesos se ejecuten
    if (i + batchSize < items.length) {
      await new Promise(resolve => setImmediate(resolve))
    }
  }
  
  return results
}
