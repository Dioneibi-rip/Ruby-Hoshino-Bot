const DEFAULT_MAX_MESSAGES = 8
const DEFAULT_MAX_SESSIONS = 500
const stores = new Map()

function getStore(namespace) {
  if (!stores.has(namespace)) stores.set(namespace, new Map())
  return stores.get(namespace)
}

function trimStore(store, maxSessions) {
  while (store.size > maxSessions) {
    const oldestKey = store.keys().next().value
    if (!oldestKey) break
    store.delete(oldestKey)
  }
}

export function getAiContext(namespace, jid, { maxMessages = DEFAULT_MAX_MESSAGES, maxSessions = DEFAULT_MAX_SESSIONS } = {}) {
  const key = String(jid || 'anonymous')
  const store = getStore(namespace)
  const current = store.get(key) || []
  store.delete(key)
  store.set(key, current.slice(-maxMessages))
  trimStore(store, maxSessions)
  return store.get(key)
}

export function rememberAiExchange(namespace, jid, userText, assistantText, options = {}) {
  const history = getAiContext(namespace, jid, options)
  if (userText) history.push({ role: 'user', content: String(userText).trim() })
  if (assistantText) history.push({ role: 'model', content: String(assistantText).trim() })
  const maxMessages = Number(options.maxMessages || DEFAULT_MAX_MESSAGES)
  if (history.length > maxMessages) history.splice(0, history.length - maxMessages)
  return history
}

export function buildAiPromptWithContext(namespace, jid, userText, options = {}) {
  const history = getAiContext(namespace, jid, options)
  if (!history.length) return String(userText || '').trim()
  const context = history
    .slice(-Number(options.maxMessages || DEFAULT_MAX_MESSAGES))
    .map(item => `${item.role === 'model' ? 'Modelo' : 'Usuario'}: ${String(item.content || '').trim()}`)
    .join('\n')
  return `Contexto reciente de esta conversación (no lo repitas salvo que sea útil):\n${context}\n\nUsuario: ${String(userText || '').trim()}\nModelo:`
}
