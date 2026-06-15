import os from 'os'

const CHECK_INTERVAL_MS = 60000
const DB_SAVE_INTERVAL_MS = 300000
let healthInterval
let dbInterval
let dbErrors = 0
let lastRss = 0
let listenersAttached = false

function mb(value) {
return Number((value / 1024 / 1024).toFixed(1))
}

export function getMemoryInfo() {
const memory = process.memoryUsage()
return { rss: mb(memory.rss), heap: mb(memory.heapUsed), heapTotal: mb(memory.heapTotal), external: mb(memory.external) }
}

export async function safeDBSave() {
try {
if (global.db?.data && typeof global.db.write === 'function') await global.db.write()
dbErrors = 0
} catch (error) {
dbErrors++
console.error('[stability-monitor]', error)
}
}

export function checkHealth() {
const memory = getMemoryInfo()
const queue = global.getQueueStats?.() || {}
if (memory.rss > 1400) console.error(`[stability-monitor] memoria critica ${memory.rss} MB`)
else if (memory.rss > 800) console.warn(`[stability-monitor] memoria alta ${memory.rss} MB`)
if (lastRss && memory.rss - lastRss > 80) console.warn(`[stability-monitor] crecimiento rapido de memoria ${(memory.rss - lastRss).toFixed(1)} MB`)
lastRss = memory.rss
if ((queue.totalQueued || 0) > 50) console.warn(`[stability-monitor] cola alta ${queue.totalQueued}`)
return { memory, queue }
}

export function generateReport() {
const memory = getMemoryInfo()
const load = os.loadavg()
return { uptime: formatUptime(process.uptime()), memory: { rss: `${memory.rss} MB`, heap: `${memory.heap} MB`, heapTotal: `${memory.heapTotal} MB`, external: `${memory.external} MB` }, cpu: { load1: load[0].toFixed(2), load5: load[1].toFixed(2) }, plugins: Object.keys(global.plugins || {}).length, queue: global.getQueueStats?.() || {}, dbErrors }
}

export function formatUptime(seconds) {
const days = Math.floor(seconds / 86400)
const hours = Math.floor((seconds % 86400) / 3600)
const minutes = Math.floor((seconds % 3600) / 60)
const secs = Math.floor(seconds % 60)
return [days ? `${days}d` : '', hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', `${secs}s`].filter(Boolean).join(' ')
}

export function startMonitor() {
if (healthInterval) return
healthInterval = setInterval(checkHealth, CHECK_INTERVAL_MS)
healthInterval.unref?.()
dbInterval = setInterval(safeDBSave, DB_SAVE_INTERVAL_MS)
dbInterval.unref?.()
if (!listenersAttached) {
process.on('unhandledRejection', (error) => console.error('[unhandledRejection]', error))
listenersAttached = true
}
}

export function stopMonitor() {
if (healthInterval) clearInterval(healthInterval)
if (dbInterval) clearInterval(dbInterval)
healthInterval = null
dbInterval = null
}
