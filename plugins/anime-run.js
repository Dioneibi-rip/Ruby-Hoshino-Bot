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
? `\`${nameSender}\` *está corriendo.*`
: `\`${nameSender}\` *está corriendo de* \`${nameTarget}\`.`

await m.react('🏃')

const runGifs=[
'https://i.pinimg.com/originals/0c/e8/be/0ce8bec2543d81ba65eefd309f0f0c5b.gif',
'https://i.pinimg.com/originals/43/d2/23/43d223fbcd3cd1fd9bee5b805ca21f64.gif',
'https://i.pinimg.com/originals/33/c9/9a/33c99abddaca08bafd75384d3ee7e677.gif',
'https://i.pinimg.com/originals/e5/dd/c0/e5ddc029075f2f1ef6781835d144ea10.gif',
'https://i.pinimg.com/originals/31/67/80/316780713631c15539e0ebddd7e8a572.gif',
'https://i.pinimg.com/originals/81/21/85/8121852ccbb18e7c70cb53fd81f27a54.gif',
'https://i.pinimg.com/originals/65/09/f1/6509f18c8bc3c58bdaec05c75b24a817.gif',
'https://i.pinimg.com/originals/ef/38/0a/ef380a406926eabb03a31a1c988fcc0b.gif',
'https://i.pinimg.com/originals/1f/35/2b/1f352b6df5319c76ccc1c03e693ebd9d.gif',
'https://media.tenor.com/mUIXigPWPuYAAAAM/anime-anime-girl-running.gif',
'https://media.tenor.com/fCNJ5gEgwEYAAAAM/naruto-anime.gif',
'https://media.tenor.com/Hh50s01qUF4AAAAM/samurai-champloo-mugen.gif',
'https://media.tenor.com/XbfdY2Lx-zwAAAAM/zenitsu-running-away.gif',
'https://media.tenor.com/cNDIhw7jkbcAAAAM/vegeta-running.gif',
'https://media.tenor.com/h4VdXrF6vUYAAAAM/gojo-satoru.gif',
'https://media.tenor.com/SKuTZ44qa0IAAAAM/mob-psycho-mob-psycho-season3.gif',
'https://media.tenor.com/POl8wXpZBH0AAAAM/black-clover-charlotte.gif',
'https://media.tenor.com/U4EmRZtCQN0AAAAM/run.gif',
'https://media.tenor.com/vR_UG67oFQgAAAAM/project-sekai-project-sekai-akito.gif'
]

const randomGif=runGifs[Math.floor(Math.random()*runGifs.length)]

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

handler.help=['run','correr']
handler.tags=['anime']
handler.command=['run','correr']
handler.group=true

export default handler
