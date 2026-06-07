function isCommand(text = '') {
return Boolean(global.prefix?.exec?.(text))
}
export async function before(m, {conn, isOwner, isROwner, isBotAdmin}) {
if (m.isBaileys && m.fromMe) return !0
if (m.fromMe || isOwner || isROwner) return !1
if (!m.isGroup) return !1
if (!m.message || !isCommand(m.text || '')) return !1
const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
if (chat.isBanned === false) return !1
if (chat.isBanned === true) {
m.__pluginHalt = true
return !0
}
const bot = global.db.data.settings[this.user.jid] || (global.db.data.settings[this.user.jid] = {})
const mode = bot.antiGroup
if (mode === 1 || mode === true) {
if (isBotAdmin) {
await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
} else {
await m.reply(`${global.emoji || '✦'} Anti grupos está activo, pero necesito ser admin para expulsar.`)
}
m.__pluginHalt = true
return !0
}
if (mode === 2) {
m.__pluginHalt = true
return !0
}
return !1
}
