import { upsertBotProfile, resetBotProfile, sanitizePairingPrefix } from '../../core/botProfileStore.js'
import { uploadAuto, resolveUploadLink } from '../../library/uploader.js'
import { normalizeMenuCategory } from '../../core/menu-banner.js'

function jidNum(jid = '') {
return String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '')
}

function sessionId(conn) {
return conn?.user?.jid || conn?.session?.id || 'primary'
}

function canManageBotProfile(m, conn, isROwner) {
const sender = jidNum(m.sender)
const owner = jidNum(conn?.session?.ownerJid)
const bot = jidNum(conn?.user?.jid || conn?.user?.id)
return Boolean(isROwner || sender && (sender === owner || sender === bot))
}

async function quotedMedia(m, mimeTest) {
const q = m.quoted ? m.quoted : m
const msg = q.msg || q
const mime = msg.mimetype || ''
if (!mimeTest.test(mime)) return { error: 'type', mime }
const buffer = await q.download()
if (!buffer?.length) return { error: 'empty', mime }
if (buffer.length > 10 * 1024 * 1024) return { error: 'size', mime }
return { buffer, mime }
}

function mediaError(media, field, usedPrefix) {
if (media?.error === 'size') return `${mediaHelp(field, usedPrefix)}\n\n🥀 *Nota:* el archivo no debe superar 10 MB.`
if (media?.error === 'type' || media?.error === 'empty') return mediaHelp(field, usedPrefix)
return ''
}

function cleanVisibleText(value = '') {
return String(value).replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, '').trim()
}

async function saveMedia(m, conn, field, mimeTest, okText, usedPrefix, category = '', botMediaKey = '') {
const media = await quotedMedia(m, mimeTest)
if (!media || media.error) return conn.reply(m.chat, mediaError(media, field, usedPrefix) || mediaHelp(field, usedPrefix), m)
try {
const uploaded = await uploadAuto(media.buffer, media.mime)
const url = resolveUploadLink(uploaded)
if (!url) throw new Error('upload failed')
let patch = { [field]: url }
if (field === 'individualMenuImageUrl' && category) {
const meta = { ...(conn.botProfile?.meta || {}) }
const banners = { ...(meta.category_banners || {}) }
banners[normalizeMenuCategory(category)] = url
meta.category_banners = banners
patch = { meta }
}
if (botMediaKey) saveBotMenuMedia(conn, botMediaKey, url)
const profile = upsertBotProfile(sessionId(conn), patch)
conn.botProfile = profile
return conn.reply(m.chat, successCard(okText, url, uploaded?.server), m)
} catch {
return conn.reply(m.chat, '🥀 No se pudo subir el archivo al CDN ni a los respaldos. Inténtalo nuevamente con otro archivo.', m)
}
}

