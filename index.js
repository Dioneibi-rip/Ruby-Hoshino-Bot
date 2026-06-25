process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import { watchFile, unwatchFile, readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, rmSync, watch } from 'fs'
import * as ws from 'ws'
import cfonts from 'cfonts'
import path, { join, dirname } from 'path'
import yargs from 'yargs'
import { spawn } from 'child_process'
import lodash from 'lodash'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import { tmpdir } from 'os'
import { format } from 'util'
import boxen from 'boxen'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { useSQLiteAuthState, createManagerDatabase } from '@nevi-dev/sqlite-auth'
import SQLiteDatabase from './lib/database.js'
import store from './lib/store.js'
import readline, { createInterface } from 'readline'
import { EventEmitter } from 'events'
import { attachSessionState, createMessageRetryCache } from './src/core/session-manager.js'
import { startMonitor } from './src/core/stability-monitor.js'
import { rebuildCommandsMap, registerPluginCommands, unregisterPluginCommands } from './src/core/handler-utils.js'
EventEmitter.defaultMaxListeners = 100
const { proto } = (await import('@whiskeysockets/baileys')).default
const { DisconnectReason, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser } = await import('@whiskeysockets/baileys')
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const { CONNECTING } = ws
const { chain } = lodash
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') { return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString(); };
global.__dirname = function dirname(pathURL) { return path.dirname(global.__filename(pathURL, true)) };
global.__require = function createLocalRequire(dir = import.meta.url) { return createRequire(dir) }
// Carga obligatoria de configuraciones globales antes de handler.js y antes de leer plugins/.
await import('./settings.js')
global.timestamp = {start: new Date}
const __dirname = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.__bannerShown = false
global.prefix = new RegExp('^[#/!.]')
global.db = new SQLiteDatabase(opts['db'] || './src/database/database.sqlite')
global.DATABASE = global.db
let databaseShutdownStarted = false
global.authCredsFlushers ||= new Set()
// Este plugin se importa después de settings.js para que encuentre global.* disponible.
const { RubyJadiBot } = await import('./plugins/subbots/jadibot-serbot.js')
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
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⣿⠀⠘⣾⣧⠀⠻⣿⠀⠂⠉⣙⠛⠛⣩⣴⣿⠋⢀⠿⣷⢸⣿⡿⠀⢸⣿⣿⡏⠁⠀⠀⣤⣤⣤⣽⣷⡌⣧⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠘⠇⠀⠈⢿⣷⡀⠈⠁⠀⠀⠘⢷⣦⣬⣉⠉⢀⡀⠀⠉⠘⠛⠁⣀⡘⠛⠛⠗⢀⠎⠀⣉⣉⣩⣤⣴⣇⢹⡆⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⣿⣿⣿⡇⠠⣴⣶⣶⣾⣶⠀⠃⠀⠛⣳⠄⠙⠀⠀⠀⠀⠙⠿⠁⠀⠀⠄⠀⠀⠀⠀⢀⣩⣿⣿⡿⡇⠀⣠⠞⠉⢀⣬⣽⣿⡿⢸⣷⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿⢃⡉⣿⣿⣿⣵⣶⣦⡀⠀⠀⠹⣧⡀⠀⠁⠄⠀⠀⠀⠀⠐⠄⠀⠀⠀⢠⣾⣿⣿⣿⣿⣿⣇⠰⡘⢠⣾⡿⣿⣿⡿⢁⣾⣿⡆⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⡟⣾⢧⡙⣿⣿⣿⣿⣿⣿⡄⠀⠀⠘⣿⣄⠀⠠⠀⠀⢠⠀⡀⠀⠀⢀⣴⣿⣿⣿⣿⣿⣿⣿⡿⡄⣧⣸⡿⠀⣿⣿⢃⣾⣿⣿⡇⠀
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
console.log(chalk.bold.hex('#FF66C4')('—🍦ܶ߭ຼ ᪲  ۪  ︵ “Cada comienzo es una nueva oportunidad. Gracias por elegirme, daré lo mejor de mí para ayudarte.” ︵ ࣪'))
cfonts.say('Ruby hoshino Bot', { font: 'chrome', align: 'center', gradient: ['#ff4fcb', '#ff77ff'], transition: true, env: 'node' })
console.log(boxen(chalk.bold.hex('#9900ff')('୨୧ㅤ۫ Proyecto iniciado con Exito. .ᐟ'), { padding: 1, margin: 1, borderStyle: 'double', borderColor: 'magenta', float: 'center' }))
}
showBanner()
global.loadDatabase = async function loadDatabase() {
if (global.db.READ) { return new Promise((resolve) => setInterval(async function() { if (!global.db.READ) { clearInterval(this); resolve(global.db.data == null ? global.loadDatabase() : global.db.data); } }, 1 * 1000)) }
if (global.db.data !== null) {
  global.db.chain ||= chain(global.db.data)
  return global.db.data
}
global.db.READ = true
await global.db.read().catch(console.error)
global.db.READ = null
global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, ...(global.db.data || {}) }
global.db.chain = chain(global.db.data)
return global.db.data
}
global.saveDatabase = async function saveDatabase() {
if (!global.db) return false
if (global.db.READ) await global.loadDatabase()
if (typeof global.db.write === 'function') await global.db.write()
if (typeof global.db.flush === 'function') global.db.flush()
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
async function shutdownDatabaseAndExit(code, error) {
if (databaseShutdownStarted) return
databaseShutdownStarted = true
if (error) console.error(error)
try {
clearInterval(databaseAutosaveInterval)
await Promise.all([...global.authCredsFlushers].map(flush => flush()))
await global.saveDatabase()
if (typeof global.db?.close === 'function') global.db.close()
} catch (saveError) {
console.error(saveError)
code = 1
}
process.exit(code)
}
process.once('SIGINT', () => shutdownDatabaseAndExit(0))
process.once('SIGTERM', () => shutdownDatabaseAndExit(0))
protoType()
serialize()
const { state, saveCreds } = useSQLiteAuthState(`./${global.Rubysessions}`, { dbName: 'auth.db', cleanOldFiles: true })
const debouncedSaveCreds = createDebouncedSaveCreds(() => saveCreds.call(global.conn, true))
global.authCredsFlushers.add(debouncedSaveCreds.flush)
global.authManagerDb = createManagerDatabase({ dbPath: `./${global.Rubysessions}/system.db`, tableName: 'bot_registry' })
const msgRetryCounterMap = (MessageRetryMap) => { };
const msgRetryCounterCache = createMessageRetryCache()
const { version } = await fetchLatestBaileysVersion();
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
╭━━${lineM}━━╮
┃ ${chalk.bold.cyanBright('╔════❖•ೋ° ¡HOLA USUARIO! °ೋ•❖════╗')}
┃ ${chalk.bold.cyanBright('║')}    ${chalk.bold.greenBright('SELECCIONA TU MÉTODO DE CONEXIÓN')}
┃ ${chalk.bold.cyanBright('╚════❖•ೋ° ❀ RUBY-Bot ❀ °ೋ•❖════╝')}
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
const RECONNECT_REASONS = new Set([DisconnectReason.connectionLost, DisconnectReason.connectionClosed, DisconnectReason.restartRequired, DisconnectReason.connectionReplaced])
const DISCONNECT_AUTH_STATUS = new Set([401, 403, DisconnectReason.loggedOut])
const RECONNECT_BASE_DELAY_MS = 5000
const RECONNECT_MAX_DELAY_MS = 60000
let reconnectAttempt = 0
const socketCfg = global.baileysSocketConfig || {}
const connectionOptions = {
logger: pino({ level: 'silent' }),
printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
mobile: MethodMobile,
browser: ['Ubuntu', 'Chrome', '114.0.5735.198'],
auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })), },
markOnlineOnConnect: true,
generateHighQualityLinkPreview: true,
getMessage: async (clave) => { let jid = jidNormalizedUser(clave.remoteJid); let msg = await store.loadMessage(jid, clave.id); return msg?.message || "" },
msgRetryCounterCache,
msgRetryCounterMap,
defaultQueryTimeoutMs: socketCfg.defaultQueryTimeoutMs ?? 60000,
version,
syncFullHistory: false,
connectTimeoutMs: socketCfg.connectTimeoutMs ?? 20000,
keepAliveIntervalMs: socketCfg.keepAliveIntervalMs ?? 30000,
retryRequestDelayMs: socketCfg.retryRequestDelayMs ?? 250,
shouldReconnect: ({ statusCode }) => !DISCONNECT_AUTH_STATUS.has(statusCode) && (RECONNECT_REASONS.has(statusCode) || statusCode !== DisconnectReason.loggedOut)
}
global.conn = makeWASocket(connectionOptions);
attachSessionState(global.conn, { id: 'primary', type: 'standard', path: global.Rubysessions })
let conn = global.conn
conn.isInit = false;
conn.well = false;
if (!state.creds?.registered) {
if (opcion === '2' || methodCode) {
opcion = '2'
if (!conn.authState.creds.registered) {
let addNumber
if (!!phoneNumber) { addNumber = phoneNumber.replace(/[^0-9]/g, '') } else {
do {
phoneNumber = await question(chalk.bold.hex('#A020F0')(`\n📞 INGRESE SU NÚMERO DE WHATSAPP\n${chalk.white('Ejemplo: 5219999999999')}\n${chalk.yellow('➜ ')}`));
phoneNumber = phoneNumber.replace(/\D/g, '');
if (!phoneNumber.startsWith('+')) { phoneNumber = `+${phoneNumber}` }
} while (!await isValidPhoneNumber(phoneNumber))
rl.close()
addNumber = phoneNumber.replace(/\D/g, '')
setTimeout(async () => {
let codeBot = await conn.requestPairingCode(addNumber);
codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
console.log(boxen(chalk.bold.white(' Codigo : ') + chalk.bold.bgMagenta(` ${codeBot} `), { borderStyle: 'round', borderColor: 'magenta', padding: 1, margin: 1, title: '👾 VINCULACION', titleAlignment: 'center' }))
}, 3000)
}
}
}
}
let reconnectTimer
async function connectionUpdate(update) {
const { connection, lastDisconnect, isNewLogin, qr, reconnectDelayMs } = update
global.stopped = connection
if (isNewLogin) conn.isInit = true
if (global.db.data == null) loadDatabase()
if ((qr && opcion === '1') || methodCodeQR) {
console.log(boxen(chalk.hex('#FF66C4')('—🍦ܶ߭ຼ ᪲  ۪  ︵ Escanea el codigo QR aqui ︵ ࣪'), { padding: 1, borderStyle: 'classic', borderColor: 'magenta' }))
}
if (connection === 'open') {
reconnectAttempt = 0
if (reconnectTimer) {
clearTimeout(reconnectTimer)
reconnectTimer = undefined
}
console.log('\n')
console.log(boxen(chalk.bold.hex('#00FF00')('୭ৎ֮֮ BOT CONECTADO CORRECTAMENTE 🪼 ׄ'), { padding: 1, borderStyle: 'double', borderColor: 'green', title: '✅ 𝖤𝖷𝖨𝖳𝖮', titleAlignment: 'center' }))
console.log('\n')
}
if (connection === 'close') {
const statusCode = (lastDisconnect?.error)?.output?.statusCode || (lastDisconnect?.error)?.statusCode || DisconnectReason.connectionClosed
const show = (color, text, icon) => console.log(boxen(color(text), { padding: 1, borderStyle: 'round', borderColor: 'red', title: icon, titleAlignment: 'center' }))
if (DISCONNECT_AUTH_STATUS.has(statusCode)) {
show(chalk.red, `👋 SESION INVALIDA ${statusCode}. BORRE LA CARPETA ${global.Rubysessions} Y VINCULE DE NUEVO`, '🚪')
return
}
const shouldReconnect = RECONNECT_REASONS.has(statusCode) || update.shouldReconnect !== false
if (!shouldReconnect) {
show(chalk.red, `❓ Error desconocido: ${statusCode}`, '💀')
return
}
if (reconnectTimer) return
const reconnectDelay = Math.min(Math.max(reconnectDelayMs || 0, RECONNECT_BASE_DELAY_MS * Math.max(1, reconnectAttempt + 1)), RECONNECT_MAX_DELAY_MS)
reconnectAttempt += 1
show(chalk.yellow, `🔌 RECONECTANDO EN ${Math.ceil(reconnectDelay / 1000)}S...`, '🔁')
reconnectTimer = setTimeout(async () => {
reconnectTimer = undefined
await global.reloadHandler(true).catch(console.error)
}, reconnectDelay)
reconnectTimer.unref?.()
}
}
process.once('uncaughtException', error => shutdownDatabaseAndExit(1, error))
process.on('unhandledRejection', console.error)
startMonitor()
let isInit = true;
let handler = await import('./handler.js')
global.reloadHandler = async function(restatConn) {
try { const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error); if (Object.keys(Handler || {}).length) handler = Handler } catch (e) { console.error(e); }
if (restatConn) {
const oldChats = global.conn.chats
try { global.conn.ws.close() } catch (e) { }
conn.ev.removeAllListeners()
global.conn = makeWASocket(connectionOptions, { chats: oldChats })
attachSessionState(global.conn, { id: 'primary', type: 'standard', path: global.Rubysessions })
conn = global.conn
isInit = true
}
if (!isInit) { conn.ev.off('messages.upsert', conn.handler); conn.ev.off('connection.update', conn.connectionUpdate); conn.ev.off('creds.update', conn.credsUpdate); }
conn.handler = handler.handler.bind(global.conn)
conn.connectionUpdate = connectionUpdate.bind(global.conn)
conn.credsUpdate = debouncedSaveCreds
conn.ev.on('messages.upsert', conn.handler)
conn.ev.on('connection.update', conn.connectionUpdate)
conn.ev.on('creds.update', conn.credsUpdate)
isInit = false
return true
};
await global.reloadHandler(false)
global.rutaJadiBot = join(__dirname, './RubyJadiBots')
if (global.RubyJadibts || true) {
if (!existsSync(global.rutaJadiBot)) {
mkdirSync(global.rutaJadiBot, { recursive: true });
console.log(chalk.bold.cyan(`✅ Carpeta de sub-Bots creada`))
} else {
console.log(chalk.bold.cyan(`✨ Cargando sub-Bots...`))
}
const readRutaJadiBot = readdirSync(global.rutaJadiBot)
if (readRutaJadiBot.length > 0) {
const sessionMarkers = new Set(['creds.json', 'auth.db'])
const subBotPaths = readRutaJadiBot
.map(gjbts => join(global.rutaJadiBot, gjbts))
.filter(botPath => {
try { return statSync(botPath).isDirectory() && readdirSync(botPath).some(file => sessionMarkers.has(file)) }
catch (e) { return false }
})
const batchSize = Math.max(1, Number(global.subBotLoadBatch || 3))
for (let i = 0; i < subBotPaths.length; i += batchSize) {
const batch = subBotPaths.slice(i, i + batchSize)
await Promise.all(batch.map(async (botPath) => {
try {
await RubyJadiBot({ pathRubyJadiBot: botPath, m: null, conn, args: '', usedPrefix: '/', command: 'serbot' })
} catch(e) {
console.log(chalk.red('Error cargando subbot:'), e)
}
}))
if (i + batchSize < subBotPaths.length) await new Promise(resolve => setTimeout(resolve, 500))
}
}
}
const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}
global.commandsMap = global.commandsMap || new Map()
function getPluginFiles(folder, base = folder) {
return readdirSync(folder, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).sort((a, b) => (b.name === 'enable') - (a.name === 'enable')).flatMap((entry) => {
const fullPath = join(folder, entry.name)
const relativePath = fullPath.slice(base.length + 1).replace(/\\/g, '/')
if (entry.isDirectory()) return getPluginFiles(fullPath, base)
return pluginFilter(entry.name) ? [relativePath] : []
})
}
function watchPluginTree(folder, base = folder) {
watch(folder, (_ev, filename) => {
if (filename) {
const relativePath = join(folder.slice(base.length), filename.toString()).replace(/^\/+/, '').replace(/\\/g, '/')
global.reload(_ev, relativePath)
} else filesInit().then(() => Object.keys(global.plugins)).catch(console.error)
})
for (const entry of readdirSync(folder, { withFileTypes: true })) {
if (entry.isDirectory()) watchPluginTree(join(folder, entry.name), base)
}
}
async function filesInit() {
for (const filename of getPluginFiles(pluginFolder).filter(pluginFilter)) {
try { const file = global.__filename(join(pluginFolder, filename)); const module = await import(file); global.plugins[filename] = module.default || module; registerPluginCommands(filename, global.plugins[filename]) } catch (e) { conn.logger.error(e); delete global.plugins[filename]; unregisterPluginCommands(filename) }
}
}
filesInit().then((_) => rebuildCommandsMap(global.plugins)).catch(console.error);
global.reload = async (_ev, filename) => {
if (pluginFilter(filename)) {
const dir = global.__filename(join(pluginFolder, filename), true);
if (filename in global.plugins) {
if (existsSync(dir)) conn.logger.info(`✨ Plugin actualizado: '${filename}'`)
else { conn.logger.warn(`🗑️ Plugin eliminado: '${filename}'`); delete global.plugins[filename]; unregisterPluginCommands(filename); return }
} else conn.logger.info(`✨ Nuevo plugin: '${filename}'`);
const err = syntaxerror(readFileSync(dir), filename, { sourceType: 'module', allowAwaitOutsideFunction: true, });
if (err) conn.logger.error(`❌ Error sintaxis: '${filename}'
${format(err)}`)
else {
try { const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`)); global.plugins[filename] = module.default || module; registerPluginCommands(filename, global.plugins[filename]) } catch (e) { conn.logger.error(`❌ Error sintaxis: '${filename}
${format(e)}'`); unregisterPluginCommands(filename) } finally { global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => (b.startsWith('enable/') - a.startsWith('enable/')) || a.localeCompare(b))); rebuildCommandsMap(global.plugins) }
}
}
}
Object.freeze(global.reload)
watchPluginTree(pluginFolder)
async function isValidPhoneNumber(number) {
try {
number = number.replace(/\s+/g, '')
if (number.startsWith('+521')) { number = number.replace('+521', '+52'); } else if (number.startsWith('+52') && number[4] === '1') { number = number.replace('+52 1', '+52'); }
const parsedNumber = phoneUtil.parseAndKeepRawInput(number)
return phoneUtil.isValidNumber(parsedNumber)
} catch (error) { return false }
}
function clearTmp() {
const tmpDirectories = [tmpdir(), join(__dirname, './tmp')];
tmpDirectories.forEach(dir => {
if (!existsSync(dir)) return;
readdirSync(dir).forEach(file => {
const filePath = join(dir, file);
try {
const stats = statSync(filePath);
if (stats.isFile() && (Date.now() - stats.mtimeMs > 3 * 60 * 1000)) {
unlinkSync(filePath);
}
} catch (e) { }
});
});
}
function purgeSession() {
try {
const sessionDir = `./${global.Rubysessions}`;
if (!existsSync(sessionDir)) return;
const files = readdirSync(sessionDir);
files.forEach(file => {
const filePath = join(sessionDir, file);
try {
const stats = statSync(filePath);
if (file.startsWith('pre-key-') && (Date.now() - stats.mtimeMs > 3600000)) {
unlinkSync(filePath);
}
} catch (e) { }
});
} catch (e) { console.log("Error en purga de sesión principal:", e); }
}
function purgeSessionSB() {
try {
const jadiDir = global.rutaJadiBot;
if (!existsSync(jadiDir)) return;
const listaDirectorios = readdirSync(jadiDir);
listaDirectorios.forEach(directorio => {
const subBotPath = join(jadiDir, directorio);
if (statSync(subBotPath).isDirectory()) {
const files = readdirSync(subBotPath);
files.forEach(file => {
const filePath = join(subBotPath, file);
try {
const stats = statSync(filePath);
if (file.startsWith('pre-key-') && (Date.now() - stats.mtimeMs > 3600000)) {
unlinkSync(filePath);
}
} catch (e) { }
});
}
});
} catch (e) { console.log("Error en purga de Sub-Bots:", e); }
}
const tmpCleanerInterval = setInterval(async () => {
await clearTmp()
}, 1000 * 60 * 2)
tmpCleanerInterval.unref()
const sessionCleanerInterval = setInterval(async () => {
await purgeSession()
await purgeSessionSB()
console.log(chalk.cyanBright(`\n🧹 LIMPIEZA AUTOMÁTICA COMPLETADA: TMP, PRE-KEYS Y SESIONES\n`))
}, 1000 * 60 * 60)
sessionCleanerInterval.unref()
