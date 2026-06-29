import { enqueueMediaJob } from '../../lib/queue.js'

const handler = async (m, { conn, args, usedPrefix, command }) => {
const tiktokRegex = /^(https?:\/\/)?(www\.|vm\.|vt\.|t\.)?tiktok\.com\/.+/i
if (!args[0] || !tiktokRegex.test(args[0])) {
return conn.reply(m.chat, `*< DESCARGAS - TIKTOK />*\n\n*☁️ Iɴɢʀᴇsᴇ Uɴ Eɴʟᴀᴄᴇ Dᴇ Vɪᴅᴇᴏ Dᴇ Tɪᴋᴛᴏᴋ.*\n\n*💌 Eᴊᴇᴍᴘʟᴏ:* _${usedPrefix + command} https://vm.tiktok.com/ZM6UHJYtE/_`.trim(), m)
}
await enqueueMediaJob('tiktok', { chat: m.chat, url: args[0], sender: m.sender })
}

handler.help = ['tiktok', 'tt'].map(v => v + ' *<link>*')
handler.tags = ['descargas']
handler.command = ['tiktok', 'tt', 'tiktokdl', 'ttdl']
handler.group = true
handler.register = true

export default handler
