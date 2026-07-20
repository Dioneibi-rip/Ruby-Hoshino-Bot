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
if(!text)throw `Por favor, ingresé una frase.`
res=await tts(text,defaultLang)
return false
}
if(res)return conn.sendFile(m.chat,res,'tts.opus',null,m,true)
}
handler.help=['tts <lang> <teks>']
handler.tags=['transformador']
handler.group=true
handler.register=true
handler.command=['tts']
export default handler
async function tts(text, lang = 'es') {
if (!text) throw new Error('Texto vacío')
const chunks = String(text).match(/.{1,180}(?:\s|$)/g)?.map(part => part.trim()).filter(Boolean) || []
const buffers = []
for (const chunk of chunks) {
const url = new URL('https://translate.google.com/translate_tts')
url.searchParams.set('ie', 'UTF-8')
url.searchParams.set('client', 'tw-ob')
url.searchParams.set('tl', lang)
url.searchParams.set('q', chunk)
const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
if (!response.ok) throw new Error(`TTS HTTP ${response.status}`)
buffers.push(Buffer.from(await response.arrayBuffer()))
}
return Buffer.concat(buffers)
}
