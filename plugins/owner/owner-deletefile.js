import fs from 'fs'

async function pathExists(file){
try{
await fs.promises.access(file)
return true
}catch{
return false
}
}

let handler=async(m,{conn,text})=>{
if(!text)return conn.reply(m.chat,`${emoji} Ingresa la ruta y el nombre del archivo que deseas eliminar.`,m)
const file=text.trim()
if(!await pathExists(file))return conn.reply(m.chat,`${emoji2} Archivo no encontrado.`,m)
await fs.promises.unlink(file)
return conn.reply(m.chat,`${done} El archivo *${file}* ha sido eliminado con éxito.`,m)
}
handler.tags=['owner']
handler.help=['deletefile']
handler.command=['deletefile']
handler.rowner=true

export default handler
