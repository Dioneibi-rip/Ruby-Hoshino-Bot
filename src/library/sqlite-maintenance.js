const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000
const DEFAULT_START_DELAY_MS = 5 * 60 * 1000

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function resolveSQLiteConnection(candidate) {
  if (!candidate) return null
  if (candidate.sqlite && typeof candidate.sqlite.exec === 'function') return candidate.sqlite
  if (typeof candidate.exec === 'function') return candidate
  return null
}

export function runSQLiteMaintenance(candidate, label = 'sqlite') {
  const sqlite = resolveSQLiteConnection(candidate)
  if (!sqlite) return false
  try {
    sqlite.exec('PRAGMA wal_checkpoint(TRUNCATE);')
    sqlite.exec('VACUUM;')
    sqlite.exec('PRAGMA optimize;')
    if (process.env.RUBY_DEBUG_SQLITE === 'true') console.log(`[sqlite-maintenance] ${label}: WAL truncado y VACUUM completado.`)
    return true
  } catch (error) {
    if (process.env.RUBY_DEBUG_SQLITE === 'true') console.error(`[sqlite-maintenance] ${label}: no se pudo ejecutar mantenimiento:`, error?.message || error)
    return false
  }
}

export function runSQLiteMaintenanceBatch(targets = []) {
  let completed = 0
  for (const target of targets) {
    if (runSQLiteMaintenance(target?.db || target?.sqlite || target, target?.label || 'sqlite')) completed += 1
  }
  return completed
}

export function startSQLiteMaintenance(targetFactory, options = {}) {
  if (typeof targetFactory !== 'function') throw new TypeError('startSQLiteMaintenance requiere una función targetFactory')
  const intervalMs = parsePositiveInteger(options.intervalMs ?? process.env.SQLITE_MAINTENANCE_INTERVAL_MS, DEFAULT_INTERVAL_MS)
  const startDelayMs = parsePositiveInteger(options.startDelayMs ?? process.env.SQLITE_MAINTENANCE_START_DELAY_MS, DEFAULT_START_DELAY_MS)
  const run = () => {
    try {
      const targets = targetFactory() || []
      runSQLiteMaintenanceBatch(targets)
    } catch (error) {
      console.error('[sqlite-maintenance] Error preparando mantenimiento:', error?.message || error)
    }
  }
  const startTimer = setTimeout(run, startDelayMs)
  startTimer.unref?.()
  const interval = setInterval(run, intervalMs)
  interval.unref?.()
  return {
    runNow: run,
    stop() {
      clearTimeout(startTimer)
      clearInterval(interval)
    }
  }
}
