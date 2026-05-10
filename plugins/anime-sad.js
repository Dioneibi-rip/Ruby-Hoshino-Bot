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
? `\`${nameSender}\` *está muy triste.*`
: `\`${nameSender}\` *está triste por* \`${nameTarget}\`.`

await m.react('😥')

const sadGifs=[
'https://i.pinimg.com/originals/c1/be/30/c1be3022e608a33db43ed06e629ae31a.gif',
'https://i.pinimg.com/originals/4d/9c/ef/4d9cef56c589d417ae779ba6b1c20c5b.gif',
'https://i.pinimg.com/originals/c8/3e/01/c83e01d5bba6480fdd95560e6fcc0454.gif',
'https://i.pinimg.com/originals/bd/6d/42/bd6d4203c11782af8c724ae4d4cf37a0.gif',
'https://i.pinimg.com/originals/32/8c/88/328c881f1929b778adcc7d9c1c75adcd.gif',
'https://i.pinimg.com/originals/51/0a/a4/510aa4cebb7bccc7c283cca10f3b6601.gif',
'https://i.pinimg.com/originals/d7/d1/95/d7d195cdf34f11c935844d471881c245.gif',
'https://i.pinimg.com/originals/6f/2e/cb/6f2ecb53bd6fd49edcecec92a7872bb5.gif',
'https://i.pinimg.com/originals/13/3f/5a/133f5a089704bc70809609735a7dfe4b.gif',
'https://i.pinimg.com/originals/ac/14/46/ac14460aea55c0ea380c1042cd56e9a6.gif',
'https://media.tenor.com/ukwvYi0Olk8AAAAM/sad-anime-guy-lonely-anime-guy.gif',
'https://media.tenor.com/EudvjJemPC0AAAAM/bocchi-the.gif',
'https://media.tenor.com/5kwtBdNCeEoAAAAM/ichigo-rain-ichigo.gif',
'https://media.tenor.com/9RuzyPx3j3sAAAAM/anime-sorrow.gif',
'https://media.tenor.com/DiFQ_Rl3dCQAAAAM/anime-cry-crying.gif',
'https://media.tenor.com/6EQ2aeffrU0AAAAM/anime-sad.gif',
'https://media.tenor.com/_00BCbaD2PsAAAAM/raining-sad.gif',
'https://media.tenor.com/E4dgZ9qMqasAAAAM/hidamari-hidamari-sketch.gif',
'https://media.tenor.com/HPdVPFR-BasAAAAM/anime-sad.gif',
'https://media.tenor.com/IWdHxxaoXGYAAAAM/suigintou-sad.gif',
'https://media.tenor.com/SgTOd0XbpS0AAAAM/bandori-bang-dream.gif',
'https://media.tenor.com/opUBGwM4o48AAAAM/ghoul.gif',
'https://media.tenor.com/KMK8l8SqB28AAAAM/cute-anime-boy-sakura-haruka.gif',
'https://media.tenor.com/q7cz_01J4zsAAAAM/maid-cute.gif',
'https://media.tenor.com/Ifjf8kh9xi8AAAAM/last-tour-girl-sad-anime-melancholy.gif',
'https://media.tenor.com/n85DUKiUX94AAAAM/yuji-yuji-itadori.gif',
'https://media.tenor.com/k6A8_2g8bcAAAAAM/azumanga-daioh.gif',
'https://media.tenor.com/Udqe4XY6Av4AAAAM/anime-purple.gif',
'https://media.tenor.com/8Ob5KEU7vKAAAAAM/anime-my-dress-up-darling.gif'
]

const randomGif=sadGifs[Math.floor(Math.random()*sadGifs.length)]

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

handler.help=['sad','triste']
handler.tags=['anime']
handler.command=['sad','triste']
handler.group=true

export default handler
