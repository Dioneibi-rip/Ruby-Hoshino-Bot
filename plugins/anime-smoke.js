import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { tmpdir } from 'os'

function gifToMp4(gifBuffer){
return new Promise((resolve,reject)=>{
const tempGif=path.join(tmpdir(),`${Date.now()}.gif`)
const tempMp4=path.join(tmpdir(),`${Date.now()}.mp4`)
fs.writeFileSync(tempGif,gifBuffer)
const ffmpeg=spawn('ffmpeg',['-y','-i',tempGif,'-c:v','libx264','-pix_fmt','yuv420p','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-movflags','+faststart',tempMp4])
ffmpeg.on('close',code=>{
fs.unlinkSync(tempGif)
if(code===0){
const mp4Buffer=fs.readFileSync(tempMp4)
fs.unlinkSync(tempMp4)
resolve(mp4Buffer)
}else reject(new Error(`FFmpeg falló con código ${code}`))
})
ffmpeg.on('error',err=>{
fs.unlinkSync(tempGif)
reject(err)
})
})
}

let handler=async(m,{conn})=>{
const smokeGifs=[
'https://i.pinimg.com/originals/5c/8e/bb/5c8ebbfa78bef8b0a51259d10fbbc929.gif',
'https://i.pinimg.com/originals/29/7c/bb/297cbb4ffe4b7a96cbc1d913917dad27.gif',
'https://i.pinimg.com/originals/fb/56/48/fb5648dc6e39b7b724cb0daf3693610f.gif', 
'https://i.pinimg.com/originals/b4/f9/35/b4f9350ae84bc8f0dd76c51f85ee5392.gif',
'https://i.pinimg.com/originals/29/92/fb/2992fb9c44cdc817e6cbc0782fbc6276.gif',
'https://i.pinimg.com/originals/3f/4e/1c/3f4e1cd6530eb5f5e5fc9c00aaf651f3.gif',
'https://i.pinimg.com/originals/73/47/19/7347192ae9916c177229ba972ccf8a68.gif',
'https://i.pinimg.com/originals/8c/3d/19/8c3d19d72075c06a391e89de5b6f9c09.gif',
'https://i.pinimg.com/originals/b0/25/ac/b025ac44f93f30d6dd2a8aa78707ac4d.gif',
'https://i.pinimg.com/originals/70/56/56/705656e8c01d3668bc496bef826a21f6.gif',
'https://i.pinimg.com/originals/10/c9/b9/10c9b928fd086f489b86cdf0c9055b78.gif',
'https://i.pinimg.com/originals/54/38/5c/54385ce9a95f06c5c8dbefdebc9219a0.gif',
'https://i.pinimg.com/originals/5d/27/01/5d2701b887ad04de38ce9d53bd840cc9.gif',
'https://i.pinimg.com/originals/71/77/ee/7177ee788a96d55c860ccd9d66d44aab.gif',
'https://i.pinimg.com/originals/69/32/fb/6932fb1df3d3405cacaae1a89fc3c49d.gif',
'https://i.pinimg.com/originals/b0/25/ac/b025ac44f93f30d6dd2a8aa78707ac4d.gif'
]

let who=m.mentionedJid&&m.mentionedJid[0]?m.mentionedJid[0]:m.quoted?m.quoted.sender:m.sender
let nameSender=conn.getName(m.sender)
let nameTarget=conn.getName(who)

let caption=who===m.sender?`\`${nameSender}\` *está fumando* 🚬.`:`\`${nameSender}\` *está fumando con* \`${nameTarget}\` 🚬.`

const randomGif=smokeGifs[Math.floor(Math.random()*smokeGifs.length)]

await m.react('🚬')

try{
const response=await axios({method:'get',url:randomGif,responseType:'arraybuffer',headers:{'User-Agent':'Mozilla/5.0','Referer':'https://www.pinterest.com/'}})
let buffer=Buffer.from(response.data)
try{
buffer=await gifToMp4(buffer)
await conn.sendMessage(m.chat,{video:buffer,caption:caption,gifPlayback:true,mentions:[who,m.sender],mimetype:'video/mp4'},{quoted:m})
}catch{
throw new Error('Fallo conversión')
}
}catch{
await conn.sendMessage(m.chat,{image:{url:randomGif},caption:caption,mentions:[who,m.sender],mimetype:'image/gif'},{quoted:m})
}
}

handler.help=['smoke','fumar']
handler.tags=['anime']
handler.command=['smoke','fumar']
handler.group=true

export default handler
