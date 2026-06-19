const handler=async(m,{conn,command,usedPrefix,text})=>{
const emoji='✨'
const emoji2='❌'
const user=global.db.getUser(m.sender)
if(!text?.trim())return conn.reply(m.chat,`${emoji} Debes ingresar una edad válida.\n> Ejemplo » *${usedPrefix+command} 25*`,m)
const edad=Number.parseInt(text.trim(),10)
if(!Number.isFinite(edad)||edad<0||edad>120)return conn.reply(m.chat,`${emoji2} Por favor ingresa una edad válida entre 0 y 120 años.`,m)
user.age=edad
return conn.reply(m.chat,`${emoji} Se ha establecido tu edad como: *${edad}* años.`,m)
}
handler.help=['setage','edad']
handler.tags=['rg']
handler.command=['setage','edad']
export default handler
