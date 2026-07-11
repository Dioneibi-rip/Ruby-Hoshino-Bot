import fs from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

async function listExistingFiles(dirname){
try{
const files=await fs.promises.readdir(dirname)
return files.map(file=>join(dirname,file))
}catch{
return []
}
}

let handler=async(m,{conn,__dirname})=>{
const tmp=[tmpdir(),join(__dirname,'../tmp')]
const nested=await Promise.all(tmp.map(listExistingFiles))
const files=nested.flat()
await Promise.allSettled(files.map(file=>fs.promises.unlink(file)))
return conn.reply(m.chat,`${emoji} Realizado, ya se han eliminado ${files.length} archivos de la carpeta tmp.`,m)
}

handler.help=['cleartmp']
handler.tags=['owner']
handler.command=['cleartmp','borrartmp','borrarcarpetatmp','vaciartmp']
handler.rowner=true

export default handler
