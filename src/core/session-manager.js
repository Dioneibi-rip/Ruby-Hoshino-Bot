import NodeCache from 'node-cache'
import { TTLCache } from '../../lib/optimizer.js'

const DEFAULT_CACHE_TTL_SECONDS = 5 * 60
const DEFAULT_GROUP_METADATA_TTL_MS = 60 * 1000
const DEFAULT_GROUP_METADATA_MAX = 500

function createSessionCaches() {
  return {
    msgRetryCounterCache: new NodeCache({ stdTTL: DEFAULT_CACHE_TTL_SECONDS, checkperiod: 120, useClones: false }),
    groupMetadataCache: new TTLCache(DEFAULT_GROUP_METADATA_TTL_MS, DEFAULT_GROUP_METADATA_MAX),
    commandTesterCache: new Map(),
    prefixMatcherCache: new Map(),
  }
}

export function getSessionId(conn = {}) {
  return conn.subBotId || conn.user?.jid || conn.authState?.creds?.me?.jid || 'primary'
}

export function attachSessionState(conn, { id, type = 'standard', parentId = null, path = null } = {}) {
  if (!conn) return null
  const sessionId = id || getSessionId(conn)
  conn.session = {
    id: sessionId,
    type,
    parentId,
    path,
    createdAt: Date.now(),
    ...(conn.session || {}),
  }
  conn.__rubyState ||= {}
  conn.__rubyState.caches ||= createSessionCaches()
  conn.__groupMetadataCache = conn.__rubyState.caches.groupMetadataCache
  conn.__commandTesterCache = conn.__rubyState.caches.commandTesterCache
  conn.__prefixMatcherCache = conn.__rubyState.caches.prefixMatcherCache
  return conn.session
}

export function createMessageRetryCache() {
  return new NodeCache({ stdTTL: DEFAULT_CACHE_TTL_SECONDS, checkperiod: 120, useClones: false })
}

export function cleanupSessionState(conn) {
  if (!conn?.__rubyState?.caches) return
  const { groupMetadataCache, commandTesterCache, prefixMatcherCache, msgRetryCounterCache } = conn.__rubyState.caches
  groupMetadataCache?.store?.clear?.()
  commandTesterCache?.clear?.()
  prefixMatcherCache?.clear?.()
  msgRetryCounterCache?.flushAll?.()
  delete conn.__rubyState
  delete conn.__groupMetadataCache
  delete conn.__commandTesterCache
  delete conn.__prefixMatcherCache
}

export function registerSubBot(registry, id, data) {
  if (!(registry instanceof Map) || !id) return
  const previous = registry.get(id)
  if (previous?.sock && previous.sock !== data?.sock) cleanupSessionState(previous.sock)
  registry.set(id, { ...data, updatedAt: Date.now() })
}
