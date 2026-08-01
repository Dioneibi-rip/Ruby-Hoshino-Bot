import { jidNormalizedUser } from '@whiskeysockets/baileys'

function normalizeWhatsAppJid(value = '') {
const raw = String(value || '').trim()
if (!raw) return ''
const cleaned = raw.replace(/^@/, '').replace(/\s+/g, '')
const candidate = cleaned.includes('@') ? cleaned : `${cleaned.replace(/\D/g, '')}@s.whatsapp.net`
const normalized = String(jidNormalizedUser(candidate) || candidate).split(':')[0]
const number = normalized.split('@')[0]?.replace(/\D/g, '') || ''
return number ? `${number}@s.whatsapp.net` : ''
}

function uniqueJids(values = []) {
return [...new Set((Array.isArray(values) ? values : [values]).map(normalizeWhatsAppJid).filter(Boolean))]
}

function participantId(participant = {}) {
if (typeof participant === 'string') return participant
return participant.jid || participant.id || participant.phoneNumber || participant.lid || ''
}

function participantValues(participant = {}) {
if (typeof participant === 'string') return [participant]
return [participant.id, participant.jid, participant.phoneNumber, participant.lid, participant.decodedJid, participant.adminJid].filter(Boolean)
}

function storedAliases(chat = {}) {
return uniqueJids([chat.primaryBot, chat.botPrimario, chat.primaryBotJid, chat.primaryBotAliases, chat.botPrimarioAliases].flat())
}

function pickRawTarget(m, text = '') {
return m.mentionedJid?.[0] || m.quoted?.sender || m.quoted?.participant || m.quoted?.key?.participant || text
}

async function resolvePrimaryBotJid(conn, m, rawTarget = '', participants = []) {
const rawText = String(rawTarget || '').trim()
const direct = normalizeWhatsAppJid(rawText)
let groupParticipants = participants
if ((!groupParticipants || !groupParticipants.length) && m.isGroup) {
const metadata = await conn.groupMetadata(m.chat).catch(() => null)
groupParticipants = metadata?.participants || []
}
const match = (groupParticipants || []).find(participant => {
const values = participantValues(participant)
const normalized = uniqueJids(values)
return normalized.includes(direct) || values.map(String).includes(rawText)
})
const source = match ? participantId(match) : rawText
const primaryJid = normalizeWhatsAppJid(source || direct)
const aliases = uniqueJids([primaryJid, direct, ...participantValues(match || {})])
return { primaryJid, aliases: aliases.length ? aliases : uniqueJids(primaryJid) }
}

function getChatData(chatId) {
return global.db?.getChat?.(chatId) || global.db?.get?.('chats', chatId) || global.db?.data?.chats?.[chatId] || {}
}

function saveChatData(chatId, data) {
if (global.db?.updateChat) global.db.updateChat(chatId, data)
else if (global.db?.set) global.db.set('chats', chatId, data)
else {
global.db.data ||= {}
global.db.data.chats ||= {}
global.db.data.chats[chatId] = data
}
}

