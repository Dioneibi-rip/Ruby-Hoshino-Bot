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
? `\`${nameSender}\` *está seduciendo ( ͡° ͜ʖ ͡°).*`
: `\`${nameSender}\` *está seduciendo a* \`${nameTarget}\` *( ͡° ͜ʖ ͡°)*.`

await m.react('😏')

const seduceGifs=[
'https://i.pinimg.com/originals/7f/f3/1c/7ff31ce12432d90fa944748021941b6a.gif',
'https://i.pinimg.com/originals/ea/de/5b/eade5b83bc8764de3037fcab1f5e2dec.gif',
'https://media.tenor.com/KsxNSrBLntQAAAAM/zero-two-anime.gif',
'https://media.tenor.com/R7sidYP5IhgAAAAM/blushing-anime-cute-anime.gif',
'https://qu.ax/fYPjB.mp4',
'https://media.tenor.com/xuBjhmC2p9AAAAAM/zero-two-darling-in-the-franxx.gif',
'https://media.tenor.com/pF3s48bhdIsAAAAM/marin-kitagawa-anime-shy.gif',
'https://media.tenor.com/vqPt7f8PxtkAAAAM/marrochi-evil.gif',
'https://media.tenor.com/db96_0PFMpcAAAAM/ano-natsu-ano-natsu-de-matteru.gif',
'https://media.tenor.com/pZHdmpV3A8IAAAAM/annited.gif',
'https://media.tenor.com/9iKiVuCdZu8AAAAM/anime-nisekoi.gif',
'https://media.tenor.com/HG_dSaso5YAAAAAM/anime-hajimete-no-gal.gif',
'https://media.tenor.com/7P2NiwpYJlMAAAAM/anime-shikimoris-not-just-cute.gif'
]

const randomGif=seduceGifs[Math.floor(Math.random()*seduceGifs.length)]

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

handler.help=['seduce','seducir']
handler.tags=['anime']
handler.command=['seduce','seducir']
handler.group=true

export default handler
