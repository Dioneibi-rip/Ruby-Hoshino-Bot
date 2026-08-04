import { uploadAuto, resolveUploadLink } from '../../library/uploader.js'

function sessionJid(conn) {
return conn?.user?.jid || conn?.user?.id || conn?.session?.id || 'primary'
}

function ensureBotConfig(conn) {
const jid = sessionJid(conn)
global.db.data ||= {}
global.db.data.bots ||= {}
global.db.data.bots[jid] ||= {}
return global.db.data.bots[jid]
}

async function getQuotedStaticImage(m) {
const q = m.quoted || m
const msg = q.msg || q
const mime = String(msg.mimetype || '')
if (!/^image\/(?!gif$)/.test(mime)) return { error: 'type', mime }
const buffer = await q.download?.()
if (!buffer?.length) return { error: 'empty', mime }
if (buffer.length > 10 * 1024 * 1024) return { error: 'size', mime }
return { buffer, mime }
}

function warnImageHelp(usedPrefix = '.') {
return `┏━━━⏤͟͟͞͞★꙲⃝͟⚙️ *GUÍA DE WARN IMAGE* ━━━┓
┃
┃ 📌 *¿Qué hace?:*
┃ Cambia la imagen de previsualización usada en las advertencias interactivas de permisos de este Sub-Bot.
┃
┃ 📝 *Uso correcto:*
┃ Responde a una imagen estática con *${usedPrefix}setwarnimage* o *${usedPrefix}setwarnpic*.
┃
┃ 🧹 *Restablecer:*
┃ Usa *${usedPrefix}resetwarnimage* para volver al carrusel nativo de Ruby.
┃ Usa *${usedPrefix}setwarnmsg <tipo> <mensaje>* para personalizar textos.
┃
┃ ⚠️ *Formato permitido:*
┃ Solo imágenes estáticas. No GIF, video ni stickers animados.
┗━━━━⏤͟͟͞͞★꙲⃝͟🌸❈┉━━━━━━┛`
}

let handler = async (m, { conn, command, usedPrefix, text }) => {
const cmd = String(command || '').toLowerCase()
try {
if (cmd === 'setwarnmsg') {
const [type, ...rest] = String(text || '').trim().split(/\s+/)
const value = rest.join(' ').trim()
if (!type || !value) return conn.reply(m.chat, warnImageHelp(usedPrefix), m)
const config = ensureBotConfig(conn)
config.warningMsgs ||= {}
config.warningMsgs[type] = value
global.db?.scheduleFlush?.()
await global.db?.write?.()
return conn.reply(m.chat, `✅ Advertencia personalizada actualizada para *${type}*.`, m)
}
if (cmd === 'resetwarnmsg') {
const type = String(text || '').trim()
const config = ensureBotConfig(conn)
if (type && config.warningMsgs) delete config.warningMsgs[type]
else delete config.warningMsgs
global.db?.scheduleFlush?.()
await global.db?.write?.()
return conn.reply(m.chat, type ? `✅ Advertencia *${type}* restablecida.` : '✅ Todas las advertencias personalizadas fueron restablecidas.', m)
}
if (cmd === 'resetwarnimage') {
const config = ensureBotConfig(conn)
delete config.warnImage
global.db?.scheduleFlush?.()
await global.db?.write?.()
return conn.reply(m.chat, '✅ Imagen de advertencias restablecida. Ruby volverá a usar el carrusel nativo aleatorio.', m)
}
const media = await getQuotedStaticImage(m)
if (media?.error) return conn.reply(m.chat, warnImageHelp(usedPrefix), m)
const uploaded = await uploadAuto(media.buffer, media.mime)
const url = resolveUploadLink(uploaded)
if (!url) throw new Error('upload failed')
const config = ensureBotConfig(conn)
config.warnImage = url
global.db?.scheduleFlush?.()
await global.db?.write?.()
return conn.reply(m.chat, `✅ Imagen de advertencias actualizada.\nServidor: *${uploaded?.server || 'fallback'}*\nURL: ${url}`, m)
} catch (error) {
return conn.reply(m.chat, '🥀 No se pudo guardar la imagen de advertencias. Inténtalo nuevamente con otra imagen estática.', m)
}
}

handler.help = ['setwarnimage', 'setwarnpic', 'resetwarnimage', 'setwarnmsg <tipo> <mensaje>', 'resetwarnmsg [tipo]']
handler.tags = ['jadibot']
handler.command = ['setwarnimage', 'setwarnpic', 'resetwarnimage', 'setwarnmsg', 'resetwarnmsg']
handler.botProfileOwner = true
export default handler
