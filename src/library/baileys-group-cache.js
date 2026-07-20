const GROUP_FETCH_ALL_TTL_MS = 10 * 60 * 1000
const GROUP_FETCH_ALL_MIN_INTERVAL_MS = Number(process.env.GROUP_FETCH_ALL_MIN_INTERVAL_MS || 3 * 60 * 1000)
const GROUP_FETCH_ALL_RETRY_DELAY_MS = Number(process.env.GROUP_FETCH_ALL_RETRY_DELAY_MS || 10 * 60 * 1000)

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function getState(conn) {
conn.__groupFetchAllCache ||= { data: null, updatedAt: 0, lastRequestAt: 0, inflight: null, blockedUntil: 0 }
return conn.__groupFetchAllCache
}

function isRateLimitError(error) {
const text = String(error?.message || error?.output?.payload?.message || error?.data || error || '').toLowerCase()
return text.includes('rate-overlimit') || text.includes('rate limit') || text.includes('too many') || text.includes('429')
}

async function waitForFetchSlot(state) {
const elapsed = Date.now() - Number(state.lastRequestAt || 0)
if (elapsed < GROUP_FETCH_ALL_MIN_INTERVAL_MS) await delay(GROUP_FETCH_ALL_MIN_INTERVAL_MS - elapsed)
}

export async function getCachedParticipatingGroups(conn, { force = false } = {}) {
if (!conn?.groupFetchAllParticipating) return {}
const state = getState(conn)
const now = Date.now()
if (!force && state.data && now - state.updatedAt < GROUP_FETCH_ALL_TTL_MS) return state.data
if (!force && state.blockedUntil > now) return state.data || {}
if (state.inflight) return state.inflight
state.inflight = (async () => {
await waitForFetchSlot(state)
state.lastRequestAt = Date.now()
try {
const groups = await conn.groupFetchAllParticipating()
state.data = groups || {}
state.updatedAt = Date.now()
state.blockedUntil = 0
return state.data
} catch (error) {
if (isRateLimitError(error)) {
state.blockedUntil = Date.now() + GROUP_FETCH_ALL_RETRY_DELAY_MS
console.warn('[baileys] groupFetchAllParticipating rate-limited; using cached groups for now')
}
return state.data || {}
} finally {
state.inflight = null
}
})()
return state.inflight
}
