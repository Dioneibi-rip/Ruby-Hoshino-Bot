let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!m.quoted) return conn.reply(m.chat, `${emoji} Responda a un sticker para agregar un comando.`, m)
if (!m.quoted.fileSha256) return conn.reply(m.chat, `${emoji} Responda a un sticker para agregar un comando.`, m)
if (!text) return conn.reply(m.chat, `${emoji2} Ingresa el nombre del comamdo.`, m)
try {
let sticker = global.db.getSection('sticker')
let hash = m.quoted.fileSha256.toString('base64')
if (sticker[hash] && sticker[hash].locked) return conn.reply(m.chat, `${emoji2} No tienes permiso para cambiar este comando de Sticker.`, m)
sticker[hash] = {
text,
mentionedJid: m.mentionedJid,
creator: m.sender,
at: + new Date,
locked: false,
}
global.db.replaceSection('sticker', sticker)
await conn.reply(m.chat, `${emoji} Comando guardado con exito.`, m)
await m.react('✅')
} catch (e) {
await m.react('✖️')
}}
handler.help = ['cmd'].map(v => 'set' + v + ' *<texto>*')
handler.tags = ['owner']
handler.command = ['setcmd', 'addcmd', 'cmdadd', 'cmdset']
handler.owner = false

export default handler
