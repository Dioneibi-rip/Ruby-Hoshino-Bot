import { smsg } from './lib/simple.js'
import { format } from 'util'
import * as ws from 'ws';
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import fetch from 'node-fetch'
import failureHandler from './lib/respuesta.js';
const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
clearTimeout(this)
resolve()
}, ms))
global.uptimeStart = Date.now();
const STALE_MESSAGE_WINDOW_MS = 10 * 60 * 1000
const GROUP_METADATA_CACHE_TTL_MS = 2 * 60 * 1000
global.groupMetadataCache = global.groupMetadataCache || new Map()
export async function handler(chatUpdate) {
this.msgqueque = this.msgqueque || []
this.uptime = this.uptime || Date.now()
if (!chatUpdate) return
let sender = null;
try {
let mObj = chatUpdate.messages[chatUpdate.messages.length - 1]
if (!mObj) return
const rawTimestamp = typeof mObj.messageTimestamp === 'object' ? Number(mObj.messageTimestamp?.low || mObj.messageTimestamp) : Number(mObj.messageTimestamp)
const messageTime = Number.isFinite(rawTimestamp) && rawTimestamp > 0 ? rawTimestamp * 1000 : Date.now()
const timeDiff = Date.now() - messageTime
if (timeDiff > STALE_MESSAGE_WINDOW_MS && !mObj?.message?.protocolMessage) return
} catch (e) {
console.error(e)
}
this.pushMessage(chatUpdate.messages).catch(console.error)
let m = chatUpdate.messages[chatUpdate.messages.length - 1]
if (!m) return;
if (global.db && global.db.data == null) await global.loadDatabase()
try {
m = smsg(this, m) || m
if (!m) return
const opts = this.opts || global.opts || {}
if (m.isGroup) {
const chat = global.db?.data?.chats?.[m.chat];
if (chat?.primaryBot) {
const universalWords = ['resetbot', 'resetprimario', 'botreset'];
const firstWord = m.text ? m.text.trim().split(' ')[0].toLowerCase().replace(/^[./#]/, '') : '';
if (!universalWords.includes(firstWord)) {
if (this?.user?.jid !== chat.primaryBot) return;
}
}
}
sender = m.isGroup ? (m.key?.participant ? m.key.participant : m.sender) : m.key?.remoteJid;
let groupMetadata = {}
if (m.isGroup) {
const cached = global.groupMetadataCache.get(m.chat)
if (cached && (Date.now() - cached.ts) < GROUP_METADATA_CACHE_TTL_MS) {
groupMetadata = cached.data || {}
} else {
const freshMetadata = this.chats?.[m.chat]?.metadata || await this.groupMetadata(m.chat).catch(_ => null) || {}
groupMetadata = freshMetadata
if (freshMetadata && Object.keys(freshMetadata).length) {
global.groupMetadataCache.set(m.chat, { data: freshMetadata, ts: Date.now() })
}
}
}
const rawParticipants = m.isGroup ? (groupMetadata.participants || []) : []
const participants = (rawParticipants || []).map(p => {
let jid = typeof p === 'string' ? p : (p.id || p.jid || p.participant || p?.[0] || null)
if (jid && !/@/.test(jid)) {
if (/^\d+$/.test(jid)) jid = jid + '@s.whatsapp.net'
}
let lid = p?.lid ?? (jid ? jid.split('@')[0] + '@lid' : undefined)
let admin = false
if (p) {
if (typeof p.admin === 'string') {
if (['creator', 'superadmin', 'owner'].includes(p.admin)) admin = 'superadmin'
else if (p.admin === 'admin') admin = 'admin'
} else if (p.admin === true) {
admin = 'admin'
} else if (p.isSuperAdmin || p.isCreator) {
admin = 'superadmin'
} else if (p.isAdmin) {
admin = 'admin'
} else if (p.role) {
if (p.role === 'creator') admin = 'superadmin'
else if (p.role === 'admin') admin = 'admin'
}
}
return { id: jid, jid: jid, lid, admin }
})
if (m.isGroup) {
if (sender && sender.endsWith('@lid')) {
const pInfo = participants.find(p => p.lid === sender)
if (pInfo && pInfo.id) {
sender = pInfo.id
if (m.key) m.key.participant = pInfo.id
try { m.sender = pInfo.id } catch (e) { }
}
}
if (m.quoted && m.quoted.sender && m.quoted.sender.endsWith('@lid')) {
const pInfo = participants.find(p => p.lid === m.quoted.sender)
if (pInfo && pInfo.id) {
if (m.quoted.key) m.quoted.key.participant = pInfo.id
try { m.quoted.sender = pInfo.id } catch (e) { }
}
}
if (m.mentionedJid && m.mentionedJid.length > 0) {
const normalizedMentions = m.mentionedJid.map(jid => {
if (jid && jid.endsWith('@lid')) {
const pInfo = participants.find(p => p.lid === jid)
return (pInfo && pInfo.id) ? pInfo.id : jid
}
return jid
})
try { m.mentionedJid = normalizedMentions } catch (e) { }
}
}
m.exp = 0
m.coin = false
const userDefault = {
exp: 0, coin: 10, joincount: 1, diamond: 3, lastadventure: 0, health: 100,
lastclaim: 0, lastcofre: 0, lastdiamantes: 0, lastcode: 0, lastduel: 0,
lastpago: 0, lastmining: 0, lastcodereg: 0, muto: false, premium: false,
premiumTime: 0, registered: false, genre: '', birth: '', marry: '',
description: '', packstickers: null, name: m.name || '', age: -1,
regTime: -1, afk: -1, afkReason: '', role: 'Nuv', banned: false,
useDocument: false, level: 0, bank: 0, warn: 0, crime: 0,
job: null, jobSince: 0, jobXp: 0
};
const chatDefault = {
sAutoresponder: '', welcome: true, isBanned: false, autolevelup: false,
autoresponder: false, delete: false, autoAceptar: false, autoRechazar: false,
detect: true, antiBot: false, antiBot2: false, modoadmin: false,
antiLink: true, antifake: false, antiArabe: false, reaction: false,
nsw: false, expired: 0, welcomeText: null, byeText: null, audios: false,
botPrimario: null, bannedBots: [], antiImg: false, nsfw: false
};
const settingsDefault = {
self: false, restrict: true, jadibotmd: true, antiPrivate: false,
moneda: 'Coins', autoread: false, status: 0, disabledCommands: []
};
let user = global.db.data.users[sender]
if (typeof user !== 'object') {
global.db.data.users[sender] = {}
}
user = global.db.data.users[sender]
for (const key in userDefault) {
if (userDefault[key] === null) continue;
if (typeof user[key] === 'undefined') {
user[key] = userDefault[key];
} else if (typeof userDefault[key] === 'number' && !isNumber(user[key])) {
user[key] = userDefault[key];
}
}
if (m.chat) {
let chat = global.db.data.chats[m.chat]
if (typeof chat !== 'object') {
global.db.data.chats[m.chat] = {}
}
chat = global.db.data.chats[m.chat]
for (const key in chatDefault) {
if (chatDefault[key] === null) continue;
if (typeof chat[key] === 'undefined') {
chat[key] = chatDefault[key];
} else if (typeof chatDefault[key] === 'number' && !isNumber(chat[key])) {
chat[key] = chatDefault[key];
}
}
}
let settings = global.db.data.settings[this.user.jid]
if (typeof settings !== 'object') {
global.db.data.settings[this.user.jid] = {}
}
settings = global.db.data.settings[this.user.jid]
for (const key in settingsDefault) {
if (typeof settings[key] === 'undefined') {
settings[key] = settingsDefault[key];
}
}
if (!Array.isArray(settings.disabledCommands)) settings.disabledCommands = []
if (opts['nyimak']) return
if (!m.fromMe && opts['self']) return
if (opts['swonly'] && m.chat !== 'status@broadcast') return
if (typeof m.text !== 'string') m.text = ''
const _user = global.db.data.users[sender]
const findParticipant = (jidToFind) => {
if (!jidToFind) return undefined
const target = (this.decodeJid && typeof this.decodeJid === 'function') ? this.decodeJid(jidToFind) : jidToFind
return participants.find(u => {
try {
if (!u) return false
if (u.jid && this.decodeJid && this.decodeJid(u.jid) === target) return true
if (u.id && this.decodeJid && this.decodeJid(u.id) === target) return true
if (u.lid && target && (u.lid === target || u.lid === jidToFind)) return true
} catch (e) { }
return false
})
}
const normalizeAdmin = (p) => {
if (!p) return false
const a = p.admin ?? p.isAdmin ?? p.role ?? false
if (a === true || a === 'admin') return 'admin'
if (['creator', 'superadmin', 'owner'].includes(a) || p.isSuperAdmin || p.isCreator) return 'superadmin'
return false
}
const userGroup = (m.isGroup ? findParticipant(sender) : {}) || {}
const botGroup = (m.isGroup ? findParticipant(this.user.jid) : {}) || {}
const isRAdmin = normalizeAdmin(userGroup) === 'superadmin'
const isAdmin = isRAdmin || normalizeAdmin(userGroup) === 'admin'
const isBotAdmin = normalizeAdmin(botGroup) === 'admin' || normalizeAdmin(botGroup) === 'superadmin'
const senderNum = String(sender || '').split('@')[0];
const isROwner = global.owner.map(([number]) => number).includes(senderNum);
const isOwner = isROwner
const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '')).includes(senderNum)
const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '')).includes(senderNum) || _user?.premium == true
const moneda = global.db.data.settings[this.user.jid]?.moneda || 'Coins'
m.moneda = moneda;
if (opts['queque'] && m.text && !(isMods || isPrems)) {
let queque = this.msgqueque, time = 1000 * 5
const previousID = queque[queque.length - 1]
queque.push(m.id || m.key?.id)
setTimeout(async function () {
const idx = queque.indexOf(previousID)
if (idx !== -1) queque.splice(idx, 1)
}, time)
}
m.exp += Math.ceil(Math.random() * 10)
let usedPrefix
const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
for (let name in global.plugins) {
let plugin = global.plugins[name]
if (!plugin) continue
if (plugin.disabled) continue
const __filename = join(___dirname, name)
if (typeof plugin.all === 'function') {
try {
await plugin.all.call(this, m, { chatUpdate, __dirname: ___dirname, __filename })
} catch (e) { console.error(e) }
}
if (!opts['restrict'] && plugin.tags && plugin.tags.includes('admin')) continue
const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
let _prefix = plugin.customPrefix ? plugin.customPrefix : this.prefix ? this.prefix : global.prefix
let match = (_prefix instanceof RegExp ? [[_prefix.exec(m.text), _prefix]] :
Array.isArray(_prefix) ? _prefix.map(p => {
let re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
return [re.exec(m.text), re]
}) :
typeof _prefix === 'string' ? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] : [[[], new RegExp]]
).find(p => p[1])
if (typeof plugin.before === 'function') {
if (await plugin.before.call(this, m, {
match, conn: this, participants, groupMetadata, user: userGroup, bot: botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename
})) continue
}
if (typeof plugin !== 'function') continue
if (!(match && match[0])) continue
if ((usedPrefix = (match[0] || '')[0])) {
if (['>', '=>', '$'].includes(usedPrefix)) continue
let noPrefix = m.text.replace(usedPrefix, '')
let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
args = args || []
let _args = noPrefix.trim().split` `.slice(1)
let text = _args.join` `
command = (command || '').toLowerCase()
if (!/^[a-z0-9][\w-]*$/i.test(command)) continue
let fail = plugin.fail || global.dfail
let isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
typeof plugin.command === 'string' ? plugin.command === command : false
global.comando = command
if ((m.id && (m.id.startsWith('NJX-') || (m.id.startsWith('BAE5') && m.id.length === 16) || (m.id.startsWith('B24E') && m.id.length === 20)))) return
if (!isAccept) continue
const disabledCommands = global.db.data.settings[this.user.jid]?.disabledCommands || []
if (!isROwner && !isOwner && disabledCommands.includes(command)) {
this.reply(m.chat, `✘ El comando *${usedPrefix}${command}* está deshabilitado por mi owner.`, m)
continue
}
m.plugin = name
let chatData = global.db.data.chats[m.chat] || {};
const isBotBannedInThisChat = Array.isArray(chatData.bannedBots) && chatData.bannedBots.includes(this.user.jid);
if (isBotBannedInThisChat) {
const mode = chatData.banchatMode || 'silent'
const allowOnBanchat = ['grupo-unbanchat.js']
if (mode === 'silent') {
if (!isROwner && !isOwner && !allowOnBanchat.includes(name)) return
} else if (mode === 'strict' && !allowOnBanchat.includes(name)) {
return
}
}
if (m.chat in global.db.data.chats || sender in global.db.data.users) {
let chat = global.db.data.chats[m.chat]
let user = global.db.data.users[sender]
if (!['grupo-unbanchat.js'].includes(name) && chat && chat.isBanned && !isROwner) return
if (name != 'grupo-unbanchat.js' && name != 'owner-exec.js' && name != 'owner-exec2.js' && name != 'grupo-delete.js' && chat?.isBanned && !isROwner) return
if (m.text && user && user.banned && !isROwner) {
if (!user.lastBanMsg || Date.now() - user.lastBanMsg > 30000) {
m.reply(`《✦》Estas baneado/a, no puedes usar comandos en este bot!\n\n${user.bannedReason ? `✰ *Motivo:* ${user.bannedReason}` : '✰ *Motivo:* Sin Especificar'}\n\n> ✧ Si este Bot es cuenta ...`)
user.lastBanMsg = Date.now();
}
return
}
if (user && user.antispam && !user.banned) user.antispam = 0
}
let adminMode = global.db.data.chats[m.chat]?.modoadmin
if (adminMode && m.isGroup && !isAdmin && !isOwner && !isROwner) return
if (plugin.botAdmin && !isBotAdmin) { fail("botAdmin", m, this); continue }
if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { fail('owner', m, this); continue }
if (plugin.rowner && !isROwner) { fail('rowner', m, this); continue }
if (plugin.owner && !isOwner) { fail('owner', m, this); continue }
if (plugin.mods && !isMods) { fail('mods', m, this); continue }
if (plugin.premium && !isPrems) { fail('premium', m, this); continue }
if (plugin.admin && !isAdmin) { fail('admin', m, this); continue }
if (plugin.private && m.isGroup) { fail('private', m, this); continue }
if (plugin.group && !m.isGroup) { fail('group', m, this); continue }
if (plugin.register == true && _user?.registered == false) { fail('unreg', m, this); continue }
m.isCommand = true
let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17
if (xp > 200) m.reply('chirrido -_-')
else m.exp += xp
if (!isPrems && plugin.coin && global.db.data.users[sender].coin < plugin.coin * 1) {
this.reply(m.chat, `❮✦❯ Se agotaron tus ${m.moneda}`, m)
continue
}
if (plugin.level > _user.level) {
this.reply(m.chat, `❮✦❯ Se requiere el nivel: *${plugin.level}*\n\n• Tu nivel actual es: *${_user.level}*\n\n• Usa este comando para subir de nivel:\n*${usedPrefix}levelup*`, m)
continue
}
let extra = {
match, usedPrefix, noPrefix, _args, args, command, text, conn: this, participants, groupMetadata, user: userGroup, bot: botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename
}
try {
await plugin.call(this, m, extra)
if (!isPrems) m.coin = m.coin || plugin.coin || false
} catch (e) {
m.error = e
console.error(e)
if (e) {
let text = format(e)
for (let key of Object.values(global.APIKeys || {}))
text = text.replace(new RegExp(key, 'g'), 'Administrador')
m.reply(text)
}
} finally {
if (typeof plugin.after === 'function') {
try {
await plugin.after.call(this, m, extra)
} catch (e) { console.error(e) }
}
if (m.coin) this.reply(m.chat, `❮✦❯ Utilizaste ${+m.coin} ${m.moneda}`, m)
}
break
}
}
} catch (e) {
console.error(e)
} finally {
try {
if (this.msgqueque && (this.opts || global.opts || {})['queque'] && m && m.text) {
const quequeIndex = this.msgqueque.indexOf(m.id || m.key?.id)
if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
}
} catch (err) { }
let user, stats = global.db?.data?.stats || {}
try {
if (m) {
let utente = global.db.data.users[sender]
if (utente && utente.muto == true) {
let bang = m.key.id
let cancellazzione = m.key.participant || m.sender || sender
try {
await this.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: cancellazzione } })
} catch (e) { }
}
if (sender && (user = global.db.data.users[sender])) {
user.exp += m.exp
user.coin -= (m.coin || 0) * 1
}
let stat
if (m.plugin) {
let now = +new Date
if (m.plugin in stats) {
stat = stats[m.plugin]
if (!isNumber(stat.total)) stat.total = 1
if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
if (!isNumber(stat.last)) stat.last = now
if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
} else stat = stats[m.plugin] = { total: 1, success: m.error != null ? 0 : 1, last: now, lastSuccess: m.error != null ? 0 : now }
stat.total += 1
stat.last = now
if (m.error == null) {
stat.success += 1
stat.lastSuccess = now
}
}
}
} catch (e) { console.error(e) }
try {
if (!((this.opts || global.opts || {})['noprint'])) await (await import(`./lib/print.js`)).default(m, this)
} catch (e) {
console.log(chalk.red('Error en print.js'), e)
}
}
}
global.dfail = (type, m, conn) => { failureHandler(type, conn, m); };
const file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
unwatchFile(file);
console.log(chalk.green('Actualizando "handler.js"'));
if (global.conns && global.conns.length > 0) {
const users = [...new Set([...global.conns.filter((conn) => conn.user && conn.ws && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn)])];
for (const userr of users) { try { userr.subreloadHandler(false) } catch (e) { } }
}
});