import axios from 'axios'
const {proto,generateWAMessageFromContent,prepareWAMessageMedia,generateWAMessageContent}=(await import("@whiskeysockets/baileys")).default

let handler=async(m,{conn,text,usedPrefix,command})=>{
if(!text)return conn.reply(m.chat,'🍟 *⍴᥆r𝖿ᥲ᥎᥆r,іᥒgrᥱsᥲ ᥙᥒ 𝗍ᥱ᥊𝗍᥆ ȷᥙᥒ𝗍᥆ ᥲᥣ ᥴ᥆mᥲᥒძ᥆ ⍴ᥲrᥲ rᥱᥲᥣіzᥲr ᥣᥲ ᑲᥙs𝗊ᥙᥱძᥲ*',m)
const toFancy=str=>{const map={'a':'ᥲ','b':'ᑲ','c':'ᥴ','d':'ᑯ','e':'ᥱ','f':'𝖿','g':'g','h':'һ','i':'і','j':'j','k':'k','l':'ᥣ','m':'m','n':'ᥒ','o':'᥆','p':'⍴','q':'q','r':'r','s':'s','t':'𝗍','u':'ᥙ','v':'᥎','w':'ɯ','x':'x','y':'ᥡ','z':'z','A':'A','B':'B','C':'C','D':'D','E':'E','F':'F','G':'G','H':'H','I':'I','J':'J','K':'K','L':'L','M':'M','N':'N','O':'O','P':'P','Q':'Q','R':'R','S':'S','T':'T','U':'U','V':'V','W':'W','X':'X','Y':'Y','Z':'Z'};return str.split('').map(c=>map[c]||c).join('')}
async function createVideoMessage(url){const{videoMessage}=await generateWAMessageContent({video:{url}},{upload:conn.waUploadToServer});return videoMessage}
async function shuffleArray(array){for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]]}}
try{
await m.react('🕒')
let{data:response}=await axios.get('https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text='+text)
let searchResults=response.data
if(!searchResults||!searchResults.length)return conn.reply(m.chat,'No results found',m)
shuffleArray(searchResults)
let selectedResults=searchResults.splice(0,7)
let results=[]
for(let result of selectedResults){results.push({body:proto.Message.InteractiveMessage.Body.fromObject({text:toFancy(result.title)}),footer:proto.Message.InteractiveMessage.Footer.fromObject({text:toFancy('Tiktok Search')}),header:proto.Message.InteractiveMessage.Header.fromObject({title:'',hasMediaAttachment:true,videoMessage:await createVideoMessage(result.nowm)}),nativeFlowMessage:proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({buttons:[{name:"cta_url",buttonParamsJson:JSON.stringify({display_text:toFancy("vᥱr ᥱᥒ tіkt᥆k ⧉"),url:"https://www.tiktok.com",merchant_url:"https://www.tiktok.com"})}]})})}
const responseMessage=generateWAMessageFromContent(m.chat,{viewOnceMessage:{message:{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,externalAdReply:{title:toFancy('Tiktok Search Bot'),body:toFancy('Resultados encontrados'),thumbnailUrl:'https://i.imgur.com/EfFh7X0.png',sourceUrl:'https://github.com/WhiskeySockets/Baileys',mediaType:1,renderLargerThumbnail:true}},interactiveMessage:proto.Message.InteractiveMessage.fromObject({body:proto.Message.InteractiveMessage.Body.create({text:`\n ${toFancy("ᰔᩚ ᥱs𝗍᥆s s᥆ᥒ ᥣ᥆s rᥱsᥙᥣ𝗍ᥲძ᥆s ძᥱ:")} ${text}\n`}),footer:proto.Message.InteractiveMessage.Footer.create({text:toFancy("𝙏𝙄𝙆𝙏𝙊𝙆 - 𝙎𝙀𝘼𝙍𝘾𝙃")}),header:proto.Message.InteractiveMessage.Header.create({hasMediaAttachment:false}),carouselMessage:proto.Message.InteractiveMessage.CarouselMessage.fromObject({cards:[...results]})})}}},{quoted:m})
await m.react('✅')
await conn.relayMessage(m.chat,responseMessage.message,{messageId:responseMessage.key.id})
}catch(error){
await m.react('❌')
console.error(error)
await conn.reply(m.chat,error.toString(),m)
}}
handler.help=['tiktoksearch <txt>']
handler.tags=['buscador']
handler.command=['tiktoksearch','ttss','tiktoks']
handler.group=true
handler.register=true
handler.coin=2
export default handler