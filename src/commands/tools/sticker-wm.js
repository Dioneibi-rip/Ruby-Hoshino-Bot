import { addExif } from '../../library/sticker.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!m.quoted) return m.reply(`${emoji} Por favor, responde a un sticker con el comando *${usedPrefix + command}* seguido del nuevo nombre.\nEjemplo: *${usedPrefix + command} Nuevo Nombre*`)

const sticker = await m.quoted.download()
if (!sticker) return m.reply(`${emoji2} No se pudo descargar el sticker.`)

const rawText = String(text || '').trim()
const hasSeparator = /[\u2022|]/.test(rawText)
const textoParts = hasSeparator ? rawText.split(/[\u2022|]/).map(part => part.trim()) : [rawText, '']
const packstickers = global.db.getUser(m.sender) || {}
const texto1 = rawText ? (textoParts[0] || '') : String(packstickers.text1 ?? m.pushName ?? '').trim()
const texto2 = rawText ? (textoParts[1] || '') : String(packstickers.text2 ?? '').trim()

const exif = await addExif(sticker, texto1, texto2)

await conn.sendMessage(m.chat, { sticker: exif }, { quoted: m })
}

handler.help = ['wm']
handler.tags = ['tools']
handler.command = ['take', 'robar', 'wm']
handler.register = true

export default handler
