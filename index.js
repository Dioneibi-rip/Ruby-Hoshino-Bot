process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './settings.js'
import { setupMaster, fork } from 'cluster'
import { watchFile, unwatchFile } from 'fs'
import cfonts from 'cfonts'
import {createRequire} from 'module'
import {fileURLToPath, pathToFileURL} from 'url'
import {platform} from 'process'
import * as ws from 'ws'
import fs, {readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, rmSync, watch} from 'fs'
import yargs from 'yargs'
import {spawn} from 'child_process'
import lodash from 'lodash'
import { RubyJadiBot } from './plugins/jadibot-serbot.js'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import {tmpdir} from 'os'
import {format} from 'util'
import boxen from 'boxen'
import P from 'pino'
import pino from 'pino'
import Pino from 'pino'
import path, { join, dirname } from 'path'
import {Boom} from '@hapi/boom'
import {makeWASocket, protoType, serialize} from './lib/simple.js'
import {Low, JSONFile} from 'lowdb'
import {mongoDB, mongoDBV2} from './lib/mongoDB.js'
import store from './lib/store.js'
const {proto} = (await import('@whiskeysockets/baileys')).default
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const {DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser} = await import('@whiskeysockets/baileys')
import readline, { createInterface } from 'readline'
import NodeCache from 'node-cache'
import { EventEmitter } from 'events'

EventEmitter.defaultMaxListeners = 100
process.setMaxListeners(100)

const {CONNECTING} = ws
const {chain} = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

protoType()
serialize()

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
}; global.__dirname = function dirname(pathURL) {
return path.dirname(global.__filename(pathURL, true))
}; global.__require = function require(dir = import.meta.url) {
return createRequire(dir)
}

global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({...query, ...(apikeyqueryname ? {[apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name]} : {})})) : '');
global.timestamp = {start: new Date}
const __dirname = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[#/!.]')
global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile('./src/database/database.json'))
global.DATABASE = global.db 

global.loadDatabase = async function loadDatabase() {
if (global.db.READ) {
return new Promise((resolve) => setInterval(async function() {
if (!global.db.READ) {
clearInterval(this)
resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
}}, 1 * 1000))
}
if (global.db.data !== null) return
global.db.READ = true
await global.db.read().catch(console.error)
global.db.READ = null
global.db.data = {
users: {},
chats: {},
stats: {},
msgs: {},
sticker: {},
settings: {},
...(global.db.data || {}),
}
global.db.chain = chain(global.db.data)
}
loadDatabase()

const {state, saveState, saveCreds} = await useMultiFileAuthState(global.Rubysessions)
const msgRetryCounterMap = (MessageRetryMap) => { };
const msgRetryCounterCache = new NodeCache()
const {version} = await fetchLatestBaileysVersion();
let phoneNumber = global.botNumber

const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")
const MethodMobile = process.argv.includes("mobile")
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

