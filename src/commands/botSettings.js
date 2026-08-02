import { upsertBotProfile, resetBotProfile, sanitizePairingPrefix } from '../core/botProfileStore.js'
import { uploadAuto, resolveUploadLink } from '../library/uploader.js'
import { normalizeMenuCategory } from '../core/menu-banner.js'

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

async function saveMedia(m, conn, field, mimeTest, okText, usedPrefix, category = '') {
const media = await quotedMedia(m, mimeTest)
if (!media) return conn.reply(m.chat, mediaHelp(field, usedPrefix), m)
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
if (cmd === 'setbotname') {
const value = String(text || '').trim()
if (value.length < 2 || value.length > 35) return conn.reply(m.chat, commandHelp(prefix, 'setbotname'), m)
conn.botProfile = upsertBotProfile(sessionId(conn), { botName: value })
return conn.reply(m.chat, `✅ *Nombre actualizado*\nAhora este Sub-Bot se presenta como *${conn.botProfile.botName}*.`, m)
}
if (cmd === 'setbotprefix') {
const value = String(text || '').trim()
if (value.length < 1 || value.length > 3) return conn.reply(m.chat, commandHelp(prefix, 'setbotprefix'), m)
conn.botProfile = upsertBotProfile(sessionId(conn), { customPrefix: value })
return conn.reply(m.chat, `✅ *Prefijo actualizado*\nLos menús y ejemplos usarán *${conn.botProfile.customPrefix}*.`, m)
}
if (cmd === 'setpairingprefix' || cmd === 'setpairingcode') {
const raw = String(text || '').trim().toUpperCase().replace(/-/g, '')
const value = sanitizePairingPrefix(raw)
if (value !== raw) return conn.reply(m.chat, commandHelp(prefix, 'setpairingprefix'), m)
conn.botProfile = upsertBotProfile(sessionId(conn), { pairingPrefix: value })
return conn.reply(m.chat, `✅ Pairing Code actualizado a *${conn.botProfile.pairingPrefix}*.`, m)
}
if (cmd === 'setpairingimage' || cmd === 'setpairingimg') return saveMedia(m, conn, 'pairingImageUrl', /^image\//, '✅ Imagen del Pairing Code actualizada.', prefix)
if (cmd === 'setbotmenu' || cmd === 'setmenu' || cmd === 'setmenuall') return saveMedia(m, conn, 'menuVideoUrl', /^(image|video)\//, '✅ Media principal del MenuAll actualizada.', prefix)
if (cmd === 'setmenubanner' || cmd === 'setbanner' || cmd === 'setmenuindiv') {
const category = normalizeMenuCategory(text || '')
const ok = category ? `✅ Banner de la categoría ${category} actualizado.` : '✅ Banner de menús individuales actualizado.'
return saveMedia(m, conn, 'individualMenuImageUrl', /^image\//, ok, prefix, category)
}
if (cmd === 'setbotwelcome') return saveMedia(m, conn, 'welcomeImageUrl', /^image\//, '✅ Bienvenida actualizada.', prefix)
if (cmd === 'setbotbye') return saveMedia(m, conn, 'goodbyeImageUrl', /^image\//, '✅ Despedida actualizada.', prefix)
if (cmd === 'resetbotprofile') {
conn.botProfile = resetBotProfile(sessionId(conn))
return conn.reply(m.chat, `✅ Perfil restablecido a ${conn.botProfile.botName || 'Ruby Hoshino'} nativo.`, m)
}
return conn.reply(m.chat, profileCard(conn.botProfile || {}, prefix), m)
}

function commandHelp(usedPrefix, cmd) {
const map = {
setbotname: ['Nombre visible', `${usedPrefix}setbotname Luna Bot`, 'Cambia el nombre mostrado en menús y textos del Sub-Bot.'],
setbotprefix: ['Prefijo dinámico', `${usedPrefix}setbotprefix !`, 'Cambia el prefijo sugerido en menús y ejemplos.'],
setpairingprefix: ['Pairing Code', `${usedPrefix}setpairingprefix LUNA2026`, 'Cambia el texto inicial del código de vinculación. Solo A-Z y 0-9, de 2 a 10 caracteres.']
}
const item = map[cmd]
return `╭─「 AYUDA DE CONFIGURACIÓN 」\n│ Campo: ${item[0]}\n│ Formato: ${item[1]}\n│ Acción: ${item[2]}\n╰────────────`
}

function mediaHelp(field, usedPrefix) {
const cards = {
pairingImageUrl: ['Imagen del Pairing Code', `${usedPrefix}setpairingimage`, 'imagen'],
menuVideoUrl: ['Media principal del MenuAll', `${usedPrefix}setbotmenu`, 'imagen, GIF o video'],
individualMenuImageUrl: ['Banner de menús individuales', `${usedPrefix}setmenubanner`, 'imagen'],
welcomeImageUrl: ['Imagen de bienvenida', `${usedPrefix}setbotwelcome`, 'imagen'],
goodbyeImageUrl: ['Imagen de despedida', `${usedPrefix}setbotbye`, 'imagen']
}
const [title, example, type] = cards[field]
return `╭─「 ${title} 」\n│ Responde a una ${type} con: ${example}\n│ Modifica esta parte visual del Sub-Bot.\n│ Causas CDN se intenta primero con expiración máxima de 30 días.\n╰────────────`
}

function successCard(okText, url, server) {
return `${okText}\nServidor: *${server || 'fallback'}*\nURL: ${url}`
}

function profileCard(p, usedPrefix) {
return `╭─「 SUB-BOT CONFIG 」\n│ Nombre: ${p.botName || 'Ruby Hoshino'}\n│ Prefijo: ${p.customPrefix || usedPrefix || '#'}\n│ Pairing Code: ${p.pairingPrefix || 'RUBY-CHAN'}\n│ Pairing image: ${p.pairingImageUrl ? '✅ Configurada' : '🧩 Nativa'}\n│ MenuAll media: ${p.menuVideoUrl ? '✅ Configurada' : '🧩 Nativa'}\n│ Banner menús: ${p.individualMenuImageUrl ? '✅ Configurado' : '🧩 Nativo'}\n│ Welcome: ${p.welcomeImageUrl ? '✅ Configurado' : '🧩 Nativo'}\n│ Bye: ${p.goodbyeImageUrl ? '✅ Configurado' : '🧩 Nativo'}\n╰────────────\n\n╭─「 MINI TUTORIAL 」\n│ ${usedPrefix}setbotname Luna Bot\n│ ${usedPrefix}setbotprefix !\n│ ${usedPrefix}setbotmenu responde a imagen/video/gif\n│ ${usedPrefix}setmenubanner responde a imagen\n│ ${usedPrefix}setbanner nsfw responde a imagen\n│ ${usedPrefix}setpairingprefix LUNA2026\n│ ${usedPrefix}setpairingimage responde a imagen\n╰────────────`
}

handler.help = ['setbotname', 'setbotprefix', 'setpairingprefix', 'setpairingimage', 'setbotmenu', 'setmenubanner', 'setbanner <categoría>', 'setbotwelcome', 'setbotbye', 'resetbotprofile', 'botprofile']
handler.tags = ['jadibot']
handler.command = ['setbotname', 'setbotprefix', 'setpairingprefix', 'setpairingcode', 'setpairingimage', 'setpairingimg', 'setbotmenu', 'setmenu', 'setmenuall', 'setmenubanner', 'setbanner', 'setmenuindiv', 'setbotwelcome', 'setbotbye', 'resetbotprofile', 'botprofile', 'subbotconfig']
handler.botProfileOwner = true
export default handler
