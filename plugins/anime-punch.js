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
caption=`\`${nameSender}\` *se golpeó a sí mismo.*`
}else{
caption=`\`${nameSender}\` *golpeó a* \`${nameTarget}\`.`
}

await m.react('👊')

const punchGifs=[
'https://i.pinimg.com/originals/8d/50/60/8d50607e59db86b5afcc21304194ba57.gif',
'https://i.pinimg.com/originals/43/aa/c9/43aac9630b94800a6b18c20583275b61.gif',
'https://i.pinimg.com/originals/95/36/a2/9536a25196452bb16956b7ddbd303268.gif',
'https://i.pinimg.com/originals/5e/fb/cf/5efbcf0acc85455f826a9dc2b84e03be.gif',
'https://i.pinimg.com/originals/7c/17/7f/7c177fc5545cf5939bfa37ca1fb8797b.gif',
'https://i.pinimg.com/originals/4f/90/40/4f9040a91c1a888a9e0ff2f02f2a64fc.gif',
'https://media.tenor.com/yA_KtmPI1EMAAAAM/hxh-hunter-x-hunter.gif',
'https://media.tenor.com/Ru5PhSjAJ3gAAAAm/hikari-shupogaki.webp',
'https://media.tenor.com/BoYBoopIkBcAAAAM/anime-smash.gif',
'https://media.tenor.com/pNmajM4wmtkAAAAM/punch-smash.gif',
'https://media.tenor.com/p_mMicg1pgUAAAAM/anya-forger-damian-spy-x-family.gif',
'https://media.tenor.com/qDDsivB4UEkAAAAM/anime-fight.gif',
'https://media.tenor.com/ObgxhbfdVCAAAAAM/luffy-anime.gif',
'https://media.tenor.com/gmvdv-e1EhcAAAAM/weliton-amogos.gif',
'https://media.tenor.com/0ssFlowQEUQAAAAM/naru-punch.gif',
'https://media.tenor.com/Uo5xJQqA8x0AAAAM/anime-punch.gif',
'https://media.tenor.com/nfpkrKeYyyEAAAAM/anime-sesshomaru.gif',
'https://media.tenor.com/wYyB8BBA8fIAAAAM/some-guy-getting-punch-anime-punching-some-guy-anime.gif',
'https://media.tenor.com/i3hP7zju5JYAAAAM/higurashi-sotsu.gif',
'https://media.tenor.com/vv1mgp7IQn8AAAAM/tgggg-anime.gif',
'https://media.tenor.com/UH8Jnl1W3CYAAAAM/anime-punch-anime.gif',
'https://media.tenor.com/EdV_frZ4e_QAAAAM/anime-naruto.gif',
'https://media.tenor.com/-dH4rQr2QQQAAAAM/pjsk-pjsk-anime.gif',
'https://media.tenor.com/o8RbiF5-9dYAAAAM/killua-hxh.gif',
'https://media.tenor.com/SQQ4VD6igHIAAAAM/yuji-itadori-yuji.gif'
]

const randomGif=punchGifs[Math.floor(Math.random()*punchGifs.length)]

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

handler.help=['punch','pegar','golpear']
handler.tags=['anime']
handler.command=['punch','pegar','golpear']
handler.group=true

export default handler
