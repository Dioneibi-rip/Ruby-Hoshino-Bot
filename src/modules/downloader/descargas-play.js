import { enqueueMediaJob, getMediaQueueConnection } from '../../infra/queue.js'
import yts from 'yt-search'
import { gotScraping } from 'got-scraping'
import { CookieJar } from 'tough-cookie'
import crypto from 'crypto'
const REFERER='https://y2mate.tw/'
const ORIGIN='https://y2mate.tw'
const USER_TIMEZONE='300'
const YT_REGEX=/(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
const AUDIO_QUALITIES=['64','96','128','192','256','320']
const VIDEO_QUALITIES=['240','360','480','720','1080']
const POLL_INTERVAL=2000
const POLL_MAX=90
const cookieJar=new CookieJar()
const http=gotScraping.extend({cookieJar,timeout:{request:30000},retry:{limit:1,methods:['GET','POST']},headerGeneratorOptions:{browsers:[{name:'edge',minVersion:130}],devices:['desktop'],operatingSystems:['windows'],locales:['es-419','es','en-US']},headers:{accept:'*/*','accept-language':'es-419,es;q=0.9,es-ES;q=0.8,en;q=0.7',origin:ORIGIN,referer:REFERER,'content-type':'application/json'}})
const newsletterJid='120363335626706839@newsletter'
const newsletterName='𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭'
const handler=async(m,{conn,text,command})=>{try{if(!text||!text.trim())return conn.reply(m.chat,'✧ 𝙃𝙚𝙮! Debes escribir *el nombre o link* del video/audio para descargar.',m);await conn.sendMessage(m.chat,{react:{text:'⏳',key:m.key}});await enqueueMediaJob('youtube',{chat:m.chat,text:text.trim(),command,message:{key:m.key,message:m.message,sender:m.sender,chat:m.chat}},{conn})}catch(error){console.error(error);await conn.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return m.reply('⚠︎ Error inesperado.')}}
handler.command=['play','yta','ytmp3','play2','ytv','ytmp4','playaudio','mp4']
handler.help=['play','yta','ytmp3','play2','ytv','ytmp4','playaudio','mp4']
handler.tags=['descargas']
export default handler
function apiEndpoint(format,mp3Quality){if(format==='1')return'https://api5.apiapi2.lat';if(mp3Quality==='128')return'https://api.apiapi2.lat';return'https://api3.apiapi2.lat'}
function ranHash(){return Array.from(crypto.randomBytes(16),b=>b.toString(16).padStart(2,'0')).join('')}
function encUrl(input){const codePoints=[];for(let i=0;i<input.length;i++)codePoints.push(input.charCodeAt(i));return codePoints.reverse().join(',')}
function encodeDecode(input){let out='';for(let i=0;i<input.length;i++)out+=String.fromCharCode(input.charCodeAt(i)^1);return out}
function extractVideoId(url){return String(url||'').match(YT_REGEX)?.[1]||null}
async function initiate(base,url,format,mp3Quality,mp4Quality){const endpoint=`${base}/${ranHash()}/init/${encUrl(url)}/${ranHash()}/`;const res=await http.post(endpoint,{responseType:'json',body:JSON.stringify({data:encodeDecode(url),format,referer:REFERER,mp3Quality,mp4Quality,userTimeZone:USER_TIMEZONE})});return res.body}
async function checkStatus(base,id){const endpoint=`${base}/${ranHash()}/status/${id}/${ranHash()}/`;const res=await http.post(endpoint,{responseType:'json',throwHttpErrors:false,body:JSON.stringify({data:id})});return res.statusCode===200?res.body:false}
function validateInit(data){if(data?.le)throw new Error('El video dura más de 4 horas, no se puede descargar');if(data?.i==='blacklisted')throw new Error('Límite diario alcanzado, intenta mañana');if(data?.i==='invalid')throw new Error('URL de YouTube inválida');if(data?.e)throw new Error('Video no disponible o restringido')}
async function convert(url,format,mp3Quality,mp4Quality){const videoId=extractVideoId(url);if(!videoId)throw new Error('URL de YouTube inválida');const base=apiEndpoint(format,mp3Quality);let initData=false;for(let i=0;i<3&&initData===false;i++)initData=await initiate(base,url,format,mp3Quality,mp4Quality);if(initData===false)throw new Error('y2mate no respondió al iniciar');validateInit(initData);let finalData=initData;if(initData.s!=='C'){let data=false;for(let count=0;count<POLL_MAX;count++){data=await checkStatus(base,initData.i);if(data===false){await sleep(POLL_INTERVAL);continue}validateInit(data);if(data.s==='C')break;await sleep(POLL_INTERVAL)}if(!data||data.s!=='C')throw new Error('La conversión tardó demasiado, intenta de nuevo');finalData=data}return{id:finalData.i,title:(finalData.t&&typeof finalData.t==='string')?finalData.t:'YouTube',thumbnail:`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,downloadUrl:`${base}/${ranHash()}/download/${finalData.i}/${ranHash()}/`}}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function formatViews(views){if(!views)return'No disponible';if(views>=1000000000)return`${(views/1000000000).toFixed(1)}B`;if(views>=1000000)return`${(views/1000000).toFixed(1)}M`;if(views>=1000)return`${(views/1000).toFixed(1)}k`;return views.toString()}
function safeFileName(title,fallback){return String(title||fallback).replace(/[\\/:*?"<>|]/g,'').slice(0,100)||fallback}
async function resolveYoutube(text){const direct=String(text||'').match(YT_REGEX);if(direct)return`https://www.youtube.com/watch?v=${direct[1]}`;const result=await yts(text);const video=result.all.find(v=>v.type==='video')||result.videos?.[0]||result.all?.[0];return video?.url||''}
global.queueHandlers||=new Map()
global.queueHandlers.set('youtube',async(data,ctx={})=>{const conn=ctx.conn||getMediaQueueConnection();const m=data.message;try{const url=await resolveYoutube(data.text);if(!url){await conn.sendMessage(data.chat,{react:{text:'❌',key:m.key}});return conn.reply(data.chat,'⚠︎ No encontré resultados.',m)}const searchResult=await yts({videoId:extractVideoId(url)}).catch(()=>null);const title=searchResult?.title||'YouTube';const thumbnail=searchResult?.thumbnail||`https://i.ytimg.com/vi/${extractVideoId(url)}/hqdefault.jpg`;const timestamp=searchResult?.timestamp||'No disponible';const vistas=formatViews(searchResult?.views);const ago=searchResult?.ago||'No disponible';const canal=searchResult?.author?.name||'Desconocido';const isVideo=['play2','ytv','ytmp4','mp4'].includes(data.command);const args=String(data.text||'').trim().split(/\s+/).filter(Boolean);const qualityArg=args.find(a=>/^\d{2,4}p?k?$/i.test(a))?.replace(/[pk]$/i,'');const quality=isVideo?(VIDEO_QUALITIES.includes(qualityArg)?qualityArg:'720'):(AUDIO_QUALITIES.includes(qualityArg)?qualityArg:'128');const infoMessage=`ㅤ۫ ㅤ 🦭 ୧ ˚ \`𝒅𝒆𝒔𝒄𝒂𝒓𝒈𝒂 𝒆𝒏 𝒄𝒂𝒎𝒊𝒏𝒐\` ! ୨ 𖹭 ִֶָ
᮫ؙܹ ᳘︵᮫ּܹ࡛〫ࣥܳ⌒ؙ۫ ᮫ּ۪֯⏝ֺ࣯࠭۟ ᮫ּ〪࣭︶᮫ܹ᳟〫࠭߳፝֟᷼⏜᮫᮫ּ〪࣭࠭〬︵᮫ּ᳝̼࣪ 🍚⃘ᩚּ̟߲ ּ〪࣪︵᮫࣭࣪࠭ᰯּ〪࣪࠭⏜ְ࣮〫߳ ᮫ּׅ࣪۟︶᮫ܹׅ࠭〬 ᮫ּּ࣭᷼⏝ᩥ᮫〪ܹ۟࠭۟۟ ᮫ּؙ⌒᮫ܹ۫︵ᩝּּ۟࠭ ࣭۪۟
🧊✿⃘࣪◌ ֪ \`𝗧𝗶́𝘁𝘂𝗹𝗼\` » ${title}
🧊✿⃘࣪◌ ֪ \`𝗖𝗮𝗻𝗮𝗹\` » ${canal}
🧊✿⃘࣪◌ ֪ \`𝗗𝘂𝗿𝗮𝗰𝗶𝗼́𝗻\` » ${timestamp}
🧊✿⃘࣪◌ ֪ \`𝗩𝗶𝘀𝘁𝗮𝘀\` » ${vistas}
🧊✿⃘࣪◌ ֪ \`𝗣𝘂𝗯𝗹𝗶𝗰𝗮𝗱𝗼\` » ${ago}
🧊✿⃘࣪◌ ֪ \`𝗟𝗶𝗻𝗸\` » ${url}

𐙚 🪵 ｡ Preparando tu descarga... ˙𐙚`.trim();let b64='';try{const thumbRes=await conn.getFile(thumbnail);b64=thumbRes.data.toString('base64')}catch(e){console.log('Error al procesar la miniatura:',e)}await conn.relayMessage(data.chat,{extendedTextMessage:{text:infoMessage,matchedText:url,description:`Duración: ${timestamp} • Canal: ${canal}`,title,previewType:'shadow',jpegThumbnail:b64,contextInfo:{quotedMessage:m.message,participant:m.sender,stanzaId:m.key.id,remoteJid:data.chat,isForwarded:true,forwardingScore:999,forwardedNewsletterMessageInfo:{newsletterJid,newsletterName,serverMessageId:-1}}}},{quoted:m});const result=await convert(url,isVideo?'1':'0',isVideo?'128':quality,isVideo?quality:'720');const fileName=safeFileName(result.title,isVideo?'video':'audio');if(isVideo){const caption=`*${result.title}*\nCalidad: ${quality}p`;await conn.sendMessage(data.chat,{document:{url:result.downloadUrl},fileName:`${fileName}.mp4`,mimetype:'video/mp4',caption},{quoted:m})}else await conn.sendMessage(data.chat,{audio:{url:result.downloadUrl},fileName:`${fileName}.mp3`,mimetype:'audio/mpeg',ptt:false},{quoted:m});await conn.sendMessage(data.chat,{react:{text:'✅',key:m.key}})}catch(error){console.error('[play]',error?.response?.statusCode||'',error.message||error);await conn.sendMessage(data.chat,{react:{text:'❌',key:m.key}});return conn.reply(data.chat,`⚠︎ Error: ${error.message||'No se pudo procesar la descarga.'}`,m)}})
