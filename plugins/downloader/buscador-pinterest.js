import { enqueueMediaJob } from '../../lib/queue.js'

let handler = async (m, { conn, text, usedPrefix }) => {
if (!text) return conn.reply(m.chat, '꒰ 🪷 ꒱ ⋆ ࣪. ¡A-Aʀᴇ! Nᴇᴄᴇsɪᴛᴏ ǫᴜᴇ ᴍᴇ ᴅɪɢᴀs ǫᴜᴇ́ ʙᴜsᴄᴀʀ... ₍ᐢ•ﻌ•ᐢ₎*･ﾟ｡\n\n> ✧ *Eᴊᴇᴍᴘʟᴏ:* `' + usedPrefix + 'pin Ruby Hoshino icons`', m)
await enqueueMediaJob('pinterest', { chat: m.chat, text: text.trim(), sender: m.sender })
}

handler.help = ['pinterest <texto>']
handler.tags = ['descargas']
handler.command = ['pinterest', 'pin']
handler.group = true
export default handler
