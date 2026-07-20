import { totalmem, freemem } from 'os'
import os from 'os'
import util from 'util'
import { performance } from 'perf_hooks'
import { formatBytes as format } from '../../library/native-utils.js'
import { spawn, exec, execSync } from 'child_process'

var handler = async (m, { conn }) => {

let timestamp = performance.now()
let latensi = performance.now() - timestamp

let _muptime = process.uptime() * 1000
let muptime = clockString(_muptime)

let chats = Object.entries(conn.chats).filter(([id, data]) => id && data.isChats)
let groups = Object.entries(conn.chats).filter(([jid, chat]) => jid.endsWith('@g.us') && chat.isChats && !chat.metadata?.read_only && !chat.metadata?.announce).map(v => v[0])

let texto = `${emoji} *${packname}*
🚀 *Velocidad:*
→ ${latensi.toFixed(4)}

🕒 *Activo Durante:*
→ ${muptime}

💫 *Chats:*
→ ${chats.length} *Chats privados*
→ ${groups.length} *Grupos*

🏆 *Servidor:*
➤ *Ram ⪼* ${format(totalmem() - freemem())} / ${format(totalmem())}`.trim()

m.react('✈️')

conn.reply(m.chat, texto, m, )

}
handler.help = ['speed']
handler.tags = ['info']
handler.command = ['speed']
handler.register = true

export default handler

function clockString(ms) {
let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')}
