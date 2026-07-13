export function normalizeSessionJid(connOrJid) {
const raw = typeof connOrJid === 'string'
? connOrJid
: (connOrJid?.user?.jid || connOrJid?.user?.id || connOrJid?.session?.id || '')
const jid = String(raw || '').trim().toLowerCase()
if (!jid) return ''
const [local, domain] = jid.split('@')
if (domain) return `${local.split(':')[0]}@${domain}`
return /^\d+$/.test(local) ? `${local}@s.whatsapp.net` : local
}

export function getChatBotSettings(chat = {}, botJid = '') {
const jid = normalizeSessionJid(botJid)
if (!chat || !jid) return null
if (!chat.botSettings || typeof chat.botSettings !== 'object') chat.botSettings = {}
if (!chat.botSettings[jid] || typeof chat.botSettings[jid] !== 'object') chat.botSettings[jid] = {}
return chat.botSettings[jid]
}

export function getChatBannedBots(chat = {}) {
return Object.entries(chat?.botSettings || {})
.filter(([, value]) => value?.isBanned === true)
.map(([jid]) => jid)
}

export function isChatBannedForBot(chat = {}, botJid = '') {
const jid = normalizeSessionJid(botJid)
if (!chat || !jid) return false
const botSettings = chat.botSettings?.[jid]
if (botSettings?.isBanned === true) return true
if (botSettings?.isBanned === false) return false
if (chat.isBanned && typeof chat.isBanned === 'object') return chat.isBanned[jid] === true || chat.isBanned['*'] === true
if (Array.isArray(chat.bannedBots) && chat.bannedBots.includes(jid)) return true
return chat.isBanned === true
}

export function setChatBannedForBot(chat = {}, botJid = '', banned = true) {
const jid = normalizeSessionJid(botJid)
if (!jid) return false
const botSettings = getChatBotSettings(chat, jid)
botSettings.isBanned = Boolean(banned)
if (!chat.isBanned || typeof chat.isBanned !== 'object') chat.isBanned = {}
delete chat.isBanned[jid]
chat.bannedBots = getChatBannedBots(chat)
return true
}

export function getAntiPrivateState(settings = {}) {
const value = settings?.antiPrivate
if (value === 'block' || value === true || value === 1) return 'block'
if (value === 'ignore' || value === 2) return 'ignore'
return 'off'
}

export function getPrimaryBotJid(chat = {}) {
const value = chat?.primaryBot || chat?.botPrimario || ''
return normalizeSessionJid(value)
}

export function getPrimaryBotJids(chat = {}) {
const primary = getPrimaryBotJid(chat)
const aliases = Array.isArray(chat?.primaryBotAliases) ? chat.primaryBotAliases : []
return [...new Set([primary, ...aliases.map(alias => normalizeSessionJid(alias))].filter(Boolean))]
}

export function isPrimaryBotForChat(chat = {}, connOrJid = '') {
const primaryBots = getPrimaryBotJids(chat)
if (!primaryBots.length) return true
return primaryBots.includes(normalizeSessionJid(connOrJid))
}

export function shouldSilenceChatForBot(chat = {}, connOrJid = '') {
return isChatBannedForBot(chat, connOrJid) || !isPrimaryBotForChat(chat, connOrJid)
}

export function isGlobalOwner(sender = '') {
const senderNum = String(sender || '').split('@')[0].replace(/[^0-9]/g, '')
const owners = Array.isArray(global.owner) ? global.owner : []
return owners.some((owner) => String(owner?.[1] || '').toLowerCase().includes('dioneibi') && senderNum === String(owner?.[0] || '').replace(/[^0-9]/g, ''))
}

export function isBotCreator(sender = '', connOrJid = '') {
return Boolean(sender && normalizeSessionJid(sender) === normalizeSessionJid(connOrJid))
}

export function canManageBotSecurity(sender = '', connOrJid = '') {
return isGlobalOwner(sender) || isBotCreator(sender, connOrJid)
}
