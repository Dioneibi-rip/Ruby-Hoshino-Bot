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
? `\`${nameSender}\` *es muy timid﹫.*`
: `\`${nameSender}\` *está tímid﹫ por* \`${nameTarget}\`.`

await m.react('😛')

const shyGifs=[
'https://i.pinimg.com/originals/df/aa/d1/dfaad160939b71b8b361b98e389f7b13.gif',
'https://i.pinimg.com/originals/ad/ce/cb/adcecba1d189dc3ae2a11fa77a2c6c11.gif',
'https://i.pinimg.com/originals/63/5f/f7/635ff7de4d9228e140153bff49b6dd4d.gif',
'https://i.pinimg.com/originals/04/58/93/0458930fcf50fbbdf3c6babf12812156.gif',
'https://i.pinimg.com/originals/1a/45/a1/1a45a1a56f2de59a23b889fc8b9908e5.gif',
'https://i.pinimg.com/originals/64/ec/fe/64ecfeaa70f26391c36ccac80df2fe90.gif',
'https://i.pinimg.com/originals/c7/d8/5f/c7d85f6f5367ede5547965edc31d9636.gif',
'https://i.pinimg.com/originals/ec/a3/de/eca3defa401f6e1b8692e9a3756897b5.gif',
'https://i.pinimg.com/originals/6a/54/6c/6a546c02aa73e8192588888f5de1ebf0.gif',
'https://i.pinimg.com/originals/09/7f/46/097f46e1db35653902b10b0a322c908f.gif',
'https://i.pinimg.com/originals/ea/16/9b/ea169b589d28bedd698b09a9e405c1cd.gif',
'https://i.pinimg.com/originals/d7/c3/0e/d7c30e46a937aaade4d7bc20eb09339b.gif',
'https://i.pinimg.com/originals/7b/6e/22/7b6e2264e1e041f706d264a7f41c694f.gif',
'https://i.pinimg.com/originals/3c/e5/d6/3ce5d6af434f62cc185590e8f84f4d53.gif',
'https://i.pinimg.com/originals/60/bd/28/60bd28e041d83ed07ac88e00d30843d5.gif',
'https://i.pinimg.com/originals/8a/62/60/8a6260a1ea0e398dd8de16f4fc99932a.gif',
'https://i.pinimg.com/originals/98/ed/29/98ed29a15944ee61c41c0e340f698b57.gif',
'https://media.tenor.com/ZWop2tkzsakAAAAM/magirevo-anis-shy.gif',
'https://media.tenor.com/3EC7nfDexUEAAAA1/i%27mikra.webp',
'https://media.tenor.com/kHovgXapj6MAAAAM/corada.gif',
'https://media.tenor.com/FlIDq9xkDJkAAAAM/kowloon-generic-romance-kowloon.gif',
'https://media.tenor.com/DE327HSCNlMAAAAM/hanako-kun-anime.gif',
'https://media.tenor.com/CR3t6UiFYSwAAAA1/waguri-the-fragrant-flower-blooms-with-dignity.webp',
'https://media.tenor.com/Lx42NK_3nRAAAAAM/anime-guild-receptionist.gif',
'https://media.tenor.com/Y3d58v49KMsAAAAM/sailor-moon-fingers.gif',
'https://media.tenor.com/rVVbXeg8II0AAAAM/shy-anime-girl-mohime-mohime.gif',
'https://media.tenor.com/JkHl5wwOABMAAAAM/shy-girl.gif',
'https://media.tenor.com/Le2wxDEnJIUAAAAM/anime-witch.gif'
]

const randomGif=shyGifs[Math.floor(Math.random()*shyGifs.length)]

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

handler.help=['shy','timida']
handler.tags=['anime']
handler.command=['shy','timida']
handler.group=true

export default handler
