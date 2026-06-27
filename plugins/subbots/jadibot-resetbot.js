function runPrimaryBotSqlReset(chatId) {
if (!global.db?.sqlite || !chatId) return false
const table = global.db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chats'").get()
if (!table) return false
const columns = global.db.sqlite.prepare('PRAGMA table_info(chats)').all().map(({ name }) => name)
const idColumn = columns.includes('id') ? 'id' : columns.includes('chat_id') ? 'chat_id' : null
const primaryColumns = ['primary_bot', 'primaryBot', 'botPrimario'].filter(column => columns.includes(column))
if (!idColumn || primaryColumns.length === 0) return false
const assignments = primaryColumns.map(column => `"${column.replace(/"/g, '""')}" = NULL`).join(', ')
global.db.sqlite.prepare(`UPDATE chats SET ${assignments} WHERE "${idColumn.replace(/"/g, '""')}" = ?`).run(chatId)
return true
}

async function resetPrimaryBot(m) {
if (!m.isGroup) throw '⚠️ Este comando solo puede usarse en grupos.'
const chat = global.db.getChat
? global.db.getChat(m.chat)
: ((global.db.data.chats ||= {})[m.chat] ||= {})
const hadPrimaryBot = Boolean(chat.primaryBot || chat.botPrimario)

if (global.db.updateChat) global.db.updateChat(m.chat, { primaryBot: null, botPrimario: null })
else {
chat.primaryBot = null
chat.botPrimario = null
if (global.db.set) global.db.set('chats', m.chat, chat)
}
runPrimaryBotSqlReset(m.chat)
await global.db.write?.()

return m.reply(`${hadPrimaryBot ? '✐ ¡Listo! Se ha restablecido la configuración.' : '《✧》 No había ningún bot primario establecido en este grupo.'}\n> A partir de ahora, todos los bots válidos responderán nuevamente en este grupo.`)
}

let handler = async (m) => resetPrimaryBot(m)

handler.help = ['resetbot', 'botreset']
handler.tags = ['jadibot']
handler.command = ['resetbot', 'botreset']
handler.group = true
handler.admin = true

export default handler
