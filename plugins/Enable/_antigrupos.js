function isCommand(text = '') {
return Boolean(global.prefix?.exec?.(text))
}
export async function before(m, {conn, isOwner, isROwner}) {
if (m.isBaileys && m.fromMe) return !0
if (m.fromMe || isOwner || isROwner) return !1
if (!m.isGroup) return !1
if (!m.message || !isCommand(m.text || '')) return !1
const chat = global.db?.data?.chats?.[m.chat]
if (chat?.isBanned === false) return !1
if (chat?.isBanned === true) {
m.__pluginHalt = true
return !0
}
const settings = global.db?.data?.settings?.[this.user.jid] || {}
const mode = settings.antiGroup
if (!mode || mode === 0 || mode === false) return !1
m.__pluginHalt = true
return !0
}
