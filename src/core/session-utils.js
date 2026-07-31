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
return chat?.isBanned === true ? ['primary'] : []
}

export function isChatBannedForBot(chat = {}, botJid = '') {
const jid = normalizeSessionJid(botJid) || 'primary'
const chatId = chat?.id || chat?.chat || chat?.jid || ''
try {
if (chatId && global.db?.sqlite?.prepare('SELECT 1 FROM bot_chat_bans WHERE bot_jid=? AND chat_id=? AND banned=1').get(jid, chatId)) return true
} catch {}
if (chat?.isBanned === true) return true
return Boolean(chat?.isBanned?.['*'] || chat?.isBanned?.[jid] || chat?.botSettings?.[jid]?.isBanned)
}

export function setChatBannedForBot(chat = {}, botJid = '', banned = true) {
const jid = normalizeSessionJid(botJid) || 'primary'
const chatId = chat?.id || chat?.chat || chat?.jid || ''
try {
if (chatId && banned) global.db?.sqlite?.prepare('INSERT INTO bot_chat_bans(bot_jid,chat_id,banned,updated_at) VALUES(?,?,1,?) ON CONFLICT(bot_jid,chat_id) DO UPDATE SET banned=1, updated_at=excluded.updated_at').run(jid, chatId, Date.now())
if (chatId && !banned) global.db?.sqlite?.prepare('DELETE FROM bot_chat_bans WHERE bot_jid=? AND chat_id=?').run(jid, chatId)
} catch {}
if (!chat.isBanned || typeof chat.isBanned !== 'object') chat.isBanned = {}
if (banned) chat.isBanned[jid] = true
else delete chat.isBanned[jid]
return true
}

export function getAntiPrivateState(settings = {}) {
const value = settings?.antiPrivate
if (value === 'block' || value === true || value === 1) return 'block'
if (value === 'ignore' || value === 2) return 'ignore'
return 'off'
}

export function shouldSilenceChatForBot(chat = {}, connOrJid = '') {
const jid = normalizeSessionJid(connOrJid) || 'primary'
const chatId = chat?.id || chat?.chat || chat?.jid || ''
try {
const primary = chatId ? global.db?.sqlite?.prepare('SELECT primary_bot_jid FROM group_routing WHERE chat_id=?').get(chatId)?.primary_bot_jid : ''
if (primary && normalizeSessionJid(primary) !== jid) return true
} catch {}
return isChatBannedForBot(chat, jid)
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

export function resetChatBotRouting(chat = {}) {
if (!chat || typeof chat !== 'object') return chat
chat.isBanned = false
if (chat.id || chat.chat || chat.jid) {
try { global.db?.sqlite?.prepare('DELETE FROM group_routing WHERE chat_id=?').run(chat.id || chat.chat || chat.jid) } catch {}
}
return chat
}
