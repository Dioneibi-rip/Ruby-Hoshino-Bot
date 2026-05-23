import { smsg } from './lib/simple.js'
import { format } from 'util'
import * as ws from 'ws';
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import fetch from 'node-fetch'
import failureHandler from './lib/respuesta.js';
import { TTLCache, getPrefixMatcherCache } from './lib/optimizer.js'
const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
clearTimeout(this)
resolve()
}, ms))
global.uptimeStart = Date.now();

const GROUP_METADATA_TTL = 60 * 1000
const GROUP_METADATA_MAX = 2000
function normalizeParticipant(participant = {}) {
return { ...participant, id: participant.jid, jid: participant.jid, lid: participant.lid, admin: participant.admin || participant.isAdmin || participant.role }
}
async function getCachedGroupMetadata(conn, chatId) {
conn.__groupMetadataCache = conn.__groupMetadataCache || new TTLCache(GROUP_METADATA_TTL, GROUP_METADATA_MAX)
const cached = conn.__groupMetadataCache.get(chatId)
if (cached) return cached
const metadata = await conn.groupMetadata(chatId).catch(() => null) || {}
if (Array.isArray(metadata.participants)) metadata.participants = metadata.participants.map(normalizeParticipant)
conn.__groupMetadataCache.set(chatId, metadata)
return metadata
}
export async function handler(chatUpdate) {
this.msgqueque = this.msgqueque || []
this.uptime = this.uptime || Date.now()
if (this.__groupMetadataCache && Math.random() < 0.01) this.__groupMetadataCache.clearExpired()
if (!chatUpdate) return
let sender = null;
try {
let mObj = chatUpdate.messages[chatUpdate.messages.length - 1];
if (!mObj) return;
const messageTime = (mObj.messageTimestamp * 1000) || Date.now();
const timeDiff = Date.now() - messageTime;
if (timeDiff > 60000) return; 
} catch (e) {
console.error(e);
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
const groupMetadata = m.isGroup ? await getCachedGroupMetadata(this, m.chat) : {}
const participants = Array.isArray(groupMetadata.participants) ? groupMetadata.participants : []
if (m.isGroup) {
if (sender && sender.endsWith('@lid')) {
const pInfo = participants.find(p => p.lid === sender)
if (pInfo && pInfo.jid) {
sender = pInfo.jid
if (m.key) m.key.participant = pInfo.jid
try { m.sender = pInfo.jid } catch (e) { }
}
}
if (m.quoted && m.quoted.sender && m.quoted.sender.endsWith('@lid')) {
const pInfo = participants.find(p => p.lid === m.quoted.sender)
if (pInfo && pInfo.jid) {
if (m.quoted.key) m.quoted.key.participant = pInfo.jid
try { m.quoted.sender = pInfo.jid } catch (e) { }
}
}
if (m.mentionedJid && m.mentionedJid.length > 0) {
const normalizedMentions = m.mentionedJid.map(jid => {
if (jid && jid.endsWith('@lid')) {
const pInfo = participants.find(p => p.lid === jid)
return (pInfo && pInfo.jid) ? pInfo.jid : jid
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
useDocument: false, level: 0, bank: 0, warn: 0, crime: 0
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
moneda: 'Coins', autoread: false, status: 0
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
if (opts['nyimak']) return
if (!m.fromMe && opts['self']) return
if (opts['swonly'] && m.chat !== 'status@broadcast') return
if (typeof m.text !== 'string') m.text = ''
const _user = global.db.data.users[sender]
const userGroup = (m.isGroup ? participants.find((u) => (this.decodeJid ? this.decodeJid(u.jid) : u.jid) === sender) : {}) || {}
const botGroup = (m.isGroup ? participants.find((u) => (this.decodeJid ? this.decodeJid(u.jid) : u.jid) === this.user.jid) : {}) || {}
const normalizeAdmin = (p) => {
if (!p) return false
const a = p.admin ?? false
if (a === true || a === 'admin') return 'admin'
if (['creator', 'superadmin', 'owner'].includes(a)) return 'superadmin'
return false
}
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
const str2Regex = str => str.replace(/[|\{}()[\]^$+*?.]/g, '\\$&')
const prefixCache = getPrefixMatcherCache(this)
let _prefix = plugin.customPrefix ? plugin.customPrefix : this.prefix ? this.prefix : global.prefix
let match = (_prefix instanceof RegExp ? [[_prefix.exec(m.text), _prefix]] :
Array.isArray(_prefix) ? _prefix.map(p => {
const cacheKey = p instanceof RegExp ? `re:${p.source}:${p.flags}` : `str:${p}`
let re = prefixCache.get(cacheKey)
if (!re) {
re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
prefixCache.set(cacheKey, re)
}
return [re.exec(m.text), re]
}) :
typeof _prefix === 'string' ? (() => {
const cacheKey = `str:${_prefix}`
let re = prefixCache.get(cacheKey)
if (!re) {
re = new RegExp(str2Regex(_prefix))
prefixCache.set(cacheKey, re)
}
return [[re.exec(m.text), re]]
})() : [[[], new RegExp]])
.find(p => p[1])
if (typeof plugin.before === 'function') {
if (await plugin.before.call(this, m, {
match, conn: this, participants, groupMetadata, user: userGroup, bot: botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename
})) continue
}
if (typeof plugin !== 'function') continue
if (!(match && match[0])) continue
if ((usedPrefix = (match[0] || '')[0])) {
let noPrefix = m.text.replace(usedPrefix, '')
let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
args = args || []
let _args = noPrefix.trim().split` `.slice(1)
let text = _args.join` `
command = (command || '').toLowerCase()
let fail = plugin.fail || global.dfail
let isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
typeof plugin.command === 'string' ? plugin.command === command : false
global.comando = command
if ((m.id && (m.id.startsWith('NJX-') || (m.id.startsWith('BAE5') && m.id.length === 16) || (m.id.startsWith('B24E') && m.id.length === 20)))) return
if (!isAccept) continue
m.plugin = name
let chatData = global.db.data.chats[m.chat] || {};
const isBotBannedInThisChat = chatData.bannedBots && chatData.bannedBots.includes(this.user.jid);
const unbanCommandFiles = ['grupo-unbanchat.js'];
if (isBotBannedInThisChat && !unbanCommandFiles.includes(name)) return;
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
let cancellazzione = m.key.participant
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
