import { parentPort, workerData } from 'worker_threads'
import path, { join } from 'path'
import { readdirSync } from 'fs'
import pino from 'pino'
import { useSQLiteAuthState, createManagerDatabase } from '@nevi-dev/sqlite-auth'
import { DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'
import { makeWASocket } from '../../lib/simple.js'
import { attachSessionState, cleanupSessionState, createMessageRetryCache } from './session-manager.js'
import SQLiteDatabase from '../../lib/database.js'
import { rebuildCommandsMap, registerPluginCommands } from './handler-utils.js'
await import('../../settings.js')

const { folderPath, subBotId, subBotJid, command, args = [], globals = {}, request } = workerData
Object.assign(global, globals)
global.conns = []
global.opts ||= {}
global.db ||= new SQLiteDatabase(global.opts?.db || './src/database/database.sqlite')
global.DATABASE ||= global.db
global.plugins ||= {}
global.commandsMap ||= new Map()
global.__filename ||= (pathURL) => pathURL
global.__dirname ||= (pathURL) => path.dirname(pathURL)
global.authManagerDb = createManagerDatabase({ dbPath: `./${global.Rubysessions || 'sessions'}/system.db`, tableName: 'bot_registry' })

const loadPlugins = async () => {
  const base = path.resolve('plugins')
  const walk = (folder, root = folder) => readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const full = join(folder, entry.name)
    if (entry.isDirectory()) return walk(full, root)
    return /\.js$/.test(entry.name) ? [full.slice(root.length + 1).replace(/\\/g, '/')] : []
  })
  for (const relative of walk(base)) {
    try {
      const plugin = (await import(`../../plugins/${relative}?worker=${Date.now()}`)).default
      if (plugin) {
        global.plugins[relative] = plugin
        registerPluginCommands(relative, plugin)
      }
    } catch (error) {
      console.error(`[SubBot:${subBotId}] no pude cargar plugin ${relative}:`, error?.message || error)
    }
  }
  rebuildCommandsMap(global.plugins)
}

const post = (payload) => parentPort?.postMessage({ subBotId, ...payload })
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const socketCfg = global.baileysSocketConfig || {}
const MAX_RECONNECT_ATTEMPTS = socketCfg.maxReconnectAttempts ?? 5
const BASE_DELAY_MS = socketCfg.reconnectBaseDelayMs ?? 1500
const MAX_DELAY_MS = socketCfg.reconnectMaxDelayMs ?? 30000
let sock
let reconnectAttempts = 0
let shuttingDown = false
let pairingSent = false

function shouldPairWithCode() {
  return command === 'code' || args.some(arg => /^(--code|code)$/i.test(String(arg).trim()))
}

function getPairingPhone() {
  return String(subBotJid || request?.sender || '').split('@')[0].split(':')[0].replace(/\D/g, '')
}

function upsertRegistry(status, metadata = {}) {
  const db = global.authManagerDb
  if (!db) return
  const jid = metadata.jid || sock?.user?.jid || sock?.authState?.creds?.me?.jid || `${subBotId}@s.whatsapp.net`
  try {
    db.prepare('INSERT OR REPLACE INTO bot_registry (id, jid, status, metadata) VALUES (?, ?, ?, ?)').run(subBotId, jid, status, JSON.stringify({ ...metadata, jid, path: folderPath }))
  } catch (error) {
    console.error(`[SubBot:${subBotId}] registro SQLite:`, error)
  }
}

async function destroy({ removeSession = false } = {}) {
  shuttingDown = true
  try { sock?.ws?.close?.() } catch {}
  try { sock?.ev?.removeAllListeners?.() } catch {}
  cleanupSessionState(sock)
  upsertRegistry(removeSession ? 'removed' : 'offline')
}

