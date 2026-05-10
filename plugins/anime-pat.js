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
const patGifs=[
'https://i.pinimg.com/originals/63/82/a7/6382a71ef92eb583e2218af754163c4d.gif',
'https://i.pinimg.com/originals/e3/e2/58/e3e2588fbae9422f2bd4813c324b1298.gif',
'https://i.pinimg.com/originals/27/da/ce/27dace4b6aec7de261ddb5d9444e716a.gif',
'https://i.pinimg.com/originals/8b/42/6c/8b426c9bedc37054cd7e73925fa10da5.gif',
'https://i.pinimg.com/originals/73/08/9d/73089d4e4b3f570ef3d5a7ca9f68e622.gif', 
'https://media.tenor.com/PkWttKcH1xMAAAAM/kobayashi-dragon.gif', 
'https://media.tenor.com/8FOQORmaLNoAAAAM/shiro-anime.gif', 
'https://media.tenor.com/wLqFGYigJuIAAAAM/mai-sakurajima.gif', 
'https://media.tenor.com/fro6pl7src0AAAAM/hugtrip.gif', 
'https://media.tenor.com/Dbg-7wAaiJwAAAAM/aharen-aharen-san.gif', 
'https://media.tenor.com/CIF_Pa3yepwAAAAM/rika-higurashi.gif', 
'https://media.tenor.com/Zm71HaIh7wwAAAAM/pat-pat.gif', 
'https://media.tenor.com/YMRmKEdwZCgAAAAM/anime-hug-anime.gif', 
'https://media.tenor.com/079CvbmFPe8AAAAM/qualidea-code-head-pat.gif', 
'https://media.tenor.com/hR_7bvEw3l0AAAAM/clannad-anime.gif', 
'https://media.tenor.com/8o4fWGwBY1EAAAAM/aharensan-aharen.gif', 
'https://media.tenor.com/r3LCBlmezPcAAAAM/can-a-boy-girl-friendship-survive-danjo-no-yuujou-wa-seiritsu-suru.gif', 
'https://media.tenor.com/u10UVE5aQVkAAAAM/miss-kobayashi%27s-dragon-maid-kanna.gif', 
'https://media.tenor.com/MDc4TSck5PQAAAAM/frieren-anime.gif', 
'https://media.tenor.com/Z-28SFKJaIsAAAAM/anime-pat.gif', 
'https://media.tenor.com/cQzScx6m9xEAAAAM/anime-elf.gif', 
'https://media.tenor.com/Vw4wf7gsD4cAAAA1/lawrence-wolf-girl.webp', 
'https://media.tenor.com/mecnd_qE8p8AAAAM/anime-pat.gif', 
'https://media.tenor.com/mYzBXEhbbvgAAAAM/anime-pat.gif', 
]

let who=m.mentionedJid&&m.mentionedJid[0]?m.mentionedJid[0]:m.quoted?m.quoted.sender:m.sender
let nameSender=conn.getName(m.sender)
let nameTarget=conn.getName(who)

let caption=who===m.sender?`\`${nameSender}\` *se acarició a sí mismo.*`:`\`${nameSender}\` *acarició a* \`${nameTarget}\`.`

const randomGif=patGifs[Math.floor(Math.random()*patGifs.length)]

await m.react('💆‍♂️')

try{
const response=await axios({method:'get',url:randomGif,responseType:'arraybuffer',headers:{'User-Agent':'Mozilla/5.0','Referer':'https://tenor.com/'}})
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

handler.help=['pat','acariciar']
handler.tags=['anime']
handler.command=['pat','acariciar']
handler.group=true

export default handler
