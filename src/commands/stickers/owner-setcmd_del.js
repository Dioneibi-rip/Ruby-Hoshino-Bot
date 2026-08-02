import { deletePersonalStickerCommand } from '../../core/sticker-command-utils.js'

const handler = async (m, { conn, usedPrefix }) => {
if (!m.quoted || !m.quoted.fileSha256) return conn.reply(m.chat, `${emoji} Responde al sticker que tiene tu comando personal con *${usedPrefix}delcmd*.`, m)
const hash = Buffer.from(m.quoted.fileSha256).toString('base64')
const sticker = global.db.getSection('sticker')
const deleted = deletePersonalStickerCommand(sticker, hash, m.sender)
if (!deleted) return conn.reply(m.chat, `${emoji2} Este sticker no tiene ningún comando asignado por ti.`, m)
global.db.replaceSection('sticker', sticker)
await conn.reply(m.chat, `${emoji} Tu comando personal de este sticker fue eliminado correctamente.`, m)
await m.react('✅')
}
handler.help = ['delcmd']
handler.tags = ['sticker']
handler.command = ['delcmd', 'cmdrm']
handler.owner = false

export default handler
