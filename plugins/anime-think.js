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
const thinkGifs=[
'https://i.pinimg.com/originals/36/d8/59/36d859f2c539abcd0c0dc9bb82380644.gif',
'https://i.pinimg.com/originals/04/8c/c3/048cc35b45c1545328f41a03d0177ffa.gif',
'https://i.pinimg.com/originals/47/65/fe/4765fec13f4823254d87ef4bda3aa565.gif',
'https://i.pinimg.com/originals/75/40/22/7540222bc7526cb2a9b729248c1a4be1.gif',
'https://media.tenor.com/f3XybJki0H4AAAAM/anime-thinking.gif', 
'https://media.tenor.com/keB3oG-he3AAAAAM/square-witch.gif', 
'https://media.tenor.com/AXRuwBk2UWQAAAAM/nazuna-nanakusa-call-of-the-night.gif', 
'https://media.tenor.com/vSTMJK6qiakAAAAM/anime-anna.gif', 
'https://media.tenor.com/IwyNIipPItQAAAAM/anime-naruto.gif', 
'https://media.tenor.com/dj9pddUEV0kAAAAM/anime-chibi.gif', 
'https://media.tenor.com/SG0YhQcldrkAAAAM/zero-two-thinking.gif', 
'https://media.tenor.com/B8PaZ6UGHwYAAAAM/aurora-somnia-goodereste-princess-syalis.gif', 
'https://media.tenor.com/9xR5Er9fQ24AAAAM/anya-anya-forger.gif', 
'https://media.tenor.com/_O1e9QRkq2EAAAA1/l-lawliet-l-death-note.webp', 
'https://media.tenor.com/oi0BQ472-WIAAAAM/lu-guang-link-click.gif', 
'https://media.tenor.com/eAqD-5MDzFAAAAAM/mai-sakurajima-sakurajima-mai.gif', 
'https://media.tenor.com/gGO8Cx57zDYAAAAM/maomao-apothecary-diaries.gif', 
'https://media.tenor.com/YBDLlOOCtrsAAAAM/anime-think.gif', 
'https://media.tenor.com/vfvlq0vmir0AAAAM/makima-chainsaw-man.gif', 
'https://media.tenor.com/Y5Gm2dq65xYAAAAM/kyoukai-no-kanata-thinking.gif', 
'https://media.tenor.com/5g-hgOAftZoAAAAM/mugi-tsumugi.gif', 
'https://media.tenor.com/seGiM0wL9VkAAAAM/yui-yui-hirasawa.gif', 
'https://media.tenor.com/_qYjKjL_06wAAAAM/anime-thinking.gif', 
'https://media.tenor.com/Wi8SGf7DctYAAAAM/chainsaw-man-csm.gif', 
'https://media.tenor.com/uwDvjZmPbSAAAAAM/snafu-iroha.gif', 
'https://media.tenor.com/_3mRz2cE5G4AAAAC/anime-thinking.gif'
]

let who=m.mentionedJid&&m.mentionedJid[0]?m.mentionedJid[0]:m.quoted?m.quoted.sender:m.sender
let nameSender=conn.getName(m.sender)
let nameTarget=conn.getName(who)

let caption=who===m.sender?`\`${nameSender}\` *está pensando.*`:`\`${nameSender}\` *está pensando en* \`${nameTarget}\`.`

await m.react('🤔')

const randomGif=thinkGifs[Math.floor(Math.random()*thinkGifs.length)]

try{
const response=await axios({method:'get',url:randomGif,responseType:'arraybuffer',headers:{'User-Agent':'Mozilla/5.0','Referer':'https://tenor.com/'}})
let buffer=Buffer.from(response.data)
try{
buffer=await gifToMp4(buffer)
await conn.sendMessage(m.chat,{video:buffer,caption:caption,gifPlayback:true,mentions:[who,m.sender],mimetype:'video/mp4'},{quoted:m})
}catch{
throw new Error('No se pudo convertir')
}
}catch{
await conn.sendMessage(m.chat,{image:{url:randomGif},caption:caption,mentions:[who,m.sender],mimetype:'image/gif'},{quoted:m})
}
}

handler.help=['think','pensando']
handler.tags=['anime']
handler.command=['think','pensando']
handler.group=true

export default handler
