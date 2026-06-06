import gtts from 'node-gtts'
import fs from 'fs'
import { join } from 'path'

const defaultLang='es'
const handler=async(m,{conn,args})=>{
let lang=args[0]
let text=args.slice(1).join(' ')
if((args[0]||'').length!==2){
lang=defaultLang
text=args.join(' ')
}
if(!text&&m.quoted?.text)text=m.quoted.text
let res
try{
res=await tts(text,lang)
}catch(e){
m.reply(e+'')
text=args.join(' ')
if(!text)throw `${emoji} Por favor, ingresé una frase.`
res=await tts(text,defaultLang)
}
if(res)return conn.sendFile(m.chat,res,'tts.opus',null,m,true)
}
handler.help=['tts <lang> <teks>']
handler.tags=['transformador']
handler.group=true
handler.register=true
handler.command=['tts']

export default handler

function saveSpeech(ttsEngine,filePath,text){
return new Promise((resolve,reject)=>ttsEngine.save(filePath,text,error=>error?reject(error):resolve()))
}

async function tts(text,lang='es'){
const ttsEngine=gtts(lang)
const filePath=join(global.__dirname(import.meta.url),'../tmp',Date.now()+'.wav')
await saveSpeech(ttsEngine,filePath,text)
const buffer=await fs.promises.readFile(filePath)
await fs.promises.unlink(filePath).catch(()=>null)
return buffer
}
