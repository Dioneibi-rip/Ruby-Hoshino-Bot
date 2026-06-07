function isEssentialPrivateCommand(text = '') {
const normalized = text.toLowerCase().trim()
return /^(#|\.|!|\/)?(serbot|jadibot|code|qr|stop|ppt|piedra|papel|tijera|math|mates|matematicas|ttt|tictactoe|suit|suitpvp)\b/.test(normalized)
}
function getBotSettings(conn) {
const jid = conn?.user?.jid
return jid ? global.db?.data?.settings?.[jid] || {} : {}
}
export async function before(m, {isOwner, isROwner}) {
if (m.isBaileys && m.fromMe) return !0
if (m.fromMe || isOwner || isROwner) return !1
if (m.isGroup) return !1
if (!m.message) return !0
if (m.chat === '120363322713003916@newsletter') return !1
if (isEssentialPrivateCommand(m.text || '')) return !1
const chat = global.db?.data?.chats?.[m.chat]
if (chat?.isBanned === false) return !1
const mode = getBotSettings(this).antiPrivate
if (!mode || mode === 0 || mode === false) return !1
if (mode === 1 || mode === true) {
await m.reply(`${global.emoji || '✦'} Hola @${m.sender.split`@`[0]}, mi creador ha desactivado los comandos en chats privados. Serás bloqueado; si quieres usar los comandos del bot te invito a unirte al grupo principal.\n\n${global.gp1 || ''}`, false, {mentions: [m.sender]})
await this.updateBlockStatus(m.chat, 'block')
m.__pluginHalt = true
return !0
}
if (mode === 2) {
m.__pluginHalt = true
return !0
}
return !1
}