let handler = async (m, { conn, text, command, usedPrefix, isROwner }) => {
if (!canManageBotProfile(m, conn, isROwner)) return conn.reply(m.chat, '🥀 Solo el creador del Sub-Bot, el número del Sub-Bot o el Owner Global puede editar este perfil.', m)
const cmd = String(command || '').toLowerCase()
const prefix = usedPrefix || conn.botProfile?.customPrefix || '#'
if (cmd === 'setbotname' || cmd === 'botname') {
const value = cleanVisibleText(text)
if (value.length < 2 || value.length > 30) return conn.reply(m.chat, commandHelp(prefix, 'setbotname'), m)
conn.botProfile = upsertBotProfile(sessionId(conn), { botName: value })
return conn.reply(m.chat, `✅ *Nombre actualizado*\nAhora este Sub-Bot se presenta como *${conn.botProfile.botName}*.`, m)
}
if (cmd === 'setpackname' || cmd === 'setauthor' || cmd === 'setmoneda') {
const value = cleanVisibleText(text)
const maxLength = cmd === 'setmoneda' ? 20 : 40
if (value.length < 1 || value.length > maxLength) return conn.reply(m.chat, commandHelp(prefix, cmd), m)
const meta = { ...(conn.botProfile?.meta || {}) }
if (cmd === 'setpackname') meta.packname = value
if (cmd === 'setauthor') meta.author = value
if (cmd === 'setmoneda') meta.currencyName = value
conn.botProfile = upsertBotProfile(sessionId(conn), { meta })
return conn.reply(m.chat, `✅ *Configuración actualizada*\n${settingLabel(cmd)}: *${value}*.`, m)
}
if (cmd === 'setbotprefix' || cmd === 'setprefix' || cmd === 'prefix') {
const value = cleanVisibleText(text)
if (value.length < 1 || value.length > 3) return conn.reply(m.chat, commandHelp(prefix, 'setbotprefix'), m)
conn.botProfile = upsertBotProfile(sessionId(conn), { customPrefix: value })
return conn.reply(m.chat, `✅ *Prefijo actualizado*\nLos menús y ejemplos usarán *${conn.botProfile.customPrefix}*.`, m)
}
if (cmd === 'setpairingprefix' || cmd === 'setpairingcode' || cmd === 'setpprefix') {
const raw = String(text || '').trim().toUpperCase().replace(/-/g, '')
const value = sanitizePairingPrefix(raw)
if (value !== raw) return conn.reply(m.chat, commandHelp(prefix, 'setpprefix'), m)
conn.botProfile = upsertBotProfile(sessionId(conn), { pairingPrefix: value })
return conn.reply(m.chat, `✅ Pairing Code actualizado a *${conn.botProfile.pairingPrefix}*.`, m)
}
if (cmd === 'setpairingimage' || cmd === 'setpairingimg' || cmd === 'setpimg') return saveMedia(m, conn, 'pairingImageUrl', /^(image\/|video\/mp4$)/, '✅ Imagen del Pairing Code actualizada.', prefix)
if (cmd === 'setbotmenu' || cmd === 'setmenu') return saveMedia(m, conn, 'menuImageUrl', /^image\/(?!gif$)/, '✅ Imagen estática del Menú Principal actualizada.', prefix, '', 'menu')
if (cmd === 'setbotmenuall' || cmd === 'setmenuall' || cmd === 'setmenuallmedia') return saveMedia(m, conn, 'menuVideoUrl', /^(image\/|video\/mp4$)/, '✅ Media principal del MenuAll actualizada.', prefix, '', 'menuall')
if (cmd === 'setmenubanner' || cmd === 'setbanner' || cmd === 'banner') {
const category = normalizeMenuCategory(text || '')
const ok = category ? `✅ Banner de la categoría ${category} actualizado.` : '✅ Banner de menús individuales actualizado.'
return saveMedia(m, conn, 'individualMenuImageUrl', /^(image\/|video\/mp4$)/, ok, prefix, category)
}
if (cmd === 'setbotwelcome') return saveMedia(m, conn, 'welcomeImageUrl', /^image\//, '✅ Bienvenida actualizada.', prefix)
if (cmd === 'setbotbye') return saveMedia(m, conn, 'goodbyeImageUrl', /^image\//, '✅ Despedida actualizada.', prefix)
if (cmd === 'resetbotprofile') {
conn.botProfile = resetBotProfile(sessionId(conn))
return conn.reply(m.chat, `✅ Perfil restablecido a ${conn.botProfile.botName || 'Ruby Hoshino'} nativo.`, m)
}
return conn.reply(m.chat, profileCard(conn.botProfile || {}, prefix), m)
}

function saveBotMenuMedia(conn, key, url) {
const jid = conn?.user?.jid || conn?.user?.id || sessionId(conn)
if (!jid || !global.db?.data) return
global.db.data.bots ||= {}
global.db.data.bots[jid] ||= {}
global.db.data.bots[jid][key] = url
global.db?.scheduleFlush?.()
}

function settingLabel(cmd) {
return ({ setpackname: 'Pack de stickers', setauthor: 'Autor de stickers', setmoneda: 'Moneda RPG' })[cmd] || 'Valor'
}

function commandHelp(usedPrefix, cmd) {
const map = {
setbotname: ['NOMBRE SUB-BOT', 'Cambia el nombre visible en menús, saludos y respuestas del Sub-Bot.', `${usedPrefix}setbotname Luna Bot`, `${usedPrefix}setbotname Ruby Mini`],
setbotprefix: ['PREFIJO SUB-BOT', 'Cambia el prefijo sugerido para ejecutar comandos en este Sub-Bot.', `${usedPrefix}setbotprefix !`, `${usedPrefix}setbotprefix /`],
setpprefix: ['PAIRING SUB-BOT', 'Cambia el texto inicial del código de vinculación. Usa solo A-Z y 0-9, de 2 a 10 caracteres.', `${usedPrefix}setpprefix LUNA2026`, `${usedPrefix}setpprefix RUBY26`],
setpackname: ['PACK STICKERS SUB-BOT', 'Cambia el nombre de paquete usado por los stickers del Sub-Bot.', `${usedPrefix}setpackname Ruby Stickers`, `${usedPrefix}setpackname Luna Pack`],
setauthor: ['AUTOR STICKERS SUB-BOT', 'Cambia el autor usado por los stickers del Sub-Bot.', `${usedPrefix}setauthor Dioneibi`, `${usedPrefix}setauthor Ruby Bot`],
setmoneda: ['MONEDA SUB-BOT', 'Cambia el nombre de la moneda para economía y RPG del Sub-Bot.', `${usedPrefix}setmoneda RubyCoins`, `${usedPrefix}setmoneda Cristales`]
}
const item = map[cmd] || map.setbotname
return `┏━━━⏤͟͟͞͞★꙲⃝͟⚙️ *GUÍA DE ${item[0]}* ━━━┓
┃
┃ 📌 *¿Qué hace?:*
┃ ${item[1]}
┃
┃ 🎯 *Área afectada:*
┃ Configuración visual y funcional exclusiva del sistema de Sub-Bots.
┃
┃ 📝 *Uso correcto:*
┃ Escribe el comando seguido del valor nuevo.
┃
┃ 💡 *Ejemplos:*
┃ ${item[2]}
┃ ${item[3]}
┗━━━━⏤͟͟͞͞★꙲⃝͟🌸❈┉━━━━━━┛`
}

function mediaHelp(field, usedPrefix) {
const cards = {
pairingImageUrl: ['PAIRING IMAGE SUB-BOT', 'Cambia la imagen mostrada en la guía de vinculación del Sub-Bot.', 'Guía y flujo de conexión del Sub-Bot.', `Responde a una imagen con ${usedPrefix}setpimg`, 'Responde a una foto escribiendo: `' + usedPrefix + 'setpimg`'],
menuImageUrl: ['MENÚ PRINCIPAL SUB-BOT', 'Cambia exclusivamente la imagen estática del Menú Principal del Sub-Bot.', 'Portada del comando de menú principal (.menu / main-menulist). main-menulist SOLO acepta imágenes estáticas porque WhatsApp rompe los botones con videos o GIF.', `Responde a una imagen con ${usedPrefix}setbotmenu`, 'Responde a una foto escribiendo: `' + usedPrefix + 'setbotmenu`'],
menuVideoUrl: ['MENÚ COMPLETO SUB-BOT', 'Cambia la imagen, GIF o video principal del MenuAll del Sub-Bot.', 'Menú completo y presentación principal del Sub-Bot.', `Responde a una imagen, GIF o video con ${usedPrefix}setbotmenuall`, 'Responde a un video escribiendo: `' + usedPrefix + 'setbotmenuall`'],
individualMenuImageUrl: ['BANNER SUB-BOT', 'Cambia la imagen banner de los menús individuales.', 'Menús por categoría (NSFW, Descargas, etc.), MenuManual, MenuJadibot o menú principal.', `Responde a una imagen con ${usedPrefix}setbanner o ${usedPrefix}setbanner [categoría]`, 'Responde a una foto escribiendo: `' + usedPrefix + 'setbanner nsfw`'],
welcomeImageUrl: ['BIENVENIDA SUB-BOT', 'Cambia la imagen de bienvenida del Sub-Bot.', 'Mensajes automáticos de bienvenida en grupos.', `Responde a una imagen con ${usedPrefix}setbotwelcome`, 'Responde a una foto escribiendo: `' + usedPrefix + 'setbotwelcome`'],
goodbyeImageUrl: ['DESPEDIDA SUB-BOT', 'Cambia la imagen de despedida del Sub-Bot.', 'Mensajes automáticos de salida en grupos.', `Responde a una imagen con ${usedPrefix}setbotbye`, 'Responde a una foto escribiendo: `' + usedPrefix + 'setbotbye`']
}
const [title, what, area, usage, example] = cards[field]
const categories = field === 'individualMenuImageUrl' ? `
┃
┃ 🏷️ *Categorías válidas:*
┃ • menu
┃ • menujadibot
┃ • menumanual
┃ • nsfw
┃ • descargas
┃ • busquedas
┃ • stickers
┃ • economia
┃ • gacha
┃ • grupos
┃ • admin
┃ • ia
┃ • herramientas
┃ • anime
┃ • juegos` : ''
return `┏━━━⏤͟͟͞͞★꙲⃝͟⚙️ *GUÍA DE ${title}* ━━━┓
┃
┃ 📌 *¿Qué hace?:*
┃ ${what}
┃
┃ 🎯 *Área afectada:*
┃ ${area}
┃
┃ 📝 *Uso correcto:*
┃ ${usage}${categories}
┃
┃ 💡 *Ejemplo:*
┃ ${example}
┗━━━━⏤͟͟͞͞★꙲⃝͟🌸❈┉━━━━━━┛`
}

function successCard(okText, url, server) {
return `${okText}\nServidor: *${server || 'fallback'}*\nURL: ${url}`
}

function profileCard(p, usedPrefix) {
return `╭─「 SUB-BOT CONFIG 」\n│ Nombre: ${p.botName || 'Ruby Hoshino'}\n│ Prefijo: ${p.customPrefix || usedPrefix || '#'}\n│ Pairing Code: ${p.pairingPrefix || 'RUBY-CHAN'}\n│ Pairing image: ${p.pairingImageUrl ? '✅ Configurada' : '🧩 Nativa'}\n│ Menú principal: ${p.menuImageUrl ? '✅ Configurada' : '🧩 Nativa'}
│ MenuAll media: ${p.menuVideoUrl ? '✅ Configurada' : '🧩 Nativa'}\n│ Banner menús: ${p.individualMenuImageUrl ? '✅ Configurado' : '🧩 Nativo'}\n│ Welcome: ${p.welcomeImageUrl ? '✅ Configurado' : '🧩 Nativo'}\n│ Bye: ${p.goodbyeImageUrl ? '✅ Configurado' : '🧩 Nativo'}\n╰────────────\n\n╭─「 MINI TUTORIAL 」\n│ ${usedPrefix}setbotname Luna Bot\n│ ${usedPrefix}setbotprefix !\n│ ${usedPrefix}setbotmenu responde a imagen estática\n│ ${usedPrefix}setbotmenuall responde a imagen/video/gif\n│ ${usedPrefix}setbanner nsfw responde a imagen\n│ ${usedPrefix}setpprefix LUNA2026\n│ ${usedPrefix}setpimg responde a imagen\n╰────────────`
}

handler.help = ['setbotname', 'botname', 'setbotprefix', 'setprefix', 'setpprefix', 'setpimg', 'setbotmenu', 'setmenu', 'setbotmenuall', 'setmenuall', 'setbanner <categoría>', 'setpackname', 'setauthor', 'setmoneda', 'setbotwelcome', 'setbotbye', 'resetbotprofile', 'botprofile']
handler.tags = ['jadibot']
handler.command = ['setbotname', 'botname', 'setbotprefix', 'setprefix', 'prefix', 'setpairingprefix', 'setpairingcode', 'setpprefix', 'setpairingimage', 'setpairingimg', 'setpimg', 'setbotmenu', 'setmenu', 'setbotmenuall', 'setmenuall', 'setmenuallmedia', 'setmenubanner', 'setbanner', 'banner', 'setpackname', 'setauthor', 'setmoneda', 'setbotwelcome', 'setbotbye', 'resetbotprofile', 'botprofile', 'subbotconfig']
handler.botProfileOwner = true
export default handler
