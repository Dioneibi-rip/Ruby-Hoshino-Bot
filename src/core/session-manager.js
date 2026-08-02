import { TTLCache } from '../library/native-utils.js'
import { commandTesterCache, groupMetadataCache, msgRetryCounterCache, prefixMatcherCache } from '../library/global-cache.js'
import { hydrateBotProfile } from './botProfileStore.js'

const DEFAULT_CACHE_TTL_SECONDS = 5 * 60

function createSessionCaches() {
return {
msgRetryCounterCache,
groupMetadataCache,
commandTesterCache,
prefixMatcherCache,
}
}

export function getSessionId(conn = {}) {
return conn.user?.jid || conn.authState?.creds?.me?.jid || 'primary'
}

export function attachSessionState(conn, { id, type = 'standard', parentId = null, path = null, ownerJid = null } = {}) {
if (!conn) return null
const sessionId = id || getSessionId(conn)
conn.session = {
id: sessionId,
type,
parentId,
path,
ownerJid,
createdAt: Date.now(),
...(conn.session || {}),
}
conn.__rubyState ||= {}
conn.__rubyState.caches ||= createSessionCaches()
conn.__groupMetadataCache = conn.__rubyState.caches.groupMetadataCache
conn.__commandTesterCache = conn.__rubyState.caches.commandTesterCache
conn.__prefixMatcherCache = conn.__rubyState.caches.prefixMatcherCache
hydrateBotProfile(conn)
return conn.session
}

export function createMessageRetryCache() {
return msgRetryCounterCache || new TTLCache({ stdTTL: DEFAULT_CACHE_TTL_SECONDS, checkperiod: 120, useClones: false })
}

export function cleanupSessionState(conn) {
if (!conn?.__rubyState?.caches) return
delete conn.__rubyState
delete conn.__groupMetadataCache
delete conn.__commandTesterCache
delete conn.__prefixMatcherCache
}

