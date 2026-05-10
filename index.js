process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
import './settings.js'
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
import { Low, JSONFile } from 'lowdb'
import { mongoDB, mongoDBV2 } from './lib/mongoDB.js'
import store from './lib/store.js'
import NodeCache from 'node-cache'
import readline, { createInterface } from 'readline'
import { RubyJadiBot } from './plugins/jadibot-serbot.js'
import { EventEmitter } from 'events'
EventEmitter.defaultMaxListeners = 100 
const { proto } = (await import('@whiskeysockets/baileys')).default
const { DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser } = await import('@whiskeysockets/baileys')
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const { CONNECTING } = ws
const { chain } = lodash
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') { return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString(); };
global.__dirname = function dirname(pathURL) { return path.dirname(global.__filename(pathURL, true)) };
global.__require = function require(dir = import.meta.url) { return createRequire(dir) }
global.timestamp = {start: new Date}
const __dirname = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.__bannerShown = false
global.prefix = new RegExp('^[#/!.]')
global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new mongoDB(opts['db']) : new JSONFile('./src/database/database.json'))
global.DATABASE = global.db
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
if (global.db.data !== null) return
global.db.READ = true
await global.db.read().catch(console.error)
global.db.READ = null
global.db.data = { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, ...(global.db.data || {}), }
global.db.chain = chain(global.db.data)
}
loadDatabase()
protoType()
serialize()
const { state, saveState, saveCreds } = await useMultiFileAuthState(global.Rubysessions)
const msgRetryCounterMap = (MessageRetryMap) => { };
const msgRetryCounterCache = new NodeCache()
const { version } = await fetchLatestBaileysVersion();
let phoneNumber = global.botNumber
const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")
const MethodMobile = process.argv.includes("mobile")
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => { rl.clearLine(rl.input, 0); return new Promise((resolver) => { rl.question(texto, (respuesta) => { rl.clearLine(rl.input, 0); resolver(respuesta.trim()) }) }) }
let opcion
if (methodCodeQR) { opcion = '1' }
if (!methodCodeQR && !methodCode && !existsSync(`./${Rubysessions}/creds.json`)) {
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
} while (opcion !== '1' && opcion !== '2' || existsSync(`./${Rubysessions}/creds.json`))
}
const socketCfg = global.baileysSocketConfig || {}
const connectionOptions = {
logger: pino({ level: 'silent' }), 
printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
mobile: MethodMobile,
browser: ['Mac OS', 'Safari', '10.15.7'], 
auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })), },
markOnlineOnConnect: true,
generateHighQualityLinkPreview: true,
getMessage: async (clave) => { let jid = jidNormalizedUser(clave.remoteJid); let msg = await store.loadMessage(jid, clave.id); return msg?.message || "" },
msgRetryCounterCache,
msgRetryCounterMap,
defaultQueryTimeoutMs: socketCfg.defaultQueryTimeoutMs ?? 30000,
version,
syncFullHistory: false,
connectTimeoutMs: socketCfg.connectTimeoutMs ?? 45000,
keepAliveIntervalMs: socketCfg.keepAliveIntervalMs ?? 20000,
retryRequestDelayMs: socketCfg.retryRequestDelayMs ?? 1500
}
global.conn = makeWASocket(connectionOptions);
let conn = global.conn
conn.isInit = false;
conn.well = false;
if (!existsSync(`./${Rubysessions}/creds.json`)) {
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
async function connectionUpdate(update) {
const { connection, lastDisconnect, isNewLogin, qr } = update
global.stopped = connection
if (isNewLogin) conn.isInit = true
const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
await global.reloadHandler(true).catch(console.error)
global.timestamp.connect = new Date()
}
if (global.db.data == null) loadDatabase()
if ((qr && opcion === '1') || methodCodeQR) {
console.log(boxen(chalk.hex('#FF66C4')('—🍦ܶ߭ຼ ᪲  ۪  ︵ Escanea el codigo QR aqui ︵ ࣪'), { padding: 1, borderStyle: 'classic', borderColor: 'magenta' }))
}
if (connection === 'open') {
console.log('\n')
console.log(boxen(chalk.bold.hex('#00FF00')('୭ৎ֮֮ BOT CONECTADO CORRECTAMENTE 🪼 ׄ'), { padding: 1, borderStyle: 'double', borderColor: 'green', title: '✅ 𝖤𝖷𝖨𝖳𝖮', titleAlignment: 'center' }))
console.log('\n')
}
if (connection === 'close') {
const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
const show = (color, text, icon) => console.log(boxen(color(text), { padding: 1, borderStyle: 'round', borderColor: 'red', title: icon, titleAlignment: 'center' }))
switch (reason) {
case DisconnectReason.badSession: show(chalk.red, `⚠️ SESION CORRUPTA, BORRE LA CARPETA ${global.Rubysessions}`, '❌ 𝖤𝖱𝖱𝖮𝖱'); await global.reloadHandler(true).catch(console.error); break
case DisconnectReason.connectionClosed: show(chalk.yellow, '🔌 CONEXION CERRADA, RECONECTANDO...', '🔁'); await global.reloadHandler(true).catch(console.error); break
case DisconnectReason.connectionLost: show(chalk.blue, '📡 SEÑAL PERDIDA DEL SERVIDOR...', '⚠️'); await global.reloadHandler(true).catch(console.error); break
case DisconnectReason.connectionReplaced: show(chalk.magenta, '💻 SESION ABIERTA EN OTRA PARTE', '🚫'); break
case DisconnectReason.loggedOut: show(chalk.red, `👋 SESION CERRADA BORRE LA CARPETA ${global.Rubysessions}`, '🚪'); await global.reloadHandler(true).catch(console.error); break
case DisconnectReason.restartRequired: show(chalk.cyan, '🔄 REINICIO NECESARIO...', '♻️'); await global.reloadHandler(true).catch(console.error); break
case DisconnectReason.timedOut: show(chalk.yellow, '⏳ TIEMPO AGOTADO...', '⏱️'); await global.reloadHandler(true).catch(console.error); break
default: show(chalk.red, `❓ 𝖤𝗋𝗋𝗈𝗋 𝖽𝖾𝗌𝖼𝗈𝗇𝗈𝖼𝗂𝖽𝗈: ${reason}`, '💀'); break
}
}
}
process.on('uncaughtException', console.error)
let isInit = true;
let handler = await import('./handler.js')
global.reloadHandler = async function(restatConn) {
try { const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error); if (Object.keys(Handler || {}).length) handler = Handler } catch (e) { console.error(e); }
if (restatConn) {
const oldChats = global.conn.chats
try { global.conn.ws.close() } catch { }
conn.ev.removeAllListeners()
global.conn = makeWASocket(connectionOptions, { chats: oldChats })
conn = global.conn
isInit = true
}
if (!isInit) { conn.ev.off('messages.upsert', conn.handler); conn.ev.off('connection.update', conn.connectionUpdate); conn.ev.off('creds.update', conn.credsUpdate); }
conn.handler = handler.handler.bind(global.conn)
conn.connectionUpdate = connectionUpdate.bind(global.conn)
conn.credsUpdate = saveCreds.bind(global.conn, true)
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
const creds = 'creds.json'
for (const gjbts of readRutaJadiBot) {
const botPath = join(global.rutaJadiBot, gjbts)
const readBotPath = readdirSync(botPath)
if (readBotPath.includes(creds)) { 
try {
RubyJadiBot({ pathRubyJadiBot: botPath, m: null, conn, args: '', usedPrefix: '/', command: 'serbot' }) 
await new Promise(resolve => setTimeout(resolve, 2500)); 
} catch(e) { 
console.log(chalk.red('Error cargando subbot:'), e) 
}
}
}
}
}
const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}
async function filesInit() {
for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
try { const file = global.__filename(join(pluginFolder, filename)); const module = await import(file); global.plugins[filename] = module.default || module } catch (e) { conn.logger.error(e); delete global.plugins[filename] }
}
}
filesInit().then((_) => Object.keys(global.plugins)).catch(console.error);
global.reload = async (_ev, filename) => {
if (pluginFilter(filename)) {
const dir = global.__filename(join(pluginFolder, filename), true);
if (filename in global.plugins) {
if (existsSync(dir)) conn.logger.info(`✨ Plugin actualizado: '${filename}'`)
else { conn.logger.warn(`🗑️ Plugin eliminado: '${filename}'`); return delete global.plugins[filename] }
} else conn.logger.info(`✨ Nuevo plugin: '${filename}'`);
const err = syntaxerror(readFileSync(dir), filename, { sourceType: 'module', allowAwaitOutsideFunction: true, });
if (err) conn.logger.error(`❌ Error sintaxis: '${filename}'\n${format(err)}`)
else {
try { const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`)); global.plugins[filename] = module.default || module; } catch (e) { conn.logger.error(`❌ Error sintaxis: '${filename}\n${format(e)}'`) } finally { global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))) }
}
}
}
Object.freeze(global.reload)
watch(pluginFolder, global.reload)
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
const jadiDir = `./${global.rutaJadiBot}`; 
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
setInterval(async () => {
await clearTmp()
}, 1000 * 60 * 2) 
setInterval(async () => {
await purgeSession()
await purgeSessionSB()
console.log(chalk.cyanBright(`\n🧹 LIMPIEZA AUTOMÁTICA COMPLETADA: TMP, PRE-KEYS Y SESIONES\n`))
}, 1000 * 60 * 60)
