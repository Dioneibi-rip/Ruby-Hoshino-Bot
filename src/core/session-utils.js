export function normalizeSessionJid(connOrJid) {
const raw = typeof connOrJid === 'string'
? connOrJid
: (connOrJid?.user?.jid || connOrJid?.user?.id || connOrJid?.session?.id || '')
const jid = String(raw || '')
if (!jid) return ''
const [local, domain] = jid.split('@')
return domain ? `${local.split(':')[0]}@${domain}` : jid
}

export function isChatBannedForBot(chat = {}, botJid = '') {
const jid = normalizeSessionJid(botJid)
if (!chat || !jid) return false
if (chat.isBanned && typeof chat.isBanned === 'object') return chat.isBanned[jid] === true || chat.isBanned['*'] === true
if (Array.isArray(chat.bannedBots) && chat.bannedBots.includes(jid)) return true
return chat.isBanned === true
}

export function setChatBannedForBot(chat = {}, botJid = '', banned = true) {
const jid = normalizeSessionJid(botJid)
if (!jid) return false
if (!chat.isBanned || typeof chat.isBanned !== 'object') chat.isBanned = {}
if (banned) chat.isBanned[jid] = true
else delete chat.isBanned[jid]
chat.bannedBots = Object.entries(chat.isBanned).filter(([, value]) => value === true).map(([key]) => key)
return true
}

export function getAntiPrivateState(settings = {}) {
const value = settings?.antiPrivate
if (value === 'block' || value === true || value === 1) return 'block'
if (value === 'ignore' || value === 2) return 'ignore'
return 'off'
}

export function getPrimaryBotJid(chat = {}) {
return normalizeSessionJid(chat?.primaryBot || chat?.botPrimario || '')
}

export function isPrimaryBotForChat(chat = {}, connOrJid = '') {
const primaryBot = getPrimaryBotJid(chat)
if (!primaryBot) return true
return normalizeSessionJid(connOrJid) === primaryBot
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
