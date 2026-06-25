/* Codigo hecho por @Fabri115 y mejorado por BrunoSobrino */

import fs from 'fs'
import path from 'path'

async function pathExists(file){
try{
await fs.promises.access(file)
return true
}catch{
return false
}
}

var handler=async(m,{conn})=>{
if(global.conn.user.jid!==conn.user.jid)return conn.reply(m.chat,`${emoji} Utiliza este comando directamente en el número principal del Bot.`,m)
await conn.reply(m.chat,`${emoji2} Iniciando proceso de eliminación de todos los archivos de sesión, excepto el archivo creds.json...`,m)
m.react(rwait)
let sessionPath=`./${Rubysessions}/`
try{
if(!await pathExists(sessionPath))return await conn.reply(m.chat,`${emoji} La carpeta está vacía.`,m)
let files=await fs.promises.readdir(sessionPath)
let filesDeleted=0
for(const file of files){
if(file!=='creds.json'){
await fs.promises.unlink(path.join(sessionPath,file))
filesDeleted++
}
}
if(filesDeleted===0){
await conn.reply(m.chat,`${emoji2} La carpeta esta vacía.`,m)
}else{
m.react(done)
await conn.reply(m.chat,`${emoji} Se eliminaron ${filesDeleted} archivos de sesión, excepto el archivo creds.json.`,m)
conn.reply(m.chat,`${emoji} *¡Hola! ¿logras verme?*`,m)
}
}catch(err){
console.error('Error al leer la carpeta o los archivos de sesión:',err)
await conn.reply(m.chat,`${msm} Ocurrió un fallo.`,m)
  return false;
}
}
handler.help=['dsowner']
handler.tags=['owner']
handler.command=['delai','dsowner','clearallsession']
handler.rowner=true

export default handler
