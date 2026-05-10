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
}else reject(new Error(`ffmpeg error ${code}`))
})
ffmpeg.on('error',err=>{
fs.unlinkSync(tempGif)
reject(err)
})
})
}

let handler=async(m,{conn})=>{
let who=m.mentionedJid&&m.mentionedJid[0]?m.mentionedJid[0]:m.quoted?m.quoted.sender:m.sender
let nameSender=conn.getName(m.sender)
let nameTarget=conn.getName(who)

let caption=who===m.sender
? `\`${nameSender}\` *se golpeó a sí mismo.*`
: `\`${nameSender}\` *golpeó a* \`${nameTarget}\`.`

await m.react('👊')

const slapGifs=[
'https://i.pinimg.com/originals/2b/3a/3e/2b3a3e107ac57d4f170a8f8e414fec9f.gif',
'https://i.pinimg.com/originals/e8/f8/80/e8f880b13c17d61810ac381b2f6a93c3.gif',
'https://i.pinimg.com/originals/8f/52/09/8f52096d6a1a333ece0fcc501eec106c.gif',
'https://i.pinimg.com/originals/a9/b8/bd/a9b8bd2060d76ec286ec8b4c61ec1f5a.gif',
'https://i.pinimg.com/originals/2e/83/32/2e833278b7ed147adb4e9a1f571c1352.gif',
'https://i.pinimg.com/originals/13/81/03/1381036c9dcf14117351747e672ed515.gif',
'https://i.pinimg.com/originals/b4/94/ab/b494ab93b90c81a747e0493f5cdd9d1f.gif',
'https://i.pinimg.com/originals/6a/60/d1/6a60d1eaf8c7317f7dfb0a892789c490.gif',
'https://i.pinimg.com/originals/96/8c/b1/968cb1f9eaa12dde1d6fdf2f6ee296ed.gif',
'https://i.pinimg.com/originals/0c/09/ec/0c09ecfac6e0d93b894ec13fa900f9fa.gif',
'https://media.tenor.com/Ws6Dm1ZW_vMAAAAM/girl-slap.gif',
'https://media.tenor.com/Sv8LQZAoQmgAAAAM/chainsaw-man-csm.gif',
'https://media.tenor.com/eU5H6GbVjrcAAAAM/slap-jjk.gif',
'https://media.tenor.com/cpWuWnOU64MAAAAM/bofetada.gif',
'https://media.tenor.com/XiYuU9h44-AAAAAM/anime-slap-mad.gif',
'https://media.tenor.com/E3OW-MYYum0AAAAM/no-angry.gif',
'https://media.tenor.com/8bSm0lI4_FUAAAAM/yuuri.gif',
'https://media.tenor.com/mTmYJx-mIa0AAAAM/fighter-boy-anime-guy-dangerous.gif',
'https://media.tenor.com/ZozZrvtEdAkAAAAM/slap.gif',
'https://media.tenor.com/7xFcP1KWjY0AAAAM/no.gif',
'https://media.tenor.com/yJmrNruFNtEAAAAM/slap.gif',
'https://i.pinimg.com/originals/0c/09/ec/0c09ecfac6e0d93b894ec13fa900f9fa.gif',
'https://media.tenor.com/Xwe3ku5WF-YAAAAM/slap-chie.gif'
]

const randomGif=slapGifs[Math.floor(Math.random()*slapGifs.length)]

try{
const response=await axios({method:'get',url:randomGif,responseType:'arraybuffer',headers:{'User-Agent':'Mozilla/5.0','Referer':'https://google.com/'}})
let buffer=Buffer.from(response.data)
try{
buffer=await gifToMp4(buffer)
await conn.sendMessage(m.chat,{video:buffer,caption:caption,gifPlayback:true,mentions:[who,m.sender],mimetype:'video/mp4'},{quoted:m})
}catch{
throw new Error('conversion fail')
}
}catch{
await conn.sendMessage(m.chat,{video:{url:randomGif},caption:caption,gifPlayback:true,mentions:[who,m.sender]},{quoted:m})
}
}

handler.help=['slap','bofetada']
handler.tags=['anime']
handler.command=['slap','bofetada']
handler.group=true

export default handler
