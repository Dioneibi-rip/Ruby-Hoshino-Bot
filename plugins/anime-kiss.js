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
const kissGifs=[
'https://i.pinimg.com/originals/0c/2a/89/0c2a89004ebf7f6b6a4b0b5553dc8776.gif',
'https://i.pinimg.com/originals/10/5a/7a/105a7ad7edbe74e5ca834348025cc650.gif',
'https://i.pinimg.com/originals/8e/36/da/8e36dab30ae3e74a17c1fca0e7092e1a.gif',
'https://i.pinimg.com/originals/5d/28/23/5d2823c3a0d739ffb6c221708127b9ae.gif',
'https://i.pinimg.com/originals/0c/2a/89/0c2a89004ebf7f6b6a4b0b5553dc8776.gif', 
'https://i.pinimg.com/originals/5c/01/b9/5c01b9519ebdad0ed42dd2eb0a215fcc.gif', 
'https://i.pinimg.com/originals/b3/2c/83/b32c83dad2eae8c430f8ecf3b8f5654f.gif', 
'https://i.pinimg.com/originals/81/a4/4e/81a44e96f35a9b19df0231727b910692.gif', 
'https://i.pinimg.com/originals/d0/cd/64/d0cd64030f383d56e7edc54a484d4b8d.gif', 
'https://i.pinimg.com/originals/51/6e/3d/516e3dcaa0140aa7d5b815447be9f38f.gif', 
'https://i.pinimg.com/originals/23/73/b9/2373b9fcac13929d32d3e0539e6fbcb2.gif', 
'https://i.pinimg.com/originals/56/0b/b3/560bb37b1596f48d93a76db4f87dc2f9.gif', 
'https://i.pinimg.com/originals/0c/68/5b/0c685b1ccb8ec1d5a7cf734395bf702b.gif', 
'https://media.tenor.com/kmxEaVuW8AoAAAAM/kiss-gentle-kiss.gif',
'https://media.tenor.com/YhGc7aQAI4oAAAAM/megumi-kato-kiss.gif',
'https://media.tenor.com/sbMBW4a-VN4AAAAM/anime-kiss.gif',
'https://media.tenor.com/_8oadF3hZwIAAAAM/kiss.gif',
'https://media.tenor.com/lJPu85pBQLEAAAAM/kiss.gif',
'https://media.tenor.com/SJhcVWsxgEkAAAAM/anime-kiss-anime.gif',
'https://media.tenor.com/cQzRWAWrN6kAAAAM/ichigo-hiro.gif',
'https://media.tenor.com/BZyWzw2d5tAAAAAM/hyakkano-100-girlfriends.gif',
'https://media.tenor.com/HdnsMy2ELv8AAAAM/kiss.gif',
'https://media.tenor.com/9u2vmryDP-cAAAAM/horimiya-animes.gif',
'https://media.tenor.com/g8AeFZoe7dsAAAAM/kiss-anime-kiss.gif',
'https://media.tenor.com/SZ8-4vDwi6cAAAAM/miyamura-hori.gif',
'https://media.tenor.com/b7DWF8ecBkIAAAAM/kiss-anime-anime.gif',
'https://media.tenor.com/g92jdEmFrn0AAAAM/anime-kiss-anime.gif',
'https://media.tenor.com/ZDqsYLDQzIUAAAAM/shirayuki-zen-kiss-anime.gif',
'https://media.tenor.com/vByy30BRy6EAAAAM/kiss-gif-kiss-gif-couple.gif',
'https://media.tenor.com/WeRg5GfJ54IAAAAM/kiss-anime-anime-kiss.gif',
'https://media.tenor.com/f7zzuRSaIXoAAAAM/anime-kiss-ranma.gif',
'https://media.tenor.com/YHxJ9NvLYKsAAAAM/anime-kiss.gif',
'https://media.tenor.com/vByy30BRy6EAAAAM/kiss-gif-kiss-gif-couple.gif',
'https://media.tenor.com/6o7pJb2d2fUAAAAC/anime-kiss.gif'
]

let who=m.mentionedJid&&m.mentionedJid[0]?m.mentionedJid[0]:m.quoted?m.quoted.sender:m.sender
let nameSender=conn.getName(m.sender)
let nameTarget=conn.getName(who)

let caption=who===m.sender?`\`${nameSender}\` *se besó a sí mismo ( ˘ ³˘)♥*`:`\`${nameSender}\` *besó a* \`${nameTarget}\` 💋.`

const randomGif=kissGifs[Math.floor(Math.random()*kissGifs.length)]

await m.react('🫦')

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

handler.help=['kiss','besar']
handler.tags=['anime']
handler.command=['kiss','besar']
handler.group=true

export default handler