async function connect() {
  if (!Object.keys(global.plugins).length) await loadPlugins()
  const { state, saveCreds } = useSQLiteAuthState(folderPath, { dbName: 'auth.db', cleanOldFiles: true })
  const { version } = await fetchLatestBaileysVersion()
  const msgRetryCache = createMessageRetryCache()
  sock = makeWASocket({
    logger: pino({ level: 'fatal' }),
    printQRInTerminal: false,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
    msgRetryCache,
    browser: shouldPairWithCode() ? ['Ubuntu', 'Chrome', '110.0.5585.95'] : ['Ruby Hoshino (Sub Bot)', 'Chrome', '2.0.0'],
    version,
    generateHighQualityLinkPreview: true,
    defaultQueryTimeoutMs: socketCfg.defaultQueryTimeoutMs ?? 45000,
    connectTimeoutMs: socketCfg.connectTimeoutMs ?? 60000,
    keepAliveIntervalMs: socketCfg.keepAliveIntervalMs ?? 10000,
    retryRequestDelayMs: socketCfg.retryRequestDelayMs ?? 1500,
    markOnlineOnConnect: false,
    syncFullHistory: false
  })
  sock.subBotId = subBotId
  sock.subBotJid = subBotJid
  attachSessionState(sock, { id: subBotId, type: 'subbot', parentId: 'worker-manager', path: folderPath })

  const handlerModule = await import(`../../handler.js?t=${Date.now()}`)
  sock.handler = handlerModule.handler.bind(sock)
  sock.connectionUpdate = connectionUpdate.bind(sock)
  sock.credsUpdate = saveCreds
  sock.ev.on('messages.upsert', sock.handler)
  sock.ev.on('connection.update', sock.connectionUpdate)
  sock.ev.on('creds.update', sock.credsUpdate)
  post({ type: 'status', status: 'starting' })
}

async function reconnect(reason) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    post({ type: 'fatal', error: `límite de reconexión alcanzado (${reason})` })
    await destroy({ removeSession: false })
    process.exit(1)
  }
  reconnectAttempts += 1
  const waitMs = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * (2 ** (reconnectAttempts - 1)))
  post({ type: 'status', status: 'reconnecting', reason, attempt: reconnectAttempts, waitMs })
  await sleep(waitMs)
  try { await destroy({ removeSession: false }); shuttingDown = false; await connect() } catch (error) { await reconnect(error?.message || reason) }
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect, qr } = update
  if (qr && !pairingSent) {
    pairingSent = true
    if (shouldPairWithCode()) {
      const phone = getPairingPhone()
      if (!phone) return post({ type: 'text', text: '🥀 No pude detectar el número para generar el código de vinculación.' })
      const rawCode = await sock.requestPairingCode(phone, 'RUBYCHAN')
      const formatted = rawCode.match(/.{1,4}/g)?.join('-') || rawCode
      post({ type: 'pairing-code', text: `*✨ Código de vinculación Sub-Bot ✨*\n\n*Código:* ${formatted}\n\nEste código expirará pronto.` })
    } else {
      post({ type: 'qr', qr, caption: '✐ Conexión Sub-Bot por QR\n\nEscanea este QR desde WhatsApp > Dispositivos vinculados.' })
    }
    return
  }

  const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
  if (connection === 'close' && !shuttingDown) {
    if (reason === DisconnectReason.loggedOut || [401, 403, 405].includes(reason)) {
      post({ type: 'logged-out', reason })
      await destroy({ removeSession: true })
      process.exit(0)
    }
    if ([DisconnectReason.connectionClosed, DisconnectReason.connectionLost, 428, 408, 500, 515].includes(reason)) return reconnect(reason)
    return reconnect(reason || 'unknown')
  }

  if (connection === 'open') {
    reconnectAttempts = 0
    pairingSent = false
    const jid = sock.authState?.creds?.me?.jid || sock.user?.jid
    upsertRegistry('online', { jid, connectedAt: Date.now() })
    post({ type: 'status', status: 'online', jid })
    for (const channelId of Object.values(global.ch || {})) sock.newsletterFollow(channelId).catch(() => {})
  }
}

parentPort?.on('message', async (message = {}) => {
  if (message.type === 'shutdown') {
    await destroy({ removeSession: false })
    process.exit(0)
  }
})

connect().catch(error => {
  post({ type: 'fatal', error: error?.stack || error?.message || String(error) })
  process.exit(1)
})
