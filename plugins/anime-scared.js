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
? `\`${nameSender}\` *está asustad﹫.*`
: `\`${nameSender}\` *está asustad﹫ de* \`${nameTarget}\`.`

await m.react('😨')

const scaredGifs=[
'https://i.pinimg.com/originals/ac/ed/dd/aceddd9405a53c356a38d15b89bd6213.gif',
'https://i.pinimg.com/originals/3d/8b/fb/3d8bfbf749cda06946013d39bf62bc84.gif',
'https://i.pinimg.com/originals/88/c4/d4/88c4d4f9a7f4cd145aeca51c4b9cf016.gif',
'https://i.pinimg.com/originals/dc/97/17/dc97177aa75d3f14a5835e735e3553c6.gif',
'https://i.pinimg.com/originals/56/3c/3c/563c3c6974edee36c2493fac78a9a8a6.gif',
'https://i.pinimg.com/originals/92/01/cb/9201cbeac7063843ac466fd9aa1be8dd.gif',
'https://media.tenor.com/Zs2uw1Zot_gAAAAM/bocchi-the-rock-gotou-hitori.gif',
'https://media.tenor.com/TwMG4-blLaEAAAAM/choso-jjk-choso.gif',
'https://media.tenor.com/uAUAg8fASUcAAAAM/anime-girl-gamerkhasan24.gif',
'https://media.tenor.com/le8dL1RTwHQAAAAM/taiyo-taiyou.gif',
'https://media.tenor.com/v3BB4d8pbFoAAAAM/one-piece-one-piece-movie-6.gif',
'https://media.tenor.com/2FPcjP8vlTwAAAAM/saitama-one-punch-man.gif',
'https://media.tenor.com/-QSwbUkUu8cAAAAM/scared-terrified.gif',
'https://media.tenor.com/VgZoIGF_n9wAAAAM/scream-screaming.gif',
'https://media.tenor.com/VtJHsA9slmAAAAA1/mahito-jjk-jjk-s2.webp',
'https://media.tenor.com/RhyxCbENd6YAAAAM/umaru-chan-scared.gif',
'https://media.tenor.com/FLiPfaiTRScAAAAm/terrified-panic.webp',
'https://media.tenor.com/nEh0yvlMrEgAAAAM/anime-scare.gif',
'https://media.tenor.com/cls2f5d1hOUAAAAM/akane-kurokawa-kurokawa-akane.gif',
'https://media.tenor.com/WcxwXmB-YiIAAAAM/anime-pillow.gif',
'https://media.tenor.com/Q2o3TEOqHIwAAAAM/nervous-scared.gif',
'https://media.tenor.com/UZ0ul8ARdCkAAAAM/ruby-hoshino-anime.gif',
'https://media.tenor.com/zh85z3B9LHYAAAAM/trembling-fear.gif',
'https://media.tenor.com/P9LxKFsp5VMAAAAM/shiro-senko-san.gif',
'https://media.tenor.com/ipuY9Vouk8wAAAAM/wakatsuki-nico.gif'
]

const randomGif=scaredGifs[Math.floor(Math.random()*scaredGifs.length)]

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

handler.help=['scared','asustada']
handler.tags=['anime']
handler.command=['scared','asustada']
handler.group=true

export default handler
