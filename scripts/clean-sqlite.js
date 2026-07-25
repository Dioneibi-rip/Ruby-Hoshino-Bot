#!/usr/bin/env node
import { rm, stat } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const sqliteRoot = path.join(projectRoot, 'node_modules', 'better-sqlite3')

const targets = [
  'build/Release/obj',
  'build/Release/obj.target',
  'build/Release/.deps',
  'build/Release/sqlite3.a'
]

async function exists(target) {
  try {
    await stat(target)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

async function removeTarget(relativePath) {
  const absolutePath = path.join(sqliteRoot, relativePath)
  if (!absolutePath.startsWith(sqliteRoot + path.sep)) {
    throw new Error(`Ruta de limpieza rechazada: ${absolutePath}`)
  }
  if (!(await exists(absolutePath))) return { relativePath, removed: false }
  await rm(absolutePath, { recursive: true, force: true })
  return { relativePath, removed: true }
}

async function main() {
  if (!(await exists(sqliteRoot))) {
    console.log('[clean-sqlite] better-sqlite3 no está instalado; nada que limpiar.')
    return
  }

  const results = await Promise.all(targets.map(removeTarget))
  const removed = results.filter(result => result.removed).map(result => result.relativePath)
  if (!removed.length) {
    console.log('[clean-sqlite] No se encontraron residuos de compilación de better-sqlite3.')
    return
  }
  console.log(`[clean-sqlite] Residuos eliminados de better-sqlite3: ${removed.join(', ')}`)
}

main().catch(error => {
  console.error('[clean-sqlite] Error limpiando better-sqlite3:', error)
  process.exitCode = 1
})
