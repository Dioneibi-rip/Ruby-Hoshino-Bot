import fs from 'fs'

let handler = async (m, { conn, text, usedPrefix, command }) => {
await m.reply(`${emoji} Enviando base de datos de ${packname}...`)
try {
await m.react(rwait)
let d = new Date
let date = d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
let database = await fs.promises.readFile(`./src/database/database.sqlite`)
let creds = await fs.promises.readFile(`./RubySessions/creds.json`)
await conn.reply(m.chat, `*• Fecha:* ${date}`, m)
await conn.sendMessage(m.sender, {document: database, mimetype: 'application/vnd.sqlite3', fileName: `database.sqlite`}, { quoted: fkontak })
await m.react(done)
await conn.sendMessage(m.sender, {document: creds, mimetype: 'application/json', fileName: `creds.json`}, { quoted: fkontak })
await m.react(done)
} catch (e) {
await m.react(error)
conn.reply(m.chat, `${msm} Ocurrió un error.`, m)
return false
}
}

handler.help = ['copia']
handler.tags = ['owner']
handler.command = ['backup', 'respaldo', 'copia']
handler.rowner = true

export default handler
