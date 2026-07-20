import { stringSimilarity as similarity } from '../../library/native-utils.js'
import { loadCharacters } from '../../library/gacha-characters.js'
import { loadHarem } from '../../library/gacha-group.js'
const getSeriesImage=async title=>{try{const response=await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);const data=await response.json();return data.data?.[0]?.images?.jpg?.large_image_url||null}catch{return null}}
let handler=async(m,{conn,args})=>{
const groupId=m.chat
const query=args.join(' ').replace(/\d+$/,'').trim()
if(!query)return conn.reply(m.chat,'✿ Ingresa el nombre de una serie. Ejemplo: `#ainfo blue lock`',m)
try{
const allCharacters=await loadCharacters()
const harem=await loadHarem()
const sourceMap=new Map()
for(const character of allCharacters){const normalized=String(character.source||'').toLowerCase().trim();if(normalized&&!sourceMap.has(normalized))sourceMap.set(normalized,character.source)}
const sources=[...sourceMap.keys()]
let bestMatch=sources.find(source=>source===query.toLowerCase())
if(!bestMatch){const matches=sources.map(source=>({source,score:similarity(query.toLowerCase(),source)})).sort((a,b)=>b.score-a.score);if(matches[0]?.score>.4)bestMatch=matches[0].source}
if(!bestMatch)return conn.reply(m.chat,`✘ No encontré nada parecido a "${query}".`,m)
const characters=allCharacters.filter(character=>String(character.source||'').toLowerCase().trim()===bestMatch)
const claims=harem.filter(entry=>entry.groupId===groupId&&characters.some(character=>character.id===entry.characterId))
const requestedPage=Number.parseInt(args.find(argument=>/^\d+$/.test(argument)),10)||1
const perPage=25
const totalPages=Math.max(1,Math.ceil(characters.length/perPage))
if(requestedPage<1||requestedPage>totalPages)return conn.reply(m.chat,`✿ Página no válida. Total: *${totalPages}*`,m)
const title=characters[0]?.source||sourceMap.get(bestMatch)||query
let message=`◢✿ *${title.toUpperCase()}* ✿◤\n\n✧ Personajes: *${characters.length}*\n✧ Reclamados: *${claims.length}/${characters.length} (${characters.length?Math.round(claims.length/characters.length*100):0}%)*\n\n✦ *LISTA DE PERSONAJES:*\n`
for(const character of characters.sort((a,b)=>Number(b.value||0)-Number(a.value||0)).slice((requestedPage-1)*perPage,requestedPage*perPage)){const claim=harem.find(entry=>entry.groupId===groupId&&entry.characterId===character.id);let status='Libre';if(claim?.userId){try{status=`Reclamado por ${await conn.getName(claim.userId)}`}catch{status=`Reclamado por ${String(claim.userId).split('@')[0]}`}}message+=`» *${character.name}* (${character.value||0}) • ${status}\n`}
message+=`\n> ⚝ Página *${requestedPage}* de *${totalPages}*`
const image=await getSeriesImage(title)
await conn.sendMessage(m.chat,image?{image:{url:image},caption:message}:{text:message},{quoted:m})
}catch(error){console.error(error);return conn.reply(m.chat,`✘ Error: ${error.message}`,m)}
}
handler.help=['ainfo <serie>']
handler.tags=['gacha']
handler.command=['ainfo','serieinfo']
handler.group=true
export default handler
