import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { tmpdir } from 'os'

function gifToMp4(buffer){
return new Promise((resolve,reject)=>{
const gif=path.join(tmpdir(),`${Date.now()}.gif`)
const mp4=path.join(tmpdir(),`${Date.now()}.mp4`)
fs.writeFileSync(gif,buffer)
const ffmpeg=spawn('ffmpeg',['-y','-i',gif,'-c:v','libx264','-pix_fmt','yuv420p','-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-movflags','+faststart',mp4])
ffmpeg.on('close',code=>{
fs.unlinkSync(gif)
if(code===0){
const out=fs.readFileSync(mp4)
fs.unlinkSync(mp4)
resolve(out)
}else reject('ffmpeg error')
})
ffmpeg.on('error',e=>{
fs.unlinkSync(gif)
reject(e)
})
})
}

let handler=async(m,{conn})=>{
let who=m.mentionedJid&&m.mentionedJid[0]?m.mentionedJid[0]:m.quoted?m.quoted.sender:m.sender
let nameTarget=conn.getName(who)
let nameSender=conn.getName(m.sender)

let caption
if(who===m.sender){
caption=`\`${nameSender}\` *está haciendo pucheros.*`
}else{
caption=`\`${nameSender}\` *le está haciendo pucheros a* \`${nameTarget}\`.`
}

await m.react('🥺')

const poutGifs=[
'https://i.pinimg.com/originals/b2/5c/32/b25c3211c622490eef77f8878f2c8fc8.gif',
'https://i.pinimg.com/originals/cb/80/bc/cb80bc66f74ce929839569bd9f68b5c2.gif',
'https://i.pinimg.com/originals/ff/39/a7/ff39a7a27f918204e575f4cdc2c2bbd6.gif',
'https://i.pinimg.com/originals/a7/9f/de/a79fdef0d50d7b98ed0639e224a0f880.gif',
'https://i.pinimg.com/originals/80/2e/6a/802e6a201f85f82a58f1c6b67594f738.gif',
'https://i.pinimg.com/originals/a4/21/6c/a4216cbb410f1b8847caa58a781a7145.gif',
'https://i.pinimg.com/originals/a0/c2/64/a0c264ad6b12b28d7c58871d7f5a999c.gif',
'https://i.pinimg.com/originals/17/00/04/170004e7cc8e724bd647dab22df227cb.gif',
'https://i.pinimg.com/originals/10/84/48/108448f2b373e79f243d609dfde99a13.gif',
'https://i.pinimg.com/originals/25/e7/3c/25e73c3f6672458482e7d5fc37f4d5c5.gif',
'https://media.tenor.com/03VCLMyKfL4AAAAM/pout-anime-pout.gif',
'https://media.tenor.com/d_pL1WslyB8AAAAM/anime-pout.gif',
'https://media.tenor.com/Fkgun6veQW0AAAAM/akane-kurokawa-kurokawa-akane.gif',
'https://media.tenor.com/FHTOu1fN6DcAAAAM/angry-anime.gif',
'https://media.tenor.com/7VbjUU3dLl8AAAAM/momo-ayase-dandadan.gif',
'https://media.tenor.com/0wCnjnexH3IAAAAM/vic.gif',
'https://media.tenor.com/YseiXI4o5bsAAAAM/sad-pout.gif',
'https://media.tenor.com/2b8bkKXIUBUAAAAM/nico-wakatsuki.gif',
'https://media.tenor.com/_22_7mYKy5EAAAAM/bocchi-bocchi-the-rock.gif',
'https://media.tenor.com/iNu8LXx2ECgAAAAM/senko-poute-hmph.gif',
'https://media.tenor.com/Mf_UetbqAMIAAAAM/oshi-no-ko-onk.gif',
'https://media.tenor.com/Ff7mEcLQ8XkAAAAm/pouting-frieren.webp',
'https://media.tenor.com/ob2MggREvn0AAAAM/angry-hmph.gif',
'https://media.tenor.com/3EgO4ozQzp4AAAAM/anime-raphtalia.gif',
'https://media.tenor.com/Up7hRFmFY9AAAAAM/anime-sad-anime-pout.gif',
'https://media.tenor.com/DQTx0EdSdX8AAAAM/akane-kurokawa-kurokawa-akane.gif',
'https://media.tenor.com/bqdATAYxLd4AAAAM/senpai-hachioji-naoto.gif'
]

const randomGif=poutGifs[Math.floor(Math.random()*poutGifs.length)]

try{
const res=await axios({method:'get',url:randomGif,responseType:'arraybuffer',headers:{'User-Agent':'Mozilla/5.0','Referer':'https://google.com/'}})
let buffer=Buffer.from(res.data)
try{
buffer=await gifToMp4(buffer)
await conn.sendMessage(m.chat,{video:buffer,caption:caption,gifPlayback:true,mentions:[who,m.sender],mimetype:'video/mp4'},{quoted:m})
}catch{
throw new Error('convert fail')
}
}catch{
await conn.sendMessage(m.chat,{video:{url:randomGif},caption:caption,gifPlayback:true,mentions:[who,m.sender]},{quoted:m})
}
}

handler.help=['pout','pucheros']
handler.tags=['anime']
handler.command=['pout','pucheros']
handler.group=true

export default handler
