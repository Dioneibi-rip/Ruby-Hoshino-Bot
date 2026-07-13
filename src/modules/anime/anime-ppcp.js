let handler = async (m, { conn }) => {

let data = await (await fetch('https://raw.githubusercontent.com/ShirokamiRyzen/WAbot-DB/main/fitur_db/ppcp.json')).json()
let cita = data[Math.floor(Math.random() * data.length)]

let cowi = Buffer.from(await (await fetch(cita.cowo)).arrayBuffer())
await conn.sendFile(m.chat, cowi, '', '*Masculino* ♂️', m)
let ciwi = Buffer.from(await (await fetch(cita.cewe)).arrayBuffer())
await conn.sendFile(m.chat, ciwi, '', '*Femenina* ♀️', m)
}

handler.help = ['ppcouple']
handler.tags = ['anime']
handler.command = ['ppcp', 'ppcouple']
handler.limit = false
handler.register = true

export default handler
