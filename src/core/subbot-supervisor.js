import * as ws from 'ws'
import { cleanupSessionState } from './session-manager.js'
import { cleanupGlobalCaches } from '../library/global-cache.js'

const DEFAULT_SUPERVISOR_INTERVAL_MS = 2 * 60 * 1000

function isSocketClosed(sock) {
  const readyState = sock?.ws?.socket?.readyState
  return !sock?.user || readyState === ws.CLOSED || readyState === 3
}

function cleanupLiteSocket(sock) {
  if (!sock) return
  try { sock.__msgRetryCache?.flushAll?.() } catch {}
  try { sock.__groupMetadataCache?.clearExpired?.() } catch {}
  try {
    if (sock.__commandTesterCache?.size > 1000) sock.__commandTesterCache.clear()
    if (sock.__prefixMatcherCache?.size > 1000) sock.__prefixMatcherCache.clear()
  } catch {}
}

export function runSubBotSupervisor() {
  if (!Array.isArray(global.conns)) return { active: 0, removed: 0 }
  cleanupGlobalCaches()
  let removed = 0
  const active = []
  for (const sock of global.conns) {
    if (!sock) continue
    cleanupLiteSocket(sock)
    if (isSocketClosed(sock)) {
      removed++
      try { sock.__liteMsgStore?.clear?.() } catch {}
      try { sock.ev?.removeAllListeners?.() } catch {}
      try { sock.ws?.close?.() } catch {}
      try { cleanupSessionState(sock) } catch {}
      continue
    }
    active.push(sock)
  }
  global.conns = active
  return { active: active.length, removed }
}

export function startSubBotSupervisor({ intervalMs = DEFAULT_SUPERVISOR_INTERVAL_MS } = {}) {
  if (global.__rubySubBotSupervisor) return global.__rubySubBotSupervisor
  const timer = setInterval(() => {
    try { runSubBotSupervisor() } catch (error) { console.error('[subbot-supervisor]', error) }
  }, intervalMs)
  timer.unref?.()
  global.__rubySubBotSupervisor = timer
  return timer
}

export default { startSubBotSupervisor, runSubBotSupervisor }
