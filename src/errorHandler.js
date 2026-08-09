/**
 * errorHandler.js — Auto-diagnóstico de Ruby Hoshino.
 *
 * Intercepta fallos críticos (uncaughtException / unhandledRejection), guarda el
 * stack trace en un archivo de caché y, al arrancar de nuevo el proceso, lee ese
 * registro y avisa por WhatsApp al dueño del bug exacto que causó la caída.
 *
 * Diseño defensivo:
 *  - NO llama a process.exit(): deja que el gestor de procesos y los handlers de
 *    apagado ya existentes decidan. Solo persiste y (si puede) reporta.
 *  - La escritura del crash es SÍNCRONA para no perderse durante el apagado.
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs'
import path from 'path'
import { OWNER_NUMBER } from './rubyCore.js'

const CRASH_FILE = path.join(process.cwd(), '.ruby_crash.json')
const MAX_TRACE = 2500
let installed = false

const clip = (s, n = MAX_TRACE) => {
  const t = String(s ?? '')
  return t.length > n ? `${t.slice(0, n)}\n…[recortado]` : t
}

function serializeError(error) {
  if (error instanceof Error) return `${error.name}: ${error.message}\n${error.stack || ''}`
  return String(error)
}

/** Persiste el crash en caché de forma síncrona (sobrevive al apagado). */
function persistCrash(error, origin) {
  try {
    writeFileSync(
      CRASH_FILE,
      JSON.stringify({ origin, at: new Date().toISOString(), trace: clip(serializeError(error)) }, null, 2),
      'utf8'
    )
  } catch (e) {
    console.error('[Ruby][crash-persist]', e?.message)
  }
}

/**
 * Instala los interceptores de fallos críticos.
 * Solo persiste el error; no fuerza la salida del proceso.
 */
export function initCrashHandler() {
  if (installed) return
  installed = true
  process.on('uncaughtException', error => {
    console.error('[Ruby][uncaughtException]', serializeError(error))
    persistCrash(error, 'uncaughtException')
  })
  process.on('unhandledRejection', reason => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    console.error('[Ruby][unhandledRejection]', serializeError(error))
    persistCrash(error, 'unhandledRejection')
  })
  console.log('[Ruby] Crash handler de auto-diagnóstico activo.')
}

/**
 * Lee el registro de crash pendiente (si existe) y avisa al dueño por WhatsApp.
 * Debe llamarse una vez que la conexión esté abierta.
 */
export async function flushPendingCrash(conn) {
  try {
    if (!existsSync(CRASH_FILE) || !conn?.sendMessage) return false
    let payload
    try {
      payload = JSON.parse(readFileSync(CRASH_FILE, 'utf8'))
    } catch {
      unlinkSync(CRASH_FILE)
      return false
    }
    const body = [
      '🚨 *Ruby se recuperó de una caída*',
      `• *Origen:* ${payload.origin || 'desconocido'}`,
      `• *Momento:* ${payload.at || 'desconocido'}`,
      '',
      '```',
      clip(payload.trace, 1400),
      '```',
      '> Amo, este fue el bug que me tumbó. Ya estoy de vuelta en línea. ✨'
    ].join('\n')
    await conn.sendMessage(OWNER_NUMBER, { text: body })
    unlinkSync(CRASH_FILE) // limpiar para no repetir el aviso
    return true
  } catch (e) {
    console.error('[Ruby][crash-flush]', e?.message)
    return false
  }
}
