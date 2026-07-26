import { promises as fsPromises } from "fs"
import path from 'path'
import ws from 'ws'
async function pathExists(file){
try{
await fsPromises.access(file)
return true
}catch{
return false
}
}

let handler = async (m, { conn, command, usedPrefix, args, text, isOwner, participants = [] }) => {

const isDeleteSession = /^(deletesesion|deletebot|deletesession|deletesesaion)$/i.test(command)
const isPauseBot = /^(stop|pausarai|pausarbot)$/i.test(command)
const isShowBots = /^(bots|sockets|socket)$/i.test(command)

const toFancy = (str) => {
const map = {
'a': 'ᥲ', 'b': 'ᑲ', 'c': 'ᥴ', 'd': 'ᑯ', 'e': 'ᥱ', 'f': '𝖿', 'g': 'g', 'h': 'һ',
'i': 'і', 'j': 'j', 'k': 'k', 'l': 'ᥣ', 'm': 'm', 'n': 'ᥒ', 'o': '᥆', 'p': '⍴',
'q': 'q', 'r': 'r', 's': 's', 't': '𝗍', 'u': 'ᥙ', 'v': '᥎', 'w': 'ɯ', 'x': 'x',
'y': 'ᥡ', 'z': 'z', 'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F',
'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V',
'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
}
return str.split('').map(c => map[c] || c).join('')
}

const reportError = async (e) => {
await m.reply(`⚠️ ${toFancy("Ocurrió un error inesperado, lo siento mucho...")}`)
console.error(e)
}

if (isDeleteSession) {
const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
const uniqid = `${who.split('@')[0]}`
const dirPath = `./${jadi}/${uniqid}`

if (!await pathExists(dirPath)) {
return conn.sendMessage(m.chat, {
text: `🚫 *${toFancy("Sesión no encontrada")}*\n\n✨ ${toFancy("No tienes una sesión activa.")}\n\n🔰 ${toFancy("Puedes crear una con:")}\n*${usedPrefix}qr*\n\n📦 ${toFancy("Obtener código:")}\n*${usedPrefix}code*`
}, { quoted: m })
}

if (global.conn.user.jid !== conn.user.jid) {
return conn.sendMessage(m.chat, {
text: `💬 ${toFancy("Este comando solo puede usarse desde el Bot Principal.")}`,
}, { quoted: m })
}

try {
await m.react('🗑️')
await fsPromises.rm(dirPath, { recursive: true, force: true })
await conn.sendMessage(m.chat, {
text: `🌈 ${toFancy("¡Todo limpio! Tu sesión ha sido eliminada con éxito.")}`
}, { quoted: m })
} catch (e) {
reportError(e)
return false;
}
}
else if (isPauseBot) {
if (global.conn.user.jid == conn.user.jid) {
await conn.reply(m.chat, `🚫 ${toFancy("No puedes pausar el bot principal.")}`, m);
return false;
}
await conn.reply(m.chat, `🔕 *${botname || 'Sub-Bot'} ${toFancy("ha sido pausado.")}*`, m)
conn.ws.close()
}

else if (isShowBots) {
const cleanNumber = (value = '') => String(value).split('@')[0].split(':')[0].replace(/\D/g, '');
const socketOpen = (sock) => sock?.user && sock?.ws?.socket && sock.ws.socket.readyState !== ws.CLOSED
const jidFromNumber = (number = '') => number ? `${cleanNumber(number)}@s.whatsapp.net` : ''
const botNameFromSock = (sock, fallbackNumber) => String(sock?.user?.name || sock?.user?.pushname || fallbackNumber || toFancy('Sin Nombre')).replace(/@/g, '')
const ensureDir = async (dir) => fsPromises.mkdir(dir, { recursive: true }).catch(() => {})
const getBotsFromFolder = async (folderPath) => {
try {
const entries = await fsPromises.readdir(folderPath, { withFileTypes: true })
const bots = []
for (const entry of entries) {
if (!entry.isDirectory()) continue
const credsPath = path.join(folderPath, entry.name, 'creds.json')
if (await pathExists(credsPath)) {
const number = cleanNumber(entry.name)
if (number) bots.push(number)
}
}
return bots
} catch {
return []
}
}
const getActiveBotNumbers = () => {
const activeJids = new Set()
if (!Array.isArray(global.conns)) return activeJids
for (const subConn of global.conns) {
if (!socketOpen(subConn)) continue
const number = cleanNumber(subConn?.user?.id || subConn?.user?.jid || subConn?.userId || subConn?.subBotJid || '')
if (number) activeJids.add(number)
}
return activeJids
}
const getSockByNumber = (number) => {
if (cleanNumber(global.conn?.user?.id || global.conn?.user?.jid || '') === number) return global.conn
return (global.conns || []).find((subConn) => cleanNumber(subConn?.user?.id || subConn?.user?.jid || subConn?.userId || subConn?.subBotJid || '') === number)
}
const sessionsPath = path.resolve(process.cwd(), 'Sessions')
const subsPath = path.join(sessionsPath, 'Subs')
const legacySubsPath = path.resolve(process.cwd(), global.rutaJadiBot || jadi || 'JadiBots')
await ensureDir(subsPath)
const groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(() => null) : null
const groupParticipants = (groupMetadata?.participants || participants || []).map((participant) => jidFromNumber(participant?.id || participant?.jid)).filter(Boolean)
const participantMap = new Map((groupMetadata?.participants || participants || []).flatMap((participant) => {
const ids = [participant?.id, participant?.jid].filter(Boolean).map((id) => jidFromNumber(id))
return ids.map((id) => [id, participant])
}))
const isAdminParticipant = (jid) => {
const participant = participantMap.get(jidFromNumber(jid))
return Boolean(participant?.admin || participant?.isAdmin || participant?.isSuperAdmin)
}
const inGroup = (number) => !m.isGroup || groupParticipants.includes(jidFromNumber(number))
const wantsAll = /^all$/i.test((args?.[0] || text || '').trim())
const showAll = Boolean(isOwner && wantsAll)
const mainNumber = cleanNumber(global.conn?.user?.id || global.conn?.user?.jid || conn?.user?.id || conn?.user?.jid || '')
const activeBots = getActiveBotNumbers()
const folderSubs = [...await getBotsFromFolder(subsPath), ...await getBotsFromFolder(legacySubsPath)]
const subs = [...new Set([...folderSubs.filter((num) => activeBots.has(num)), ...[...activeBots].filter((num) => num !== mainNumber)])]
const bots = []
if (mainNumber) bots.push({ number: mainNumber, type: 'Main', icon: '👑', sock: getSockByNumber(mainNumber) || conn })
for (const number of subs) bots.push({ number, type: 'Sub', icon: '🎀', sock: getSockByNumber(number) })
const visibleBots = showAll ? bots : bots.filter(({ number }) => inGroup(number))
const mainCount = mainNumber ? 1 : 0
const subCount = subs.length
const botLines = visibleBots.length
? visibleBots.map(({ number, type, icon, sock }) => {
const jid = jidFromNumber(number)
const label = botNameFromSock(sock, number) || number
const adminTag = isAdminParticipant(jid) ? ' 🛡️(Admin)' : ''
return `┃ ${icon} [${type}] ➭ ${label}${adminTag}`
}).join('\n')
: '┃ ✧ No hay bots activos en este grupo.'
const headerText = `╭━━━〔 🌟 ＲＵＢＹ ＳＯＣＫＥＴＳ 🌟 〕━━━⬣
┃ ◈ 𝗧𝗼𝘁𝗮𝗹 𝗔𝗰𝘁𝗶𝘃𝗼𝘀: ${mainCount + subCount}
┃ ◈ 👑 𝗠𝗮𝗶𝗻: ${mainCount}
┃ ◈ 🎀 𝗦𝘂𝗯𝘀: ${subCount}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣

╭━━━〔 📍 𝗘𝗡 𝗘𝗦𝗧𝗘 𝗚𝗥𝗨𝗣𝗢 (${visibleBots.length}) 〕━━━⬣
${botLines}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`

await conn.sendMessage(m.chat, { text: headerText, mentions: [] }, { quoted: m })
}
}

handler.tags = ['serbot']
handler.help = ['sockets', 'deletesesion', 'pausarai']
handler.command = [
'deletesesion', 'deletebot', 'deletesession', 'deletesesaion',
'stop', 'pausarai', 'pausarbot',
'bots', 'sockets', 'socket'
]

export default handler
