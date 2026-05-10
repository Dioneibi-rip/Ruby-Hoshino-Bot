import db from '../lib/database.js'
let handler = async (m, { conn, text }) => {
let who
if (m.isGroup) {
who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
} else {
who = m.chat
}
if (!who) return m.reply('⚠️ Por favor, menciona al usuario o cita un mensaje.')
if (who.includes('@lid')) return m.reply('⚠️ Error de identificación (LID). Por favor menciona al usuario (@etiqueta) en lugar de citarlo.')
let user = global.db.data.users[who]
if (!user) {
user = global.db.data.users[who] = { exp: 0 }
}
let dmt
if (text.toLowerCase().includes('all') || text.toLowerCase().includes('todo')) {
dmt = user.exp
} else {
let xpMatch = text.match(/(\d+)/)
if (!xpMatch) return m.reply('⚠️ Ingresa la cantidad de XP que deseas quitar.')
dmt = parseInt(xpMatch[0])
}
if (user.exp < dmt) return m.reply(`⚠️ El usuario no tiene suficiente XP para quitar. Tiene ${user.exp} XP.`)
user.exp -= dmt
conn.reply(m.chat, `✨ *XP QUITADO*\n\n» *Cantidad:* ${dmt}\n» *Usuario:* @${who.split('@')[0]}\n» *Restante:* ${user.exp}`, m, { mentions: [who] })
}
handler.help = ['quitarxp *<@user>*']
handler.tags = ['owner']
handler.command = ['quitarxp', 'removexp']
handler.rowner = true
export default handler