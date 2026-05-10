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
}else reject(new Error(`FFmpeg error ${code}`))
})
ffmpeg.on('error',err=>{
fs.unlinkSync(tempGif)
reject(err)
})
})
}

let handler=async(m,{conn})=>{
const sleepGifs=[
'https://i.pinimg.com/originals/e4/17/e7/e417e7504c33fdafb7736ce4b54b05d9.gif',
'https://i.pinimg.com/originals/ba/62/95/ba6295233b4bafd88512569b03697acd.gif',
'https://i.pinimg.com/originals/a7/e8/e8/a7e8e8f9fd0a8784012d8f14b09da4a8.gif',
'https://i.pinimg.com/originals/88/fa/62/88fa62689b47a6c4324b486f0c2fb997.gif',
'https://i.pinimg.com/originals/85/3e/f8/853ef80465a07f0258e86336a5e82425.gif',
'https://i.pinimg.com/originals/7a/33/08/7a330848c62f1ad0b8eb5f94ca4059b9.gif',
'https://i.pinimg.com/originals/a2/86/b7/a286b7e6b77ac172f3e101bdba4ccf7d.gif',
'https://i.pinimg.com/originals/34/01/08/340108a4ac709fa76a93a148d3042f2b.gif',
'https://i.pinimg.com/originals/52/12/c6/5212c66558e9eb4609bd8038e4794274.gif',
'https://i.pinimg.com/originals/c3/bc/10/c3bc10f31eca300f1d5ea035cf32df43.gif', 
'https://i.pinimg.com/originals/60/24/7b/60247b6a7f2b1e2e6b832eaee550cc05.gif',
'https://i.pinimg.com/originals/8d/74/d0/8d74d090209a9f763f7a4331a4c1b693.gif',
'https://media.tenor.com/nqw8PQ6u01cAAAAM/sanchit-sleepy-sleep.gif',
'https://media.tenor.com/jfwf7xpv5p0AAAAM/sleep-anime.gif',
'https://media.tenor.com/mN-2yFvFO8UAAAAM/anime-sleep-sleepy.gif',
'https://media.tenor.com/d9AcU5UmEdoAAAAM/anime-fran.gif',
'https://media.tenor.com/Cj0YvuE94eoAAAAM/onimai-anime-sleep.gif',
'https://media.tenor.com/3gD4PpwP4e8AAAAM/anime-sleep.gif',
'https://media.tenor.com/lc_ZdiRuc-4AAAAM/yawn-anime.gif',
'https://media.tenor.com/faQ4oQImga0AAAAM/konosuba-konosuba-s3.gif',
'https://media.tenor.com/BsoscZUHi-gAAAAM/sleepy-sleep.gif',
'https://media.tenor.com/GOEO_QhhtlYAAAAM/go-to-sleep-anime.gif',
'https://media.tenor.com/yiRSKkvLUX8AAAAM/chainsaw-man-denji.gif',
'https://media.tenor.com/ukBByoKUNFEAAAAM/cuddle-anime.gif',
'https://telegra.ph/file/6b8e6cc26de052d4018ba.mp4'
]

let who=m.mentionedJid&&m.mentionedJid[0]?m.mentionedJid[0]:m.quoted?m.quoted.sender:m.sender
let nameSender=conn.getName(m.sender)
let nameTarget=conn.getName(who)

let caption=who===m.sender?`\`${nameSender}\` *está tomando una siesta.*`:`\`${nameSender}\` *está durmiendo con* \`${nameTarget}\`.`

await m.react('😴')

const randomGif=sleepGifs[Math.floor(Math.random()*sleepGifs.length)]

try{
const response=await axios({method:'get',url:randomGif,responseType:'arraybuffer',headers:{'User-Agent':'Mozilla/5.0','Referer':'https://tenor.com/'}})
let buffer=Buffer.from(response.data)
try{
buffer=await gifToMp4(buffer)
await conn.sendMessage(m.chat,{video:buffer,caption:caption,gifPlayback:true,mentions:[who,m.sender],mimetype:'video/mp4'},{quoted:m})
}catch{
throw new Error('fail')
}
}catch{
await conn.sendMessage(m.chat,{image:{url:randomGif},caption:caption,mentions:[who,m.sender],mimetype:'image/gif'},{quoted:m})
}
}

handler.help=['sleep','dormir']
handler.tags=['anime']
handler.command=['sleep','dormir']
handler.group=true

export default handler
