import { upsertBotProfile, resetBotProfile, sanitizePairingPrefix } from '../core/botProfileStore.js'
import { uploadAuto } from '../library/uploader.js'

function jidNum(jid = '') {
return String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '')
}

function sessionId(conn) {
return conn?.session?.id || conn?.user?.jid || 'primary'
}

function canManageBotProfile(m, conn, isROwner) {
const sender = jidNum(m.sender)
const owner = jidNum(conn?.session?.ownerJid)
const bot = jidNum(conn?.user?.jid || conn?.user?.id)
return Boolean(isROwner || sender && (sender === owner || sender === bot))
}

async function quotedMedia(m, mimeTest) {
const q = m.quoted ? m.quoted : m
const mime = (q.msg || q).mimetype || ''
if (!mimeTest.test(mime)) return null
const buffer = await q.download()
return { buffer, mime }
}

async function saveMedia(m, conn, field, mimeTest, okText) {
const media = await quotedMedia(m, mimeTest)
if (!media) return conn.reply(m.chat, '🥀 Responde al archivo multimedia correcto para configurar este campo.', m)
try {
const url = await uploadAuto(media.buffer, media.mime)
const profile = upsertBotProfile(sessionId(conn), { [field]: url })
conn.botProfile = profile
return conn.reply(m.chat, `${okText}\n${url}`, m)
} catch {
return conn.reply(m.chat, '🥀 No se pudo subir el archivo. Inténtalo nuevamente.', m)
}
}

let handler = async (m, { conn, text, command, usedPrefix, isROwner }) => {
if (!canManageBotProfile(m, conn, isROwner)) return conn.reply(m.chat, '🥀 Solo el creador del Sub-Bot, el número del Sub-Bot o el Owner Global puede editar este perfil.', m)
const cmd = String(command || '').toLowerCase()
if (cmd === 'setbotname') {
const value = String(text || '').trim()
if (value.length < 2 || value.length > 35) return conn.reply(m.chat, `🥀 Usa ${usedPrefix}setbotname <nombre> de 2 a 35 caracteres.`, m)
conn.botProfile = upsertBotProfile(sessionId(conn), { botName: value })
return conn.reply(m.chat, `✅ Nombre actualizado a *${conn.botProfile.botName}*.`, m)
}
if (cmd === 'setbotprefix') {
const value = String(text || '').trim()
if (value.length < 1 || value.length > 3) return conn.reply(m.chat, `🥀 Usa ${usedPrefix}setbotprefix <prefijo> de 1 a 3 caracteres.`, m)
conn.botProfile = upsertBotProfile(sessionId(conn), { customPrefix: value })
return conn.reply(m.chat, `✅ Prefijo actualizado a *${conn.botProfile.customPrefix}*.`, m)
}
if (cmd === 'setpairingprefix') {
const raw = String(text || '').trim().toUpperCase().replace(/-/g, '')
const value = sanitizePairingPrefix(raw)
if (value !== raw) return conn.reply(m.chat, `🥀 Usa solo A-Z y 0-9, de 2 a 10 caracteres.`, m)
conn.botProfile = upsertBotProfile(sessionId(conn), { pairingPrefix: value })
return conn.reply(m.chat, `✅ Pairing prefix actualizado a *${conn.botProfile.pairingPrefix}*.`, m)
}
if (cmd === 'setpairingimage') return saveMedia(m, conn, 'pairingImageUrl', /^image\//, '✅ Imagen del Pairing Code actualizada.')
if (cmd === 'setbotmenu') return saveMedia(m, conn, 'menuVideoUrl', /^(image|video)\//, '✅ Media del MenuAll actualizada.')
if (cmd === 'setmenubanner') return saveMedia(m, conn, 'individualMenuImageUrl', /^image\//, '✅ Banner de menús individuales actualizado.')
if (cmd === 'setbotwelcome') return saveMedia(m, conn, 'welcomeImageUrl', /^image\//, '✅ Bienvenida actualizada.')
if (cmd === 'setbotbye') return saveMedia(m, conn, 'goodbyeImageUrl', /^image\//, '✅ Despedida actualizada.')
if (cmd === 'resetbotprofile') {
conn.botProfile = resetBotProfile(sessionId(conn))
return conn.reply(m.chat, '✅ Perfil restablecido a Ruby Hoshino nativo.', m)
}
const p = conn.botProfile || {}
return conn.reply(m.chat, `╭─「 BOT PROFILE 」\n│ Nombre: ${p.botName || 'Ruby Hoshino'}\n│ Prefijo: ${p.customPrefix || '#'}\n│ Pairing: ${p.pairingPrefix || 'RUBY-CHAN'}\n│ Pairing image: ${p.pairingImageUrl ? 'Configurada' : 'Ruby nativo'}\n│ MenuAll: ${p.menuVideoUrl ? 'Configurado' : 'Ruby nativo'}\n│ Banner individual: ${p.individualMenuImageUrl ? 'Configurado' : 'Ruby nativo'}\n│ Welcome: ${p.welcomeImageUrl ? 'Configurado' : 'Ruby nativo'}\n│ Bye: ${p.goodbyeImageUrl ? 'Configurado' : 'Ruby nativo'}\n╰────────────`, m)
}
handler.help = ['setbotname', 'setbotprefix', 'setpairingprefix', 'setpairingimage', 'setbotmenu', 'setmenubanner', 'setbotwelcome', 'setbotbye', 'resetbotprofile', 'botprofile']
handler.tags = ['jadibot']
handler.command = ['setbotname', 'setbotprefix', 'setpairingprefix', 'setpairingimage', 'setbotmenu', 'setmenubanner', 'setbotwelcome', 'setbotbye', 'resetbotprofile', 'botprofile']
handler.botProfileOwner = true
export default handler
