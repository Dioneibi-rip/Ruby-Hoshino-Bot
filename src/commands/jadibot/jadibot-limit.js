import { subbotLimitInfo, updateSubbotLimit } from '../../config/subbot-limit.js'
let handler = async (m, { conn, text, isROwner }) => {
if (!isROwner) return conn.reply(m.chat, '🚫 Solo owners pueden administrar este límite.', m)
if (!text) {
const info = subbotLimitInfo()
return conn.reply(m.chat, `🤖 Límite actual de Sub-Bots: ${info.current}\nMáximo seguro: ${info.maxLimit}`, m)
}
try {
const limit = updateSubbotLimit(text.trim())
return conn.reply(m.chat, `✅ Límite de Sub-Bots actualizado a ${limit}.`, m)
} catch (error) {
return conn.reply(m.chat, `🥀 ${error.message}`, m)
}
}
handler.help = ['subbotlimit']
handler.tags = ['owner']
handler.owner = true
handler.command = ['subbotlimit', 'limitsubbots', 'setsubbotlimit']
export default handler
