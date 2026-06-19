// Sistema de caché centralizado y optimizado para gacha
import { loadCharacters } from './gacha-characters.js'
import { loadHarem, loadVentas } from './gacha-group.js'

const CACHE_CONFIG = {
  characters: { ttl: 15000, maxSize: 10 },    // 15s para characters
  harem: { ttl: 8000, maxSize: 5 },           // 8s para harem
  ventas: { ttl: 10000, maxSize: 3 }          // 10s para ventas
}

const cacheStore = new Map()
const loadingPromises = new Map()  // Evita múltiples lecturas simultáneas

class CacheEntry {
  constructor(data, ttl) {
    this.data = data
    this.createdAt = Date.now()
    this.ttl = ttl
  }

  isExpired() {
    return Date.now() - this.createdAt > this.ttl
  }
}

/**
 * Obtiene datos del caché o realiza la carga
 * Previene múltiples lecturas simultáneas del mismo archivo
 */
async function getOrLoad(key, filePath, parser) {
  // Validar caché existente
  if (cacheStore.has(key)) {
    const cached = cacheStore.get(key)
    if (!cached.isExpired()) {
      return cached.data
    }
    cacheStore.delete(key)
  }

  // Evitar lecturas simultáneas del mismo archivo
  if (loadingPromises.has(key)) {
    return loadingPromises.get(key)
  }

  // Crear promesa de carga
  const loadPromise = (async () => {
    try {
      const data = await parser(filePath)
      const config = CACHE_CONFIG[key.split(':')[0]] || { ttl: 10000 }
      cacheStore.set(key, new CacheEntry(data, config.ttl))
      return data
    } finally {
      loadingPromises.delete(key)
    }
  })()

  loadingPromises.set(key, loadPromise)
  return loadPromise
}

/**
 * Carga characters SQLite con caché
 */
export async function loadCharactersOptimized() {
  return getOrLoad('characters:main', 'sqlite:characters', loadCharacters)
}

/**
 * Carga harem SQLite con caché
 */
export async function loadHaremOptimized() {
  return getOrLoad('harem:main', 'sqlite:harem', loadHarem)
}

/**
 * Carga ventas SQLite con caché
 */
export async function loadVentasOptimized() {
  return getOrLoad('ventas:main', 'sqlite:waifus_venta', loadVentas)
}

/**
 * Invalida caché manualmente después de escrituras
 */
export function invalidateCache(type) {
  const typeMap = {
    'characters': 'characters:main',
    'harem': 'harem:main',
    'ventas': 'ventas:main',
    'all': null
  }

  if (typeMap[type] === null) {
    cacheStore.clear()
    loadingPromises.clear()
  } else if (typeMap[type]) {
    cacheStore.delete(typeMap[type])
  }
}

/**
 * Obtiene estadísticas del caché
 */
export function getCacheStats() {
  const stats = {}
  for (const [key, entry] of cacheStore.entries()) {
    stats[key] = {
      size: JSON.stringify(entry.data).length,
      age: Date.now() - entry.createdAt,
      expired: entry.isExpired()
    }
  }
  return stats
}

export { invalidateCache as clearCache }
