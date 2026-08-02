import { setPersonalStickerCommand } from '../../core/sticker-command-utils.js'
let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!m.quoted) return conn.reply(m.chat, `${emoji} Responda a un sticker para agregar un comando.`, m)
if (!m.quoted.fileSha256) return conn.reply(m.chat, `${emoji} Responda a un sticker para agregar un comando.`, m)
if (!text) return conn.reply(m.chat, `${emoji2} Ingresa el nombre del comando.`, m)
try {
let sticker = global.db.getSection('sticker')
let hash = Buffer.from(m.quoted.fileSha256).toString('base64')
if (sticker[hash]?.locked && sticker[hash]?.creator !== m.sender) return conn.reply(m.chat, `${emoji2} No tienes permiso para cambiar este comando de Sticker.`, m)
setPersonalStickerCommand(sticker, hash, m.sender, {
text,
mentionedJid: m.mentionedJid,
at: + new Date,
locked: false,
})
global.db.replaceSection('sticker', sticker)
await conn.reply(m.chat, `${emoji} Comando personal guardado con éxito.`, m)
await m.react('✅')
} catch (e) {
await m.react('✖️')
}}
handler.help = ['cmd'].map(v => 'set' + v + ' *<texto>*')
handler.tags = ['owner']
handler.command = ['setcmd', 'addcmd', 'cmdadd', 'cmdset']
handler.owner = false

export default handler
