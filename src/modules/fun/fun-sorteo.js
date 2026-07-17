import util from 'util'
import path from 'path'

async function handler(m, { groupMetadata, command, conn, text, usedPrefix}) {

let user = a => '@' + a.split('@')[0]
if (!text) return conn.reply(m.chat, `${emoji} Por favor ingresa lo que deseas sortear.`, m)
let ps = (groupMetadata?.participants || []).map(v => v.id).filter(Boolean)
if (!ps.length) return conn.reply(m.chat, `${emoji} No pude obtener participantes para el sorteo.`, m)
let a = ps.getRandom()
let k = Math.floor(Math.random() * 70)
let vn = `https://hansxd.nasihosting.com/sound/sound${k}.mp3`
let top = `*[🥳 \`ＦＥＬＩＣＩＤＡＤＥＳ\` 🥳]*\n\n${user(a)} 🥳\nAcaba de ganar el sorteo felicitaciones 🎉`
let txt = ''
let count = 0
for (const c of top) {
await new Promise(resolve => setTimeout(resolve, 15))
txt += c
count++

if (count % 10 === 0) {
conn.sendPresenceUpdate('composing' , m.chat);
}
}
await conn.sendMessage(m.chat, { text: txt.trim(), mentions: conn.parseMention(txt) }, {quoted: m, ephemeralExpiration: 24*60*100, disappearingMessagesInChat: 24*60*100} )

}
handler.help = ['sorteo']
handler.command = ['sorteo']
handler.tags = ['fun']
handler.group = true
handler.register = true

export default handler

function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)]}
