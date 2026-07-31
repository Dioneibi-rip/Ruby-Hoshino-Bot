import { createSubbotSocket } from '../../core/subbot-engine.js'
let handler = async (m, { conn }) => {
try {
await createSubbotSocket({ ownerJid: m.sender, sessionId: m.sender, mode: 'qr', parentConn: conn })
return conn.reply(m.chat, '🤖 Sesión Sub-Bot creada. Revisa la terminal para escanear el QR.', m)
} catch (error) {
return conn.reply(m.chat, `🥀 No se pudo iniciar el QR: ${error.message}`, m)
}
}
handler.help = ['qr']
handler.tags = ['jadibot']
handler.command = ['qr']
export default handler
