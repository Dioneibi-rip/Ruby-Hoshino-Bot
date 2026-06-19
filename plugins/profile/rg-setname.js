const handler=async(m,{conn,command,usedPrefix,text})=>{
const emoji='✨'
const emoji2='❌'
const user=global.db.getUser(m.sender)
const name=text?.trim().replace(/\s+/g,' ')
if(!name)return conn.reply(m.chat,`${emoji} Escribe el nombre personalizado que quieres usar.\n> Ejemplo » *${usedPrefix+command} Ruby*`,m)
if(name.length>40)return conn.reply(m.chat,`${emoji2} El nombre personalizado no puede superar 40 caracteres.`,m)
user.customName=name
user.name=name
return conn.reply(m.chat,`${emoji} Tu nombre personalizado ahora es: *${name}*.\n> Si quieres volver a usar tu nombre de WhatsApp, usa *${usedPrefix}unreg si* para resetear tu cuenta.`,m)
}
handler.help=['setname']
handler.tags=['rg']
handler.command=['setname','setnombre','nombre']
export default handler
