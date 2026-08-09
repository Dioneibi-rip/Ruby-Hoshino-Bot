process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import { readdirSync, existsSync, mkdirSync, rmSync, watch, readFileSync } from 'fs'
import { readdir, access, stat, unlink } from 'fs/promises'
import * as ws from 'ws'
import path, { join, dirname } from 'path'
import { parseArgv } from '../library/parseArgsCompat.js'
import { spawn } from 'child_process'
import { lodash as lodash } from '../library/nativeStubs.js'
import chalk from '../library/ansi.js'
import { tmpdir } from 'os'
import { format } from 'util'
import pino from '../library/logger.js'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize, SimpleSocketService } from '../library/simple.js'
import { useOptimizedAuthState } from '../library/sqliteAuthState.js'
import { initializeDatabase } from '../library/database.js'
import store, { getBaileysSQLite } from '../library/store.js'
import { startSQLiteMaintenance } from '../library/sqlite-maintenance.js'
import readline, { createInterface } from 'readline'
import { EventEmitter } from 'events'
import { fetchLatestBaileysVersion } from '@whiskeysockets/baileys'

function loadEnvFile(file = '.env') {
try {
const source = readFileSync(file, 'utf8')
for (const line of source.split(/\r?\n/)) {
const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/)
if (!match || process.env[match[1]] !== undefined) continue
let value = match[2] || ''
if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
process.env[match[1]] = value.replace(/\\n/g, '\n')
}
} catch {}
}

