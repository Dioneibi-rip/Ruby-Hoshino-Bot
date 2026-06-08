// Sistema de caché centralizado y optimizado para gacha
import { promises as fs } from 'fs'

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
 * Parsea JSON de forma segura
 */
async function parseJSON(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.error(`[CacheManager] Error leyendo ${filePath}:`, error.message)
    }
    return []
  }
}

/**
 * Carga characters.json con caché
 */
export async function loadCharactersOptimized() {
  return getOrLoad(
    'characters:main',
    './src/database/characters.json',
    parseJSON
  )
}

/**
 * Carga harem.json con caché
 */
export async function loadHaremOptimized() {
  return getOrLoad(
    'harem:main',
    './src/database/harem.json',
    parseJSON
  )
}

/**
 * Carga ventas.json con caché
 */
export async function loadVentasOptimized() {
  return getOrLoad(
    'ventas:main',
    './src/database/waifusVenta.json',
    parseJSON
  )
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
