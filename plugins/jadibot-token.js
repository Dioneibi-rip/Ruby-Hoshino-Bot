import fs from 'fs'

async function pathExists(file){
try{
await fs.promises.access(file)
return true
}catch{
return false
}
}

async function handler(m, {usedPrefix}) {

const user = m.sender.split('@')[0]
if (await pathExists(`./${jadi}/` + user + '/creds.json')) {
let token = Buffer.from(await fs.promises.readFile(`./${jadi}/` + user + '/creds.json'), 'utf-8').toString('base64')

await conn.reply(m.chat, `${emoji} El token te permite iniciar sesion en otros bots, recomendamos no compartirlo con nadie\n\n*Tu token es:*`, m)
await conn.reply(m.chat, token, m)
} else {
await conn.reply(m.chat, `${emoji2} No tienes ningun token activo, usa #jadibot para crear uno.`, m)
}

}
handler.help = ['token']
handler.command = ['token']
handler.tags = ['serbot']
handler.private = true

export default handler
