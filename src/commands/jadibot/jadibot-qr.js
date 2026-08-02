import { renderNativeQr } from '../../utils/nativeQr.js'
import { createSubbotSocket, destroySubbotSession } from '../../core/subbot-engine.js'

const requestCooldown = new Map()
const COOLDOWN_MS = 120000

function isCoolingDown(jid) {
const until = requestCooldown.get(jid) || 0
if (until > Date.now()) return true
requestCooldown.delete(jid)
return false
}

function setCooldown(jid) {
requestCooldown.set(jid, Date.now() + COOLDOWN_MS)
setTimeout(() => requestCooldown.delete(jid), COOLDOWN_MS).unref?.()
}

let handler = async (m, { conn }) => {
if (isCoolingDown(m.sender)) return conn.reply(m.chat, '⏳ Tu QR sigue activo. Espera 2 minutos antes de pedir otra vinculación.', m)
setCooldown(m.sender)
try {
await destroySubbotSession(m.sender).catch(() => false)
await createSubbotSocket({
ownerJid: m.sender,
sessionId: m.sender,
mode: 'qr',
parentConn: conn,
onQr: async qr => {
const qrText = await renderNativeQr(qr)
await conn.reply(m.chat, '🤖 Escanea este QR desde WhatsApp > Dispositivos vinculados > Vincular un dispositivo. Si expira, espera 2 minutos y solicita otro con #qr.\n\n```\n' + qrText + '\n```', m)
}
})
} catch (error) {
requestCooldown.delete(m.sender)
return conn.reply(m.chat, `🥀 No se pudo iniciar el QR: ${error.message}`, m)
}
}
handler.help = ['qr']
handler.tags = ['jadibot']
handler.command = ['qr']
export default handler
