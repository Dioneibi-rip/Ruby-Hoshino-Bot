import { getSubBotWorkerRecords } from '../../src/core/subbot-worker-manager.js'
let handler = async (m, { conn, usedPrefix, isRowner}) => {
let _uptime = process.uptime() * 1000;
let totalreg = Object.keys(global.db.listUsers()).length
let totalchats = Object.keys(global.db.getSection('chats')).length

let uptime = clockString(_uptime);
let users = getSubBotWorkerRecords({ statuses: ['online'] });
const chats = Object.entries(conn.chats).filter(([id, data]) => id && data.isChats)
const groupsIn = chats.filter(([id]) => id.endsWith('@g.us')) 
const totalUsers = users.length;
let old = performance.now()
let neww = performance.now()
let speed = neww - old
const used = process.memoryUsage()

let banner = 'https://raw.githubusercontent.com/levi275/img/main/estado.jpeg'

let info = ` ֵ𑁀⏜͜⌒᳝︵໋۪۪۪۪۪᳝֔࣪┄꯭๋━┄꫶︦⡳۪۪۪۪۟︵໋۪۪۪۪۪᳝֔࣪⌒᳝ᦷ࣭࣪🍓ּ۪᪲۫ᮬ ࣭࣪ᦡ ۪ׄ⌒᳝︵໋۪۪۪۪۪᳝֔࣪⡳۪۪۪۪۟┄꫶︦━┄꯭๋︵໋۪۪۪۪۪᳝֔࣪⌒᳝⏜
      ֵ . ━  𝙄 𝘕 𝙁 𝘖 𝙍 𝘔 𝘼 𝘊 𝙄 𝘖 𝙉◻
ㅤ ⃝⃘︢︣֟፝🥭ᩫํ᪶ :  *◜𝘊𝘙𝘌𝘈𝘋𝘖𝘙◞* ⇢ ${etiqueta}
ㅤ ⃝⃘︢︣֟፝🍒ᩫํ᪶ :ᩫํ  *◜𝘗𝘙𝘌𝘍𝘐𝘑𝘖 𝘈𝘊𝘛𝘜𝘈𝘓◞* ⇢ [ ${usedPrefix} ]
ㅤ ⃝⃘︢︣֟፝🍌ᩫํ᪶ :ᩫํ  *◜𝘝𝘌𝘙𝘚𝘐𝘖𝘕◞* ⇢ ${vs}
ㅤ ⃝⃘︢︣֟፝ 🍓:  *◜𝘊𝘏𝘈𝘛𝘚 𝘗𝘙𝘐𝘝𝘈𝘋𝘖𝘚◞* ⇢ ${chats.length - groupsIn.length}
ㅤ ⃝⃘︢︣֟፝🫐ᩫํ᪶ :  *◜𝘛𝘖𝘛𝘈𝘓 𝘋𝘌 𝘊𝘏𝘈𝘛𝘚◞* ⇢ ${chats.length}
ㅤ ⃝⃘︢︣֟፝🍇ᩫํ᪶ :  *◜𝘜𝘚𝘜𝘈𝘙𝘐𝘖𝘚◞* ⇢ ${totalreg}
ㅤ ⃝⃘︢︣֟፝🍉ᩫํ᪶ :  *◜𝘎𝘙𝘜𝘗𝘖𝘚◞* ⇢ ${groupsIn.length}
ㅤ ⃝⃘︢︣֟፝🍏ᩫํ᪶ :  *◜𝘈𝘊𝘛𝘐𝘝𝘐𝘋𝘈𝘋◞* ⇢ ${uptime}
ㅤ ⃝⃘︢︣֟፝🍅ᩫํ᪶ :  *◜𝘗𝘐𝘕𝘎◞* ⇢ ${(speed * 1000).toFixed(0) / 1000}
ㅤ ⃝⃘︢︣֟፝🥦ᩫํ᪶ :  *◜𝘚𝘜𝘉-𝘉𝘖𝘛𝘚 𝘈𝘊𝘛𝘐𝘝𝘖𝘚◞* ⇢ ${totalUsers || '0'}
ꤦꤦ꤫˳ꤦꤦ꤫  .  ˚ ᮫ ᮫ ˳⏝ ⌢᜔⃨̈፝ ᷼ ꤫ꤦᐧฺ᩿۟ ⏝⁀ᩴ᜔᷼􀥵᪲✿᭼꤫ꤦꥇꥈ⬚ꤦ꤫ꥈ᭼꤫ꤦꥈ✿􀥵᪲⁀᮫᜔۪᷼ ˚ꞏ⏝⁔۪࣭۫˳̥⌢⃨፝̈ ˳⏝ ˳`

await conn.sendFile(m.chat, banner, 'estado.jpg', info, m)
}

handler.help = ['estado']
handler.tags = ['info']
handler.command = ['estado', 'status', 'estate', 'state', 'stado', 'stats']
handler.register = true

export default handler

function clockString(ms) {
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    return `${hours}h ${minutes}m ${seconds}s`;
}
