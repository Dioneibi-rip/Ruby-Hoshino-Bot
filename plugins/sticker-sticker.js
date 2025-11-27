import { sticker } from '../lib/sticker.js'
import uploadFile from '../lib/uploadFile.js'
import uploadImage from '../lib/uploadImage.js'
import { webp2png } from '../lib/webp2mp4.js'

let handler=async(m,{conn,args})=>{
let stiker=false
let userId=m.sender
let packstickers=global.db.data.users[userId]||{}
let texto1=packstickers.text1||global.packsticker
let texto2=packstickers.text2||global.packsticker2

async function safeDownload(q){
return await Promise.race([
q.download(),
new Promise((_,reject)=>setTimeout(()=>reject(new Error("Tiempo de descarga excedido")),15000))
])
}

try{
let q=m.quoted?m.quoted:m
let mime=(q.msg||q).mimetype||q.mediaType||''
let txt=args.join(' ')
if(/webp|image|video/g.test(mime)&&q.download){
if(/video/.test(mime)&&(q.msg||q).seconds>16)return conn.reply(m.chat,'❌ El video no puede durar más de *15 segundos*',m)
let buffer=await safeDownload(q)
if(!buffer)throw new Error("No se pudo descargar el archivo")
await m.react('🧃')
let marca=txt?txt.split(/[\u2022|]/).map(p=>p.trim()):[texto1,texto2]
for(let i=0;i<2;i++){
try{
stiker=await sticker(buffer,false,marca[0],marca[1])
if(stiker)break
}catch{}
}
} else if(args[0]&&isUrl(args[0])){
for(let i=0;i<2;i++){
try{
stiker=await sticker(false,args[0],texto1,texto2)
if(stiker)break
}catch{}
}
} else return conn.reply(m.chat,'❌ 𝙍𝙚𝙨𝙥𝙤𝙣𝙙𝙚 𝙖 𝙪𝙣 𝙫𝙞𝙙𝙚𝙤/𝙜𝙞𝙛/𝙞𝙢𝙖𝙜𝙚𝙣 𝙤 𝙚𝙩𝙞𝙦𝙪𝙚𝙩𝙖 𝙪𝙣𝙖 𝙞𝙢𝙖𝙜𝙚𝙣/𝙜𝙞𝙛/𝙫𝙞𝙙𝙚𝙤 𝙥𝙖𝙧𝙖 𝙘𝙤𝙣𝙫𝙚𝙧𝙩𝙞𝙧𝙡𝙤 𝙚𝙣 𝙨𝙩𝙞𝙘𝙠𝙚𝙧.',m)
} catch(e){
await conn.reply(m.chat,'⚠︎ Ocurrió un Error: '+e.message,m)
await m.react('✖️')
}

if(stiker){
try{
await conn.sendFile(
m.chat,
stiker,
'sticker.webp',
'el sticker',
m,
true,
{
contextInfo:{
forwardingScore:2022,
isForwarded:true,
externalAdReply:{
title:'ϟϟ(๑⚈ ․̫ ⚈๑)ᵖⁱᵏᵃ ᵖⁱᵏᵃ',
body:'¡aquí tienes tu sticker!',
sourceUrl:redes,
thumbnail:icons,
mediaType:2
}}
},
{quoted:m}
)
await m.react('🧃')
} catch{
await conn.reply(m.chat,'⚠ Error al enviar el sticker, intentando de nuevo...',m)
await conn.sendFile(m.chat,stiker,'sticker.webp','',m,true)
await m.react('🧃')
}
}
}

handler.help=['sticker']
handler.tags=['sticker']
handler.command=['s','sticker']
export default handler

const isUrl=text=>{
return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(jpe?g|gif|png)/,'gi'))
}