let opcion
if (methodCodeQR) {
opcion = '1'
}
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${Rubysessions}/creds.json`)) {
do {
opcion = await question(chalk.bgMagenta.white('⌨ Seleccione una opción:\n') + chalk.bold.green('1. Con código QR\n') + chalk.bold.cyan('2. Con código de texto de 8 dígitos\n--> '))
if (!/^[1-2]$/.test(opcion)) {
console.log(chalk.bold.redBright(`✦ Opción inválida.`))
}} while (opcion !== '1' && opcion !== '2')
} 

console.info = () => {} 
console.debug = () => {} 

const connectionOptions = {
logger: pino({ level: 'silent' }),
printQRInTerminal: opcion == '1' || methodCodeQR,
mobile: MethodMobile, 
browser: opcion == '1' ? [`${nameqr}`, 'Edge', '20.0.04'] : ['Ubuntu', 'Edge', '110.0.1587.56'],
auth: {
creds: state.creds,
keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
},
markOnlineOnConnect: true, 
generateHighQualityLinkPreview: true, 
getMessage: async (clave) => {
let jid = jidNormalizedUser(clave.remoteJid)
let msg = await store.loadMessage(jid, clave.id)
return msg?.message || ""
},
msgRetryCounterCache,
msgRetryCounterMap,
defaultQueryTimeoutMs: undefined,
version,
}

global.conn = makeWASocket(connectionOptions);

if (!fs.existsSync(`./${Rubysessions}/creds.json`)) {
if (opcion === '2' || methodCode) {
opcion = '2'
if (!conn.authState.creds.registered) {
let addNumber
if (!!phoneNumber) {
addNumber = phoneNumber.replace(/[^0-9]/g, '')
} else {
do {
phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright(`✦ Ingrese el número de WhatsApp.\n${chalk.bold.yellowBright(`✏  Ejemplo: 57321×××××××`)}\n${chalk.bold.magentaBright('---> ')}`)))
phoneNumber = phoneNumber.replace(/\D/g,'')
} while (!await isValidPhoneNumber(phoneNumber))
rl.close()
addNumber = phoneNumber.replace(/\D/g, '')
}
setTimeout(async () => {
if (conn.ws && conn.ws.readyState === ws.OPEN) {
let codeBot = await conn.requestPairingCode(addNumber)
codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot
console.log(chalk.bold.white(chalk.bgMagenta(`✧ CÓDIGO DE VINCULACIÓN ✧`)), chalk.bold.white(chalk.white(codeBot)))
}
}, 5000)
}}}

conn.isInit = false;
conn.well = false;

if (!opts['test']) {
if (global.db) setInterval(async () => {
if (global.db.data) await global.db.write()
}, 30 * 1000);
}

async function connectionUpdate(update) {
const {connection, lastDisconnect, isNewLogin, qr} = update;
global.stopped = connection;
if (isNewLogin) conn.isInit = true;
if (qr && (opcion == '1' || methodCodeQR)) {
console.log(chalk.bold.yellow(`\n❐ ESCANEA EL CÓDIGO QR`))
}
if (connection == 'open') {
console.log(chalk.bold.green('\n❀ Ruby-Bot Conectada con éxito ❀'))
}
if (connection === 'close') {
let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
if (reason === DisconnectReason.badSession) {
console.log(chalk.bold.red(`\n⚠ Sesión corrupta, borre ${global.Rubysessions}`))
} else if (reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost) {
await global.reloadHandler(true)
} else if (reason === DisconnectReason.loggedOut) {
console.log(chalk.bold.red(`\n⚠ Sesión cerrada.`))
} else {
await global.reloadHandler(true)
}}
}

process.on('uncaughtException', console.error)

let isInit = true;
let handler = await import('./handler.js')
global.reloadHandler = async function(restatConn) {
try {
const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
if (Object.keys(Handler || {}).length) handler = Handler
} catch (e) {
console.error(e);
}
if (restatConn) {
try { global.conn.ws.close() } catch { }
conn.ev.removeAllListeners()
global.conn = makeWASocket(connectionOptions)
isInit = true
}
if (!isInit) {
conn.ev.off('messages.upsert', conn.handler)
conn.ev.off('connection.update', conn.connectionUpdate)
conn.ev.off('creds.update', conn.credsUpdate)
}
conn.handler = handler.handler.bind(global.conn)
conn.connectionUpdate = connectionUpdate.bind(global.conn)
conn.credsUpdate = saveCreds.bind(global.conn, true)
conn.ev.on('messages.upsert', conn.handler)
conn.ev.on('connection.update', conn.connectionUpdate)
conn.ev.on('creds.update', conn.credsUpdate)
isInit = false
return true
};

global.rutaJadiBot = join(__dirname, './RubyJadiBots')
if (global.RubyJadibts) {
if (!existsSync(global.rutaJadiBot)) mkdirSync(global.rutaJadiBot, { recursive: true })
const readRutaJadiBot = readdirSync(rutaJadiBot)
if (readRutaJadiBot.length > 0) {
for (const gjbts of readRutaJadiBot) {
const botPath = join(rutaJadiBot, gjbts)
if (readdirSync(botPath).includes('creds.json')) {
RubyJadiBot({pathRubyJadiBot: botPath, m: null, conn, args: '', usedPrefix: '/', command: 'serbot'})
}
}
}
}

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}
async function filesInit() {
for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
try {
const file = global.__filename(join(pluginFolder, filename))
const module = await import(file)
global.plugins[filename] = module.default || module
} catch (e) {
console.error(e)
delete global.plugins[filename]
}}}
filesInit().then(() => console.log(chalk.bold.green('✦ Plugins cargados'))).catch(console.error);

global.reload = async (_ev, filename) => {
if (pluginFilter(filename)) {
const dir = global.__filename(join(pluginFolder, filename), true);
if (filename in global.plugins) {
if (!existsSync(dir)) return delete global.plugins[filename]
}
const err = syntaxerror(readFileSync(dir), filename, { sourceType: 'module', allowAwaitOutsideFunction: true });
if (!err) {
try {
const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
global.plugins[filename] = module.default || module;
} catch (e) { console.error(e) }
}
}}
watch(pluginFolder, global.reload)
await global.reloadHandler()

function clearTmp() {
const tmpDir = join(__dirname, 'tmp')
if (existsSync(tmpDir)) {
readdirSync(tmpDir).forEach(file => unlinkSync(join(tmpDir, file)))
}
}

function purgeRubySession() {
let directorio = readdirSync(`./${Rubysessions}`)
directorio.filter(file => file.startsWith('pre-key-')).forEach(file => unlinkSync(`./${Rubysessions}/${file}`))
} 

setInterval(async () => {
if (global.stopped === 'close' || !conn || !conn.user) return
clearTmp()
}, 1000 * 60 * 4)

setInterval(async () => {
if (global.stopped === 'close' || !conn || !conn.user) return
purgeRubySession()
}, 1000 * 60 * 10)

async function isValidPhoneNumber(number) {
try {
number = number.replace(/\s+/g, '')
if (number.startsWith('+521')) number = number.replace('+521', '+52')
const parsedNumber = phoneUtil.parseAndKeepRawInput(number)
return phoneUtil.isValidNumber(parsedNumber)
} catch { return false }
}

cfonts.say('Ruby Hoshino', { font: 'chrome', align: 'center', gradient: ['#ff4fcb', '#ff77ff'] })
console.log(chalk.magenta('══════════════════════════════════════════════════'))
console.log(chalk.white('      NÚCLEO ACTIVO - LISTO PARA TRABAJAR'))
console.log(chalk.magenta('══════════════════════════════════════════════════\n'))