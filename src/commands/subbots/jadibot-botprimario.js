import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { normalizeIdentityJid } from '../../core/identity-utils.js'
import { getPrimaryAliases, normalizeSessionJid } from '../../core/session-utils.js'
import { createParticipantIndex, normalizeParticipantList } from '../../router/handler-utils.js'

function normalizePlainJid(value = '') {
const raw = String(value || '').trim().replace(/^@/, '')
if (!raw) return ''
const jid = raw.includes('@') ? raw : `${raw.replace(/[^0-9]/g, '')}@s.whatsapp.net`
const normalized = normalizeSessionJid(jidNormalizedUser(jid) || jid)
const [local, domain] = normalized.split('@')
const validDomain = ['s.whatsapp.net', 'lid', 'hosted.lid'].includes(domain)
if (!local || !validDomain || !/^\d+$/.test(local)) return ''
return normalized
}

function uniqueJids(values = []) {
return [...new Set((Array.isArray(values) ? values : [values]).map(normalizePlainJid).filter(Boolean))]
}

async function resolvePrimaryBotJid(conn, rawTarget = '', participants = []) {
const normalizedParticipants = normalizeParticipantList(participants)
const participantsByLid = createParticipantIndex(normalizedParticipants)
const firstPass = normalizePlainJid(rawTarget)
const participant = normalizedParticipants.find((p = {}) => {
const ids = uniqueJids([p.id, p.jid, p.lid])
return ids.includes(firstPass)
})
const resolved = await normalizeIdentityJid(conn, participant?.lid || participant?.jid || participant?.id || firstPass, participantsByLid)
const primaryJid = normalizePlainJid(resolved || firstPass)
const aliases = uniqueJids([primaryJid, firstPass, participant?.id, participant?.jid, participant?.lid])
return { primaryJid, aliases }
}

function pickRawTarget(m, text = '') {
return m.mentionedJid?.[0] || m.quoted?.sender || m.quoted?.participant || m.quoted?.key?.participant || text
}

function isSamePrimary(chat = {}, aliases = []) {
const stored = uniqueJids([chat.primaryBot, chat.botPrimario, ...getPrimaryAliases(chat)])
return aliases.some(alias => stored.includes(alias))
}

let handler = async (m, { conn, text, participants = [] }) => {
if (!m.isGroup) throw '⚠️ 𝙀𝙨𝙩𝙚 𝙘𝙤𝙢𝙖𝙣𝙙𝙤 𝙨𝙤𝙡𝙤 𝙥𝙪𝙚𝙙𝙚 𝙪𝙨𝙖𝙧𝙨𝙚 𝙚𝙣 𝙜𝙧𝙪𝙥𝙤𝙨.'

const rawTarget = pickRawTarget(m, text)
const { primaryJid, aliases } = await resolvePrimaryBotJid(conn, rawTarget, participants)
if (!primaryJid) {
return m.reply('⚠️ 𝘿𝙚𝙗𝙚𝙨 𝙢𝙚𝙣𝙘𝙞𝙤𝙣𝙖𝙧, 𝙧𝙚𝙨𝙥𝙤𝙣𝙙𝙚𝙧 𝙤 𝙚𝙨𝙘𝙧𝙞𝙗𝙞𝙧 𝙚𝙡 𝙣𝙪́𝙢𝙚𝙧𝙤 𝙙𝙚𝙡 𝙗𝙤𝙩 𝙦𝙪𝙚 𝙙𝙚𝙨𝙚𝙖𝙨 𝙚𝙨𝙩𝙖𝙗𝙡𝙚𝙘𝙚𝙧 𝙘𝙤𝙢𝙤 𝙥𝙧𝙞𝙣𝙘𝙞𝙥𝙖𝙡.')
}

const chat = global.db.getChat?.(m.chat) || global.db.get?.('chats', m.chat) || {}
if (isSamePrimary(chat, aliases)) {
return conn.reply(m.chat, `✨ @${primaryJid.split`@`[0]} 𝙮𝙖 𝙚𝙨 𝙚𝙡 𝙗𝙤𝙩 𝙥𝙧𝙞𝙢𝙖𝙧𝙞𝙤 𝙙𝙚 𝙚𝙨𝙩𝙚 𝙜𝙧𝙪𝙥𝙤.`, m, { mentions: [primaryJid] })
}

const nextChat = {
...chat,
primaryBot: primaryJid,
botPrimario: primaryJid,
primaryBotAliases: aliases,
botSettings: chat.botSettings && typeof chat.botSettings === 'object' && !Array.isArray(chat.botSettings) ? chat.botSettings : {},
isBanned: chat.isBanned && typeof chat.isBanned === 'object' ? chat.isBanned : {},
}
for (const alias of aliases) {
nextChat.botSettings[alias] ||= {}
nextChat.botSettings[alias].isBanned = false
delete nextChat.isBanned[alias]
}
nextChat.bannedBots = Object.entries(nextChat.botSettings)
.filter(([, value]) => value?.isBanned === true)
.map(([jid]) => jid)

if (global.db.updateChat) global.db.updateChat(m.chat, nextChat)
else global.db.set('chats', m.chat, nextChat)
global.db.scheduleFlush?.()
await global.db.write?.()

const response = `
『 🤖 』⋮⋮ 𝙎𝙚 𝙝𝙖 𝙚𝙨𝙩𝙖𝙗𝙡𝙚𝙘𝙞𝙙𝙤 𝙖:
> *@${primaryJid.split('@')[0]}*

『 ℹ️ 』⋮⋮ 𝙀𝙛𝙚𝙘𝙩𝙤:
> 𝘼 𝙥𝙖𝙧𝙩𝙞𝙧 𝙙𝙚 𝙖𝙝𝙤𝙧𝙖, 𝙩𝙤𝙙𝙤𝙨 𝙡𝙤𝙨 𝙘𝙤𝙢𝙖𝙣𝙙𝙤𝙨 𝙨𝙚𝙧𝙖́𝙣 𝙚𝙟𝙚𝙘𝙪𝙩𝙖𝙙𝙤𝙨 𝙥𝙤𝙧 𝙚́𝙡.

『 ⚠️ 』⋮⋮ 𝙉𝙤𝙩𝙖:
> 𝙎𝙞 𝙦𝙪𝙞𝙚𝙧𝙚𝙨 𝙦𝙪𝙚 𝙩𝙤𝙙𝙤𝙨 𝙡𝙤𝙨 𝙗𝙤𝙩𝙨 𝙫𝙪𝙚𝙡𝙫𝙖𝙣 𝙖 𝙧𝙚𝙨𝙥𝙤𝙣𝙙𝙚𝙧, 𝙪𝙨𝙖 𝙚𝙡 𝙘𝙤𝙢𝙖𝙣𝙙𝙤 *resetbot*.
`.trim()

await conn.sendMessage(m.chat, { text: response, mentions: [primaryJid, ...aliases] }, { quoted: m })
}

handler.help = ['setprimary <número/mención>']
handler.tags = ['owner', 'group']
handler.command = ['setprimary', 'setbot']
handler.group = true

export default handler
