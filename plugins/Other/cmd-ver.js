const handler=async(m,{conn,usedPrefix,command})=>{
const quoted=m.quoted
if(!quoted)return m.reply(`Responde a una imagen o video de una sola vista con *${usedPrefix+command}*.`)
const mediaType=quoted.mediaType||quoted.mtype
if(!['imageMessage','videoMessage'].includes(mediaType))return m.reply('El mensaje respondido no es una imagen o video compatible.')
const media=await quoted.download()
if(!media)return m.reply('No pude descargar el contenido. Intenta responder directamente al mensaje de una sola vista.')
const caption=quoted.caption||quoted.text||''
const payload=mediaType==='imageMessage'?{image:media,caption}:{video:media,caption}
await conn.sendMessage(m.chat,payload,{quoted:m})
}
handler.help=['ver','readviewonce','read']
handler.tags=['tools']
handler.command=['ver','readviewonce','read']
export default handler
