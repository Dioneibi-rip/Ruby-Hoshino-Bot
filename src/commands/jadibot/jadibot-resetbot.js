import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { resetChatBotRouting } from '../../core/session-utils.js'
import { replyWithFkontak } from '../../core/notice.js'

const RESET_COMMANDS = ['resetbot', 'resetprimary', 'delprimary']
const resetLocks = global.__primaryBotResetLocks ||= new Map()

function normalizeJid(jid = '') {
return jidNormalizedUser(jid) || jid
}

function commandName(m = {}) {
return m.text?.trim?.().toLowerCase().replace(/^[./#!]/, '').split(/\s+/)[0] || ''
}

function clearPrimaryBot(chatId = '') {
const chat = global.db?.getChat?.(chatId) || global.db?.data?.chats?.[chatId] || {}
chat.primaryBot = null
chat.botPrimario = null
chat.primaryBotJid = null
chat.primaryBotAliases = []
chat.isBanned = false
chat.banned = false
chat.mute = false
chat.muted = false
chat.isMuted = false
chat.botSettings = {}
if (!chat.id && !chat.chat && !chat.jid) chat.id = chatId
resetChatBotRouting(chat)
try { global.db?.sqlite?.prepare('DELETE FROM group_routing WHERE chat_id=?').run(chatId) } catch {}
try { global.db?.sqlite?.prepare('DELETE FROM bot_chat_bans WHERE chat_id=?').run(chatId) } catch {}
if (global.db?.updateChat) global.db.updateChat(chatId, chat)
else if (global.db?.set) global.db.set('chats', chatId, chat)
if (global.db?.data?.chats) global.db.data.chats[chatId] = chat
global.db?.scheduleFlush?.()
return chat
}

async function resetPrimaryBot(m, conn, { silent = false } = {}) {
const lockKey = `${m.chat}:${m.id || m.key?.id || Date.now()}`
if (resetLocks.has(lockKey)) return true
resetLocks.set(lockKey, Date.now())
setTimeout(() => resetLocks.delete(lockKey), 30000).unref?.()
const previous = normalizeJid((global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat] || {}).primaryBot || (global.db?.getChat?.(m.chat) || global.db?.data?.chats?.[m.chat] || {}).botPrimario || '')
clearPrimaryBot(m.chat)
await global.db?.write?.()
if (!silent) {
const notice = previous
? '✧ ᥣіs𝗍᥆! sᥱ rᥱs𝗍ᥲbᥣᥱᥴі᥆ ᥱᥣ b᥆𝗍 ⍴rіmᥲrі᥆ ძᥱᥣ grᥙ⍴᥆.\n\n» ᥲ ⍴ᥲr𝗍іr ძᥱ ᥲh᥆rᥲ 𝗍᥆ძ᥆s ᥣ᥆s b᥆𝗍s ⍴ᥙᥱძᥱᥒ v᥆ᥣvᥱr ᥲ rᥱs⍴᥆ᥒძᥱr.\n» sᥱ ᥣіm⍴і᥆ ᥱᥣ ᥱs𝗍ᥲძ᥆ ძᥱ mᥙ𝗍ᥱ y bᥲᥒ ძᥱᥣ ᥴhᥲ𝗍.'
: '✧ ᥒ᥆ hᥲbіᥲ ᥒіᥒgᥙᥒ b᥆𝗍 ⍴rіmᥲrі᥆ ᥱs𝗍ᥲbᥣᥱᥴіძ᥆, ⍴ᥱr᥆ sᥱ ᥣіm⍴і᥆ ᥱᥣ ᥱᥒrᥙ𝗍ᥲmіᥱᥒ𝗍᥆ y ᥱᥣ ᥱs𝗍ᥲძ᥆ ძᥱᥣ grᥙ⍴᥆.'
return replyWithFkontak(conn, m, notice, { name: '✧ Rᥙby H᥆shіᥒ᥆ · Rᥱsᥱ𝗍 ძᥱ b᥆𝗍' })
}
return true
}

let handler = async (m, { conn, isAdmin, isOwner, isROwner }) => {
if (!m.isGroup) return
if (!RESET_COMMANDS.includes(commandName(m))) return
if (!isAdmin && !isOwner && !isROwner) return replyWithFkontak(conn, m, '(,,•᷄‎ࡇ•᷅ ,,)? s᥆ᥣ᥆ ᥣ᥆s ᥲძmіᥒіs𝗍rᥲძ᥆rᥱs ⍴ᥙᥱძᥱᥒ ᥙsᥲr ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆.', { name: '✘ Rᥙby H᥆shіᥒ᥆ · S᥆ᥣ᥆ ᥲძmіᥒ' })
return resetPrimaryBot(m, conn)
}

handler.before = async function (m, { conn, isAdmin, isOwner, isROwner }) {
if (!m.isGroup) return false
if (!RESET_COMMANDS.includes(commandName(m))) return false
if (!isAdmin && !isOwner && !isROwner) {
await replyWithFkontak(conn, m, '(,,•᷄‎ࡇ•᷅ ,,)? s᥆ᥣ᥆ ᥣ᥆s ᥲძmіᥒіs𝗍rᥲძ᥆rᥱs ⍴ᥙᥱძᥱᥒ ᥙsᥲr ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆.', { name: '✘ Rᥙby H᥆shіᥒ᥆ · S᥆ᥣ᥆ ᥲძmіᥒ' })
return true
}
await resetPrimaryBot(m, conn, { silent: false })
return true
}
handler.help = ['resetbot', 'resetprimary', 'delprimary']
handler.tags = ['jadibot']
handler.command = ['resetbot', 'resetprimary', 'delprimary']
handler.group = true
handler.admin = true
export default handler
