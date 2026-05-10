import db from '../lib/database.js'
let handler = async (m, { conn, text }) => {
let who
if (m.isGroup) {
who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
} else {
who = m.chat
}
if (!who) return m.reply('⚠️ Por favor, menciona al usuario o cita un mensaje.')
if (who.includes('@lid')) return m.reply('⚠️ Error de identificación (LID). Por favor menciona al usuario (@etiqueta) en lugar de citarlo para asegurar la transacción.')
let user = global.db.data.users[who]
if (!user) {
user = global.db.data.users[who] = { exp: 0 }
}
let xpMatch = text.match(/(\d+)/)
if (!xpMatch) return m.reply('⚠️ Ingresa la cantidad de experiencia (XP) que deseas añadir.')
let xp = parseInt(xpMatch[0])
if (xp < 1) return m.reply('⚠️ El mínimo de experiencia (XP) para añadir es 1.')
user.exp += xp
conn.reply(m.chat, `✨ *XP AÑADIDO*\n\n» *Cantidad:* ${xp}\n» *Usuario:* @${who.split('@')[0]}\n» *Total:* ${user.exp}`, m, { mentions: [who] })
}
handler.command = ['añadirxp', 'addexp']
handler.rowner = true
export default handler