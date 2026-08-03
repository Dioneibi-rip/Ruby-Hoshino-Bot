import { jidNormalizedUser } from '@whiskeysockets/baileys'

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
chat.primaryBotAliases = []
try { global.db?.sqlite?.prepare('DELETE FROM group_routing WHERE chat_id=?').run(chatId) } catch {}
if (global.db?.updateChat) global.db.updateChat(chatId, chat)
else if (global.db?.set) global.db.set('chats', chatId, chat)
else if (global.db?.data?.chats) global.db.data.chats[chatId] = chat
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
if (!silent) return m.reply(previous ? '✐ ¡Listo! Se restableció el bot primario del grupo.\n> A partir de ahora, todos los bots pueden volver a responder.' : '《✧》 No había ningún bot primario establecido, pero se limpió el enrutamiento del grupo.')
return true
}

let handler = async (m, { conn, isAdmin, isOwner, isROwner }) => {
if (!m.isGroup) return
if (!RESET_COMMANDS.includes(commandName(m))) return
if (!isAdmin && !isOwner && !isROwner) return m.reply('⚠️ Solo administradores pueden usar este comando.')
return resetPrimaryBot(m, conn)
}

handler.before = async function (m, { conn, isAdmin, isOwner, isROwner }) {
if (!m.isGroup) return false
if (!RESET_COMMANDS.includes(commandName(m))) return false
if (!isAdmin && !isOwner && !isROwner) {
await m.reply('⚠️ Solo administradores pueden usar este comando.')
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
