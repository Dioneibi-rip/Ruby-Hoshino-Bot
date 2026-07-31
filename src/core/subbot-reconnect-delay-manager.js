const globalDelayState = global.subBotReconnectDelayManager || (global.subBotReconnectDelayManager = {
queue: Promise.resolve(),
nextSlotAt: 0
})
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const numeric = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback
const config = () => ({
baseDelayMs: numeric(process.env.SUBBOT_RECONNECT_BASE_DELAY_MS, 5000),
maxDelayMs: numeric(process.env.SUBBOT_RECONNECT_MAX_DELAY_MS, 120000),
jitterMinMs: numeric(process.env.SUBBOT_RECONNECT_JITTER_MIN_MS, 5000),
jitterMaxMs: numeric(process.env.SUBBOT_RECONNECT_JITTER_MAX_MS, 15000),
slotMs: Math.max(1000, numeric(process.env.SUBBOT_RECONNECT_SLOT_MS, 1000))
})
export function getSubBotReconnectDelayMs(attempt = 1, closeReason = 'unknown') {
const cfg = config()
const safeAttempt = Math.max(1, Number(attempt) || 1)
const exponential = Math.min(cfg.maxDelayMs, cfg.baseDelayMs * (2 ** (safeAttempt - 1)))
const jitterMin = Math.min(cfg.jitterMinMs, cfg.jitterMaxMs)
const jitterMax = Math.max(cfg.jitterMinMs, cfg.jitterMaxMs)
const jitter = jitterMin + Math.floor(Math.random() * (jitterMax - jitterMin + 1))
const rateLimitDelay = String(closeReason || '').includes('429') || String(closeReason || '').toLowerCase().includes('rate') ? 30000 : 0
return Math.min(cfg.maxDelayMs, Math.max(rateLimitDelay, exponential + jitter))
}
export function enqueueSubBotSocketStart(task) {
const cfg = config()
const run = globalDelayState.queue.catch(() => {}).then(async () => {
const now = Date.now()
const waitMs = Math.max(0, globalDelayState.nextSlotAt - now)
if (waitMs > 0) await delay(waitMs)
const slotStartedAt = Date.now()
const nextSecond = Math.floor(slotStartedAt / cfg.slotMs) * cfg.slotMs + cfg.slotMs
if (globalDelayState.nextSlotAt < nextSecond) globalDelayState.nextSlotAt = nextSecond
return task()
})
globalDelayState.queue = run.finally(() => {})
return run
}
export async function scheduleSubBotReconnect({ attempt = 1, closeReason = 'unknown', task }) {
const waitMs = getSubBotReconnectDelayMs(attempt, closeReason)
await delay(waitMs)
return enqueueSubBotSocketStart(task)
}
