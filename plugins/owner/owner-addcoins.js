let handler = async (m, { conn, text }) => {
let who
if (m.isGroup) {
who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
} else {
who = m.chat
}
if (!who) return m.reply('⚠️ Menciona al usuario o cita un mensaje.')
if (who.endsWith('@lid')) {
try {
const pp = await conn.groupMetadata(m.chat)
const dbUser = pp.participants.find(u => u.lid === who)
if (dbUser && dbUser.id) who = dbUser.id
} catch (e) { console.error('[addcoin] Error resolviendo LID:', e) }
}
if (who.includes('@s.whatsapp.net')) {
who = who.split(':')[0] + '@s.whatsapp.net'
}
let txt = text.replace('@' + who.split('@')[0], '').trim()
let dmt
if (txt.toLowerCase().includes('all') || txt.toLowerCase().includes('todo')) {
return m.reply('⚠️ Usa una cantidad válida. `all` no aplica para dar dinero.')
} else {
let cleanNum = txt.replace(/[^\d]/g, '')
if (!cleanNum) return m.reply('⚠️ Ingresa la cantidad a dar.')
dmt = parseInt(cleanNum)
}
if (dmt <= 0) return m.reply('⚠️ La cantidad debe ser mayor a 0.')
try {
if (global.db && typeof global.db.addMoney === 'function') {
global.db.addMoney(who, dmt, 'coin')
} else {
let user = global.db.getUser(who)
if (typeof user.coin !== 'number') user.coin = 0
user.coin += dmt
if (global.db && typeof global.db.write === 'function') await global.db.write()
}
} catch (error) {
console.error(`[addcoin] No se pudo agregar dinero a ${who}:`, error)
return m.reply('❌ No se pudo actualizar la economía en SQLite. Revisa la consola.')
}
m.reply(`💰 *Dinero agregado*\n» ${dmt}\n👤 @${who.split('@')[0]}\n📥 Billetera`, null, { mentions: [who] })
}
handler.help = ['darcoin <@user> <cantidad>']
handler.tags = ['owner']
handler.command = ['darcoin', 'addcoin', 'givecoin']
handler.rowner = true
export default handler