let handler = async (m, { conn, text, participants = [] }) => {
if (!m.isGroup) throw '⚠️ 𝙀𝙨𝙩𝙚 𝙘𝙤𝙢𝙖𝙣𝙙𝙤 𝙨𝙤𝙡𝙤 𝙥𝙪𝙚𝙙𝙚 𝙪𝙨𝙖𝙧𝙨𝙚 𝙚𝙣 𝙜𝙧𝙪𝙥𝙤𝙨.'
const rawTarget = pickRawTarget(m, text)
const { primaryJid, aliases } = await resolvePrimaryBotJid(conn, m, rawTarget, participants)
if (!primaryJid) return m.reply('⚠️ 𝘿𝙚𝙗𝙚𝙨 𝙢𝙚𝙣𝙘𝙞𝙤𝙣𝙖𝙧, 𝙧𝙚𝙨𝙥𝙤𝙣𝙙𝙚𝙧 𝙤 𝙚𝙨𝙘𝙧𝙞𝙗𝙞𝙧 𝙚𝙡 𝙣𝙪́𝙢𝙚𝙧𝙤 𝙙𝙚𝙡 𝙗𝙤𝙩 𝙦𝙪𝙚 𝙙𝙚𝙨𝙚𝙖𝙨 𝙚𝙨𝙩𝙖𝙗𝙡𝙚𝙘𝙚𝙧 𝙘𝙤𝙢𝙤 𝙥𝙧𝙞𝙢𝙖𝙧𝙞𝙤.')
const chat = getChatData(m.chat)
const stored = storedAliases(chat)
if (aliases.some(alias => stored.includes(alias))) return conn.reply(m.chat, `✨ @${primaryJid.split`@`[0]} 𝙮𝙖 𝙚𝙨 𝙚𝙡 𝙗𝙤𝙩 𝙥𝙧𝙞𝙢𝙖𝙧𝙞𝙤 𝙙𝙚 𝙚𝙨𝙩𝙚 𝙜𝙧𝙪𝙥𝙤.`, m, { mentions: [primaryJid] })
const nextChat = {
...chat,
primaryBot: primaryJid,
botPrimario: primaryJid,
primaryBotAliases: aliases,
botSettings: chat.botSettings && typeof chat.botSettings === 'object' && !Array.isArray(chat.botSettings) ? chat.botSettings : {},
isBanned: chat.isBanned && typeof chat.isBanned === 'object' ? chat.isBanned : {}
}
for (const alias of aliases) {
nextChat.botSettings[alias] ||= {}
nextChat.botSettings[alias].isBanned = false
delete nextChat.isBanned[alias]
}
nextChat.bannedBots = Object.entries(nextChat.botSettings).filter(([, value]) => value?.isBanned === true).map(([jid]) => jid)
saveChatData(m.chat, nextChat)
global.db?.scheduleFlush?.()
await global.db?.write?.()
const response = `『 🤖 』⋮⋮ 𝙎𝙚 𝙝𝙖 𝙚𝙨𝙩𝙖𝙗𝙡𝙚𝙘𝙞𝙙𝙤 𝙖:\n> *@${primaryJid.split('@')[0]}*\n『 ℹ️ 』⋮⋮ 𝙀𝙛𝙚𝙘𝙩𝙤:\n> 𝘼 𝙥𝙖𝙧𝙩𝙞𝙧 𝙙𝙚 𝙖𝙝𝙤𝙧𝙖, 𝙩𝙤𝙙𝙤𝙨 𝙡𝙤𝙨 𝙘𝙤𝙢𝙖𝙣𝙙𝙤𝙨 𝙨𝙚𝙧𝙖́𝙣 𝙚𝙟𝙚𝙘𝙪𝙩𝙖𝙙𝙤𝙨 𝙥𝙤𝙧 𝙚́𝙡.\n『 ⚠️ 』⋮⋮ 𝙉𝙤𝙩𝙖:\n> 𝙎𝙞 𝙦𝙪𝙞𝙚𝙧𝙚𝙨 𝙦𝙪𝙚 𝙩𝙤𝙙𝙤𝙨 𝙡𝙤𝙨 𝙗𝙤𝙩𝙨 𝙫𝙪𝙚𝙡𝙫𝙖𝙣 𝙖 𝙧𝙚𝙨𝙥𝙤𝙣𝙙𝙚𝙧, 𝙪𝙨𝙖 𝙚𝙡 𝙘𝙤𝙢𝙖𝙣𝙙𝙤 *resetbot*.`.trim()
await conn.sendMessage(m.chat, { text: response, mentions: [primaryJid, ...aliases] }, { quoted: m })
}
handler.help = ['setprimary <número/mención>']
handler.tags = ['owner', 'group']
handler.command = ['setprimary', 'botprimario', 'setbot']
handler.group = true
handler.admin = true
export default handler