loadEnvFile()
import { attachSessionState, createMessageRetryCache } from '../core/session-manager.js'
import { alignSocketTelemetry, getStandardBrowserProfile } from '../core/socket-telemetry.js'
import { rebuildCommandsMap, registerPluginCommands, unregisterPluginCommands } from '../router/handler-utils.js'
import { commandRegistry } from '../runtime/command-registry.js'
import { startMediaWorker, setMediaQueueConnection, closeMediaQueue } from '../library/queue.js'
import { restoreSubbots, requestPairingCodeWithTimeout } from '../core/subbot-engine.js'
import { getBaileysExport, getBaileysProto, getSignalKeyStore } from '../core/baileys-compat.js'
import { printNativeQr, clearNativeQr } from '../utils/nativeQr.js'
import { sanitizePairingNumber } from '../core/identity-utils.js'
EventEmitter.defaultMaxListeners = 100
const baileysModule = await import('@whiskeysockets/baileys')
global.baileys = baileysModule
global.Baileys = baileysModule
const proto = getBaileysProto(baileysModule)
const DisconnectReason = getBaileysExport(baileysModule, 'DisconnectReason')
const jidNormalizedUser = getBaileysExport(baileysModule, 'jidNormalizedUser')
const Browsers = getBaileysExport(baileysModule, 'Browsers')
const { CONNECTING } = ws
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') { return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString(); };
global.__dirname = function dirname(pathURL) { return path.dirname(global.__filename(pathURL, true)) };
global.__require = function createLocalRequire(dir = import.meta.url) { return createRequire(dir) }
await import('../../settings.js')
global.timestamp = {start: new Date}
const __dirname = global.__dirname(import.meta.url)
global.opts = parseArgv(process.argv.slice(2))
global.__bannerShown = false
global.prefix = new RegExp('^[#/!.]')
mkdirSync(join(process.cwd(), 'tmp'), { recursive: true })
global.db = await initializeDatabase(opts['db'] || './src/database/database.sqlite')
global.DATABASE = global.db
let databaseShutdownStarted = false
const sqliteMaintenance = startSQLiteMaintenance(() => [
{ label: 'database.sqlite', db: global.db?.sqlite || global.db },
{ label: 'baileys-store.sqlite', db: getBaileysSQLite() || global.db?.baileysSqlite }
])
global.authCredsFlushers ||= new Set()
global.__rubyPluginWatchers ||= new Map()
function createDebouncedSaveCreds(saveCreds, delayMs = 4000) {
let timer
let pending = false
let running = Promise.resolve()
const flush = () => {
if (timer) {
clearTimeout(timer)
timer = undefined
}
if (!pending) return running
pending = false
running = running.then(() => saveCreds()).catch(console.error)
return running
}
const debounced = () => {
pending = true
if (timer) clearTimeout(timer)
timer = setTimeout(flush, delayMs)
timer.unref?.()
return running
}
debounced.flush = flush
return debounced
}
const bannerASCII = chalk.bold.hex('#FF0080')(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣤⣾⣿⡿⠿⠟⣿⣶⣶⣶⣤⣤⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⡿⠟⣛⣉⣧⣶⠟⢋⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⠔⣛⣉⡙⢻⣇⠸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⠟⣡⣾⣿⣿⣿⣌⡋⢠⣿⣿⠿⣿⣿⣿⠿⠿⠟⠛⢛⣛⠏⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢠⠟⣡⣾⣿⣿⣿⡿⠿⠛⠉⠀⠀⢀⣀⣩⣤⣤⣴⣶⣶⣶⣾⠟⠀⠀⣴⣿⣿⣶⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⢨⣾⣿⡿⠟⠋⠁⠀⣀⣠⠀⣴⣶⣆⠙⣿⣿⣿⣿⡿⠟⠋⠀⠀⣰⠿⠌⠟⢻⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠃⠺⡿⠁⠀⣀⣴⣾⣿⣿⣿⠀⢦⣤⠙⠃⠸⠛⠉⠁⠀⠀⠀⠀⣾⣯⠀⠰⠀⢀⢹⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⡈⠻⠿⠿⠿⠿⠛⠃⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣾⣿⣿⣧⣀⣠⢸⣾⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡈⠁⠀⠀⠀⠀⠀⠀⢴⣷⡀⠀⠀⠀⢀⡠⠊⠰⣿⣇⢻⣿⣿⣿⡇⠃⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣶⣤⣙⡒⠶⠦⣤⣄⣛⣷⡤⠴⢒⣩⣴⡾⣇⢻⣿⢸⣿⣿⡷⣧⡄⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⡇⣸⣶⣿⡶⢶⣶⣿⣿⣧⠹⠛⠛⠈⣉⠘⣹⣿⡇⣄⡇⣿⣿⡇⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣷⢿⣿⣿⡿⡇⣾⠿⠿⣁⣸⣿⣿⣿⣿⣃⡄⠀⣁⠘⢺⣹⣿⡇⠛⣴⢹⣿⡇⢻⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣿⣿⣿⢸⣿⣿⠇⠁⡄⠀⠐⠀⣿⣿⣿⣿⣿⣿⣿⣦⣴⣾⣿⡟⣿⡇⢰⡿⢸⣿⡇⢸⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⡏⠉⠉⢻⡇⢿⡟⣿⢰⣿⣄⣀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⡴⢿⠁⣿⣷⢸⣿⣧⡈⠉⠉⠋⠉⣿⣷⡄⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⣿⡇⠀⠀⢸⣿⡘⣷⢻⡌⢿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⢿⣿⣿⣾⠇⣿⢸⣿⡏⠈⣿⣿⡅⠀⠀⠀⠀⣿⣿⣿⣦⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⡇⠀⠀⠸⣿⠇⢻⣸⡝⣌⠻⣿⣿⣿⣿⡟⢉⣴⣶⣿⣿⣿⡿⢃⢸⣿⢸⣿⣇⠀⣿⣿⣷⠀⢀⣀⡀⠟⠻⢿⣿⣧⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⡇⠀⠀⠀⠻⣀⠘⣇⢷⡈⢷⣌⡛⠿⣿⣿⣿⣿⣿⣿⡿⠋⡀⡇⣸⡏⢸⣿⣿⠀⢻⣿⣿⣇⠈⠛⠀⠀⠀⣀⡉⠻⣧⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀���⠀⠀⠀⢀⣾⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⣿⠀⠘⣾⣧⠀⠻⣿⠀⠂⠉⣙⠛⠛⣩⣴⣿⠋⢀⠿⣷⢸⣿⡿⠀⢸⣿⣿⡏⠁⠀⠀⣤⣤⣤⣽⣷⡌⣧⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠘⠇⠀⠈⢿⣷⡀⠈⠁⠀⠀⠘⢷⣦⣬⣉⠉⢀⡀⠀⠉⠘⠛⠁⣀⡘⠛⠛⠗⢀⠎⠀⣉⣉⣩⣤⣴⣇⢹⡆⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⣿⣿⣿⡇⠠⣴⣶⣶⣾⣶⠀⠃⠀⠛⣳⠄⠙⠀⠀⠀⠀⠙⠿⠁⠀⠀⠄⠀⠀⠀⠀⢀⣩⣿⣿⡿⡇⠀⣠⠞⠉⢀⣬⣽⣿⡿⢸⣷⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿⢃⡉⣿⣿⣿⣵⣶⣦⡀⠀⠀⠹⣧⡀⠀⠁⠄⠀⠀⠀⠀⠐⠄⠀⠀⠀⢠⣾⣿⣿⣿⣿⣿⣇⠰⡘⢠⣾⡿⣿⣿⡿⢁⣾⣿⡆⠀
⠀⠀⠀⠀⠀⠀⠀���⠀⠀⣿⣿⣿⣿⣿⣿⣿⡟⣾⢧⡙⣿⣿⣿⣿⣿⣿⡄⠀⠀⠘⣿⣄⠀⠠⠀⠀⢠⠀⡀⠀⠀⢀⣴⣿⣿⣿⣿⣿⣿⣿⡿⡄⣧⣸⡿⠀⣿⣿⢃⣾⣿⣿⡇⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣷⢩⣧⡙⠮⣿⢸⣿⣿⣿⣿⡄⠀⠀⡈⢿⣷⣤⣤⣶⠀⠀⠀⢰⣶⣿⣿⡿⠿⠿⠿⣿⣿⣿⣷⢠⡧⣼⠀⣸⣿⠇⣼⣿⣿⣿⣿⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⠀⣿⣿⣷⡌⠀⠿⠛⠛⠛⠛⠀⠻⠋⠀⠹⣿⡇⣀⠀⠀⠀⣸⣿⣏⠰⠶⠾⣿⣿⣿⣿⡷⢀⠟⠰⣻⣿⠿⠋⠰⣿⣿⣿⣿⣿⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⡇⢸⣿⣿⣿⣿⡆⣠⣶⣬⣭⡉⠛⠀⡀⠰⣤⡈⠷⣿⣤⣤⣴⣿⣿⡿⠻⢷⣶⡶⠶⠿⠿⢷⣾⣤⣾⡿⠻⠆⣘⣠⠀⣿⣿⣿⣿⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⠃⣾⣿⣿⣿⡿⢠⣿⣿⣿⣿⣷⣶⣾⣿⣦⠘⠗⠀⠘⢿⣿⣿⣿⠏⡀⠀⣀⣀⣤⣴⣶⠶⠎⠙⣉⣤⣴⣾⣿⣿⣿⠀⣿⣿⣿⡟⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⣿⣿⠀⣿⣿⠁⣿⡇⡾⢻⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⢉⡿⠃⠈⢀⣼⣿⣿⡿⠃⣀⣀⠀⢺⣿⣿⣿⣿⣿⣿⣿⢀⣿⣿⣿⡇⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⣿⣿⢀⠻⣿⡀⣿⠀⠇⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀⠀⡀⠀⢀⣴⣿⣿⣿⣿⠿⠟⠛⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿⢸⣿⣿⣿⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⣿⢸⣷⣌⠳⣿⠀⡀⢿⠿⠟⠁⠘⢻⣿⡏⠹⠟⠉⠴⢚⣹⣧⠀⢿⣿⣿⣿⣿⡁⠀⠀⠀⠀⢀⣿⣿⣿⣿⣿⣿⣿⣿⢸⣿⣿⡏⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣿⢸⣿⣿⣷⣼⣇⠀⠀⠀⠀⠀⠀⣤⠼⠃⠀⣠⣴⣾⣿⣿⣿⣦⠀⠙⠿⠟⠛⠃⠀⠀⠀⢠⣾⣿⣿⣿⣿⣿⣿⣿⠇⣸⣿⡟⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⢸⣿⣿⣿⣿⣿⣧⣀⡀⡴⠶⢊⡡⢂⣴⣾⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠉⢿⣯⣽⣿⠀⣿⡿⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⠸⣿⣿⣿⠟⢋⣩⣤⣶⣶⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⢰⣿⣿⣶⣶⣶⣿⣿⣿⣿⣿⠇⡿⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⡆⣿⣿⢁⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠰⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣷⢻⣧⣼⣿⣿⣿⣿⣿⣿⣿⣿⣯⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠋⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠘⣿⣿⣿⣿⣿⣿⣿⣿⡿⢻⣿⣯⣿⣿⣿⣿⣿⡿⠟⠋⠁⠀⠀⠀⣠⣴⣿⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣧⣿⣿⣿⣿⣿⣿⣿⣧⣾⣿⣿⣿⣿⣿⡿⠛⠉⠀⠀⠀⠀⣠⣴⣿⣿⡿⠿⠿⠯⢹⣿⣿⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠁⠀⠀⠀⠀⣀⣴⣾⣿⣿⣿⡟⠀⠀⠀⠀⠀⠻⣿⣿⣿⣿⡿⠟⠁⠀⠀⠀
`)
const showBanner = () => {
if (global.__bannerShown) return
global.__bannerShown = true
console.clear()
console.log(bannerASCII)
console.log(chalk.bold.hex('#FF66C4')('—🍦ܶ߭ ᪲  ۪  ︵ “Cada comienzo es una nueva oportunidad. Gracias por elegirme, daré lo mejor de mí para ayudarte.” ︵ ࣪'))
console.log(chalk.bold.hex('#9900ff')('୨୧ㅤ۫ Proyecto iniciado con Exito. .ᐟ'))
}
showBanner()
global.loadDatabase = async function loadDatabase() {
if (global.db.READ) return new Promise((resolve,reject)=>{
const startedAt=Date.now()
const poll=()=>{
if(!global.db.READ)return resolve(global.db.data==null?global.loadDatabase():global.db.data)
if(Date.now()-startedAt>30000)return reject(new Error('Timeout esperando lectura de base de datos'))
const timer=setTimeout(poll,1000)
timer.unref?.()
}
poll()
})
if (global.db.data !== null) {
  global.db.chain ||= global.db.data
  return global.db.data
}
global.db.READ = true
await global.db.read().catch(console.error)
global.db.READ = null
if (!global.db.data) global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {} }
else for (const section of ['users', 'chats', 'stats', 'msgs', 'sticker', 'settings']) global.db.data[section] ||= {}
global.db.chain = global.db.data
return global.db.data
}
global.saveDatabase = async function saveDatabase() {
if (!global.db) return false
if (global.db.READ) await global.loadDatabase()
if (typeof global.db.forceSave === 'function') await global.db.forceSave()
else if (typeof global.db.write === 'function') await global.db.write()
else if (typeof global.db.flush === 'function') await global.db.flush()
return true
}
await loadDatabase()
const databaseAutosaveInterval = setInterval(async () => {
try {
await global.saveDatabase()
} catch (error) {
console.error(error)
}
}, 60000)
databaseAutosaveInterval.unref?.()
let metricsLogInterval = null
async function shutdownDatabaseAndExit(code, error) {
if (databaseShutdownStarted) return
databaseShutdownStarted = true
if (error) console.error(error)
try {
clearInterval(databaseAutosaveInterval)
if (metricsLogInterval) clearInterval(metricsLogInterval)
sqliteMaintenance.stop?.()
await Promise.all([...global.authCredsFlushers].map(flush => flush()))
await global.saveDatabase()
await closeMediaQueue()
await store.closeStore?.()
for (const watcher of global.__rubyPluginWatchers?.values?.() || []) {
try { watcher.close?.() } catch {}
}
global.__rubyPluginWatchers?.clear?.()
if (typeof global.db?.close === 'function') await global.db.close()
} catch (saveError) {
console.error(saveError)
code = 1
}
process.exit(code)
}
process.once('SIGINT', () => shutdownDatabaseAndExit(0))
process.once('SIGTERM', () => shutdownDatabaseAndExit(0))
process.once('SIGHUP', () => shutdownDatabaseAndExit(0))
protoType()
serialize()
const { state, saveCreds } = await useOptimizedAuthState(`./${global.Rubysessions}`, { dbName: 'auth.db', cleanOldFiles: true, sessionId: 'main' })
const debouncedSaveCreds = createDebouncedSaveCreds(() => saveCreds.call(global.conn, true))
global.authCredsFlushers.add(debouncedSaveCreds.flush)
const msgRetryCounterMap = (MessageRetryMap) => { };
const msgRetryCounterCache = createMessageRetryCache()
const { version } = await fetchLatestBaileysVersion()
let phoneNumber = global.botNumber
const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")
const MethodMobile = process.argv.includes("mobile")
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => { rl.clearLine(rl.input, 0); return new Promise((resolver) => { rl.question(texto, (respuesta) => { rl.clearLine(rl.input, 0); resolver(respuesta.trim()) }) }) }
let opcion
if (methodCodeQR) { opcion = '1' }
if (!methodCodeQR && !methodCode && !state.creds?.registered) {
const lineM = '━'.repeat(45)
do {
showBanner()
opcion = await question(chalk.bold.magentaBright(`
╭━━${lineM}━━���
┃ ${chalk.bold.cyanBright('╔════❖•ೋ° ¡HOLA USUARIO! °ೋ•❖════╗')}
┃ ${chalk.bold.cyanBright('║')}    ${chalk.bold.greenBright('SELECCIONA TU M��TODO DE CONEXIÓN')}
┃ ${chalk.bold.cyanBright('╚════❖•ೋ° ❀ RUBY-BOT ❀ °ೋ•❖════╝')}
┃
┃ ${chalk.bold.yellow('🔸 OPCIÓN 1:')} ${chalk.white('Escanear Código QR')}
┃ ${chalk.bold.yellow('🔸 OPCIÓN 2:')} ${chalk.white('Código de 8 Dígitos (Pairing)')}
┃
┃ ${chalk.italic.gray('Escribe el número de la opción y presiona Enter')}
╰━━${lineM}━━╯
${chalk.bold.magentaBright('➜ ')}`))
if (!/^[1-2]$/.test(opcion)) {
console.log(chalk.red.bold(`❌ OPCIÓN INVÁLIDA. POR FAVOR ELIJA 1 O 2.`));
await new Promise(resolve => setTimeout(resolve, 1500));
}
} while (opcion !== '1' && opcion !== '2' || state.creds?.registered)
}
const RECONNECT_REASONS = new Set([DisconnectReason.connectionLost, DisconnectReason.connectionClosed, DisconnectReason.restartRequired, DisconnectReason.connectionReplaced, 408, 428, 429])
const DISCONNECT_AUTH_STATUS = new Set([401, 403, DisconnectReason.loggedOut])
const socketCfg = global.baileysSocketConfig || {}
const RECONNECT_BASE_DELAY_MS = socketCfg.reconnectBaseDelayMs ?? 5000
const RECONNECT_MAX_DELAY_MS = socketCfg.reconnectMaxDelayMs ?? 120000
const RECONNECT_JITTER_MS = socketCfg.reconnectJitterMs ?? 5000
let reconnectAttempt = 0
const getReconnectDelayMs = (attempt, statusCode, upstreamDelay = 0) => {
const numericStatus = Number(statusCode)
const rateLimitDelay = [429, 503].includes(numericStatus) ? 30000 : 0
const cappedExponential = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * (2 ** Math.max(0, attempt)))
const fullJitter = Math.floor(Math.random() * Math.max(RECONNECT_JITTER_MS, cappedExponential))
return Math.min(RECONNECT_MAX_DELAY_MS, Math.max(Number(upstreamDelay) || 0, rateLimitDelay, cappedExponential + fullJitter))
}
let connectionOptions = {
logger: pino({ level: 'silent' }),
printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
mobile: MethodMobile,
browser: getStandardBrowserProfile(),
auth: { creds: state.creds, keys: getSignalKeyStore(baileysModule, state.keys, pino({ level: "fatal" }).child({ level: "fatal" })), },
markOnlineOnConnect: socketCfg.markOnlineOnConnect ?? true,
generateHighQualityLinkPreview: socketCfg.generateHighQualityLinkPreview ?? false,
getMessage: async (clave) => { const jid = jidNormalizedUser(clave.remoteJid); const msg = await store.loadMessage(jid, clave.id); return msg?.message },
msgRetryCounterCache,
msgRetryCounterMap,
defaultQueryTimeoutMs: socketCfg.defaultQueryTimeoutMs ?? 60000,
version,
syncFullHistory: socketCfg.syncFullHistory ?? true,
shouldSyncHistoryMessage: socketCfg.shouldSyncHistoryMessage ?? (({ syncType } = {}) => syncType !== proto.HistorySync.HistorySyncType.FULL),
fireInitQueries: socketCfg.fireInitQueries ?? true,
emitOwnEvents: socketCfg.emitOwnEvents ?? true,
waWebSocketUrl: socketCfg.waWebSocketUrl ?? 'wss://web.whatsapp.com/ws/chat',
connectTimeoutMs: socketCfg.connectTimeoutMs ?? 20000,
keepAliveIntervalMs: socketCfg.keepAliveIntervalMs ?? 30000,
retryRequestDelayMs: socketCfg.retryRequestDelayMs ?? 250,
shouldReconnect: ({ statusCode }) => !DISCONNECT_AUTH_STATUS.has(statusCode) && (RECONNECT_REASONS.has(statusCode) || statusCode !== DisconnectReason.loggedOut)
}
const pairingRequested = !state.creds?.registered && (opcion === '2' || methodCode)
// `pairing: true` fuerza el perfil de navegador de escritorio: es la unica forma de que
// el servidor de Meta emita la notificacion push "Vincular dispositivo" en el telefono.
connectionOptions = alignSocketTelemetry(connectionOptions, { version, pairing: pairingRequested })
global.conn = await makeWASocket(connectionOptions, { skipStoreBind: pairingRequested });
setMediaQueueConnection(global.conn)
startMediaWorker(global.conn)
attachSessionState(global.conn, { id: 'primary', type: 'standard', path: global.Rubysessions })
let conn = global.conn
conn.isInit = false;
conn.well = false;
if (!state.creds?.registered) {
if (opcion === '2' || methodCode) {
opcion = '2'
if (!conn.authState.creds.registered) {
let addNumber
if (!!phoneNumber) { addNumber = sanitizePairingNumber(phoneNumber) } else {
do {
phoneNumber = await question(chalk.bold.hex('#A020F0')(`\n📞 INGRESE SU NÚMERO DE WHATSAPP\n${chalk.white('Ejemplo: 5219999999999')}\n${chalk.yellow('➜ ')}`));
// Se sanea a digitos puros ANTES de validar: `isValidPhoneNumber` necesita el
// formato E.164 (`+<digitos>`), y `requestPairingCode` necesita solo digitos.
phoneNumber = sanitizePairingNumber(phoneNumber)
if (!phoneNumber) {
console.log(chalk.red.bold('❌ NÚMERO INVÁLIDO. INGRESE SOLO DÍGITOS CON CÓDIGO DE PAÍS.'))
continue
}
} while (!await isValidPhoneNumber(`+${phoneNumber}`))
rl.close()
addNumber = phoneNumber
}
if (!addNumber) {
console.log(chalk.red.bold('❌ NO SE PUDO DETERMINAR UN NÚMERO VÁLIDO PARA EL PAIRING CODE.'))
} else {
// Se solicita el codigo con `requestPairingCodeWithTimeout`, que ademas de sanear el
// numero ESPERA a que el socket abra su ventana de pairing. El `setTimeout` ciego de
// 3s que habia antes disparaba la peticion demasiado pronto: el codigo se generaba y
// vinculaba, pero el servidor no lo asociaba a una sesion anunciada y la notificacion
// push nunca llegaba al telefono.
;(async () => {
try {
let codeBot = await requestPairingCodeWithTimeout(conn, addNumber)
codeBot = codeBot?.match(/.{1,4}/g)?.join('-') || codeBot
console.log(chalk.bold.white(' Codigo : ') + chalk.bold.bgMagenta(` ${codeBot} `))
console.log(chalk.bold.hex('#7CFFCB')('📲 Revisa la notificación en tu teléfono o entra a Dispositivos vinculados.'))
} catch (error) {
console.log(chalk.red.bold(`❌ ERROR SOLICITANDO EL CÓDIGO: ${error?.message || error}`))
}
if (process.env.RUBY_SMOKE_PAIRING_CODE) await shutdownDatabaseAndExit(0)
})()
}
}
}
}
let reconnectTimer
let qrExpiryTimer
let qrStopped = false
function clearQrRendering() {
if (qrExpiryTimer) {
clearTimeout(qrExpiryTimer)
qrExpiryTimer = undefined
}
clearNativeQr()
}
function stopQrRendering() {
qrStopped = true
clearQrRendering()
}
async function showQrOnce(qr) {
if (!qr || qrStopped) return
clearQrRendering()
console.log(chalk.hex('#FF66C4')('—🍦ܶ߭ຼ ᪲  ۪  ︵ Escanea el codigo QR aqui ︵ ࣪'))
await printNativeQr(qr)
qrExpiryTimer = setTimeout(() => {
stopQrRendering()
console.log(chalk.hex('#FF66C4')('—🍦 El QR expiró. Reinicia el proceso para generar uno nuevo.'))
}, 40000)
qrExpiryTimer.unref?.()
}
function cleanupTransientSessionState(sessionPath = `./${global.Rubysessions}`) {
try {
if (!existsSync(sessionPath)) return
for (const file of readdirSync(sessionPath)) {
const filePath = join(sessionPath, file)
if (/^(pre-key-|sender-key-|app-state-sync-key-|session-)/.test(file)) {
try { rmSync(filePath, { recursive: true, force: true }) } catch {}
}
}
} catch (error) {
console.error('Error limpiando estado transitorio de sesión:', error)
}
}
async function connectionUpdate(update) {
const { connection, lastDisconnect, isNewLogin, qr, reconnectDelayMs } = update
global.stopped = connection
if (isNewLogin) conn.isInit = true
if (global.db.data == null) loadDatabase()
if ((qr && opcion === '1') || (qr && methodCodeQR)) await showQrOnce(qr)
if (connection === 'open') {
stopQrRendering()
if (pairingRequested && !conn.baileysStore) {
try { conn = global.conn = SimpleSocketService.attachStore(conn) } catch (error) { console.error(error) }
}
conn.__groupEventStartedAt = Date.now()
conn.__groupEventReadyAt = conn.__groupEventStartedAt + 15_000
reconnectAttempt = 0
if (reconnectTimer) {
clearTimeout(reconnectTimer)
reconnectTimer = undefined
}
console.log('\n')
console.log(chalk.bold.hex('#00FF00')('୭ৎ֮֮ BOT CONECTADO CORRECTAMENTE 🪼 ׄ'))
conn.ev.off('messages.upsert', conn.handler)
conn.ev.on('messages.upsert', conn.handler)
import('../commands/ai/ruby_autonomous.js')
.then(mod => mod.attachRubyConn?.(conn))
.catch(e => console.error('[Ruby][attach]', e?.message))
console.log('\n')
}
if (connection === 'close') {
clearQrRendering()
const statusCode = (lastDisconnect?.error)?.output?.statusCode || (lastDisconnect?.error)?.statusCode || DisconnectReason.connectionClosed
const show = (color, text, icon) => console.log(`${icon} ${color(text)}`)
if (DISCONNECT_AUTH_STATUS.has(statusCode)) {
show(chalk.red, `👋 SESION INVALIDA ${statusCode}. BORRE LA CARPETA ${global.Rubysessions} Y VINCULE DE NUEVO`, '🚪')
return
}
const shouldReconnect = RECONNECT_REASONS.has(statusCode) || update.shouldReconnect !== false
if (!shouldReconnect) {
show(chalk.red, `❓ Error desconocido: ${statusCode}. Cerrando proceso para evitar socket zombie.`, '💀')
await shutdownDatabaseAndExit(1, lastDisconnect?.error || new Error(`Baileys close sin reconexión: ${statusCode}`))
return
}
if (reconnectTimer) return
if ([408, 428, 429].includes(Number(statusCode))) cleanupTransientSessionState()
const reconnectDelay = getReconnectDelayMs(reconnectAttempt, statusCode, reconnectDelayMs)
reconnectAttempt += 1
show(chalk.yellow, `🔌 RECONECTANDO EN ${Math.ceil(reconnectDelay / 1000)}S...`, '🔁')
reconnectTimer = setTimeout(async () => {
reconnectTimer = undefined
await global.reloadHandler(true).catch(console.error)
}, reconnectDelay)
reconnectTimer.unref?.()
}
}
async function rubySelfHeal(error, origin) {
try {
const { selfHeal } = await import('../commands/ai/ruby_autonomous.js')
await Promise.race([
selfHeal(error instanceof Error ? error : new Error(String(error)), origin),
new Promise(resolve => setTimeout(resolve, 60000))
])
} catch (e) {
console.error('[Ruby][self-heal-hook]', e?.message)
}
}
process.once('uncaughtException', async error => { await rubySelfHeal(error, 'uncaughtException'); shutdownDatabaseAndExit(0, error) })
process.once('unhandledRejection', async error => { await rubySelfHeal(error, 'unhandledRejection'); shutdownDatabaseAndExit(1, error) })
let isInit = true;
let handler = await import('../router/handler.js')
global.reloadHandler = async function(restatConn) {
try { const Handler = await import(`../router/handler.js?update=${Date.now()}`).catch(console.error); if (Object.keys(Handler || {}).length) handler = Handler } catch (e) { console.error(e); }
if (restatConn) {
const oldChats = global.conn.chats
try { global.conn.ws.close() } catch (e) { }
conn.ev.removeAllListeners()
global.conn = await makeWASocket(connectionOptions, { chats: oldChats, skipStoreBind: pairingRequested && !state.creds?.registered })
setMediaQueueConnection(global.conn)
startMediaWorker(global.conn)
attachSessionState(global.conn, { id: 'primary', type: 'standard', path: global.Rubysessions })
conn = global.conn
isInit = true
}
if (!isInit) { conn.ev.off('messages.upsert', conn.handler); conn.ev.off('messages.update', conn.messagesUpdate); conn.ev.off('group-participants.update', conn.participantsUpdate); conn.ev.off('groups.update', conn.groupsUpdate); conn.ev.off('connection.update', conn.connectionUpdate); conn.ev.off('creds.update', conn.credsUpdate); }
global.conn.__groupEventStartedAt = Date.now()
global.conn.__groupEventReadyAt = global.conn.__groupEventStartedAt + 15_000
conn.handler = handler.handler.bind(global.conn)
conn.participantsUpdate = handler.participantsUpdate.bind(global.conn)
conn.groupsUpdate = handler.groupsUpdate.bind(global.conn)
conn.messagesUpdate = handler.messagesUpdate.bind(global.conn)
conn.connectionUpdate = connectionUpdate.bind(global.conn)
conn.credsUpdate = debouncedSaveCreds
conn.ev.on('messages.upsert', conn.handler)
conn.ev.on('messages.update', conn.messagesUpdate)
conn.ev.on('group-participants.update', conn.participantsUpdate)
conn.ev.on('groups.update', conn.groupsUpdate)
conn.ev.on('connection.update', conn.connectionUpdate)
conn.ev.on('creds.update', conn.credsUpdate)
isInit = false
return true
};
await global.reloadHandler(false)
await restoreSubbots().catch(console.error)
const pluginFolder = global.__dirname(join(__dirname, '../commands/index'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}
global.commandsMap = global.commandsMap || new Map()
async function getPluginFiles(folder, base = folder) {
const entries = await readdir(folder, { withFileTypes: true })
entries.sort((a, b) => a.name.localeCompare(b.name)).sort((a, b) => (b.name === 'enable') - (a.name === 'enable'))
const batches = await Promise.all(entries.map(async (entry) => {
const fullPath = join(folder, entry.name)
const relativePath = fullPath.slice(base.length + 1).replace(/\\/g, '/')
if (entry.isDirectory()) return getPluginFiles(fullPath, base)
return pluginFilter(entry.name) ? [relativePath] : []
}))
return batches.flat()
}
async function watchPluginTree(folder, base = folder) {
const watcherKey = path.resolve(folder)
const oldWatcher = global.__rubyPluginWatchers.get(watcherKey)
if (oldWatcher) {
try { oldWatcher.close?.() } catch {}
global.__rubyPluginWatchers.delete(watcherKey)
}
const watcher = watch(folder, (_ev, filename) => {
if (filename) {
const relativePath = join(folder.slice(base.length), filename.toString()).replace(/^\/+/, '').replace(/\\/g, '/')
global.reload(_ev, relativePath)
} else commandRegistry.init({ force: true }).catch(console.error)
})
global.__rubyPluginWatchers.set(watcherKey, watcher)
const entries = await readdir(folder, { withFileTypes: true })
await Promise.all(entries.filter(entry => entry.isDirectory()).map(entry => watchPluginTree(join(folder, entry.name), base)))
}
async function filesInit() {
const files = (await getPluginFiles(pluginFolder)).filter(pluginFilter)
const batchSize = Number(global.opts?.['plugin-batch-size']) || 24
for (let i = 0; i < files.length; i += batchSize) {
const batch = files.slice(i, i + batchSize)
await Promise.all(batch.map(async (filename) => {
try {
const file = global.__filename(join(pluginFolder, filename))
const module = await import(file)
global.plugins[filename] = module.default || module
registerPluginCommands(filename, global.plugins[filename])
} catch (e) {
conn.logger.error(e)
delete global.plugins[filename]
unregisterPluginCommands(filename)
}
}))
if (i + batchSize < files.length) await new Promise(resolve => setImmediate(resolve))
}
}
commandRegistry.init({ force: true }).catch(console.error);
global.reload = async (_ev, filename) => {
if (pluginFilter(filename)) {
const dir = global.__filename(join(pluginFolder, filename), true);
if (filename in global.plugins) {
try { await access(dir); conn.logger.info(`✨ Plugin actualizado: '${filename}'`) }
catch { conn.logger.warn(`🗑️ Plugin eliminado: '${filename}'`); delete global.plugins[filename]; unregisterPluginCommands(filename); return }
} else conn.logger.info(`✨ Nuevo plugin: '${filename}'`);
try { const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`)); global.plugins[filename] = module.default || module; registerPluginCommands(filename, global.plugins[filename]) } catch (e) { conn.logger.error(`❌ Error sintaxis: '${filename}
${format(e?.stack || e?.message || e)}'`); unregisterPluginCommands(filename) } finally { global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => (b.startsWith('enable/') - a.startsWith('enable/')) || a.localeCompare(b))); await commandRegistry.init({ force: true }); rebuildCommandsMap(global.plugins) }
}
}
Object.freeze(global.reload)
if (global.rubyPluginWatch) watchPluginTree(pluginFolder).catch(console.error)
else console.log(chalk.bold.yellow('🔕 Watchers de plugins desactivados'))
async function isValidPhoneNumber(number) {
const digits = String(number || '').replace(/\D/g, '')
return digits.length >= 8 && digits.length <= 15
}
async function clearTmp() {
const tmpDirectories = [tmpdir(), join(process.cwd(), 'tmp')];
await Promise.all(tmpDirectories.map(async dir => {
try {
await access(dir)
} catch {
return
}
const files = await readdir(dir)
await Promise.all(files.map(async file => {
const filePath = join(dir, file);
try {
const stats = await stat(filePath);
if (stats.isFile() && (Date.now() - stats.mtimeMs > 3 * 60 * 1000)) {
await unlink(filePath);
}
} catch (e) { }
}))
}))
}
async function purgeSession() {
try {
const sessionDir = `./${global.Rubysessions}`;
try {
await access(sessionDir)
} catch {
return
}
const files = await readdir(sessionDir);
await Promise.all(files.map(async file => {
const filePath = join(sessionDir, file);
try {
const stats = await stat(filePath);
if (file.startsWith('pre-key-') && (Date.now() - stats.mtimeMs > 3600000)) {
await unlink(filePath);
}
} catch (e) { }
}))
} catch (e) { console.log("Error en purga de sesión principal:", e); }
}
const tmpCleanerInterval = setInterval(async () => {
await clearTmp()
}, 1000 * 60 * 2)
tmpCleanerInterval.unref()
const sessionCleanerInterval = setInterval(async () => {
await purgeSession()
console.log(chalk.cyanBright(`\n🧹 LIMPIEZA AUTOMÁTICA COMPLETADA: TMP, PRE-KEYS Y SESIONES\n`))
}, 1000 * 60 * 60)
sessionCleanerInterval.unref()
