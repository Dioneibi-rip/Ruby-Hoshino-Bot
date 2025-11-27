import {promises as fs} from'fs'

const charactersFilePath='./src/database/characters.json'
const haremFilePath='./src/database/harem.json'

async function loadCharacters(){try{const data=await fs.readFile(charactersFilePath,'utf-8');return JSON.parse(data)}catch(error){throw new Error('❀ No se pudo cargar el archivo characters.json.')}}
async function loadHarem(){try{const data=await fs.readFile(haremFilePath,'utf-8');return JSON.parse(data)}catch(error){return[]}}

function normalize(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').trim().replace(/\s+/g,' ')}
function tokens(s){const t=normalize(s);return t? t.split(' '):[]}
function levenshtein(a,b){
a=String(a);b=String(b)
if(a===b)return 0
const m=a.length,n=b.length
if(m===0)return n
if(n===0)return m
let v0=new Array(n+1),v1=new Array(n+1)
for(let j=0;j<=n;j++)v0[j]=j
for(let i=0;i<m;i++){
v1[0]=i+1
for(let j=0;j<n;j++){
const cost=a.charAt(i)===b.charAt(j)?0:1
v1[j+1]=Math.min(v1[j]+1,v0[j+1]+1,v0[j]+cost)
}
[v0,v1]=[v1,v0]
}
return v0[n]
}

let handler=async(m,{conn,args})=>{
if(args.length===0){await conn.reply(m.chat,`《✧》Por favor, proporciona el nombre de un personaje.`,m);return}
const characterNameRaw=args.join(' ').trim()
const characterName=normalize(characterNameRaw)
try{
const characters=await loadCharacters()
let character=characters.find(c=>normalize(c.name)===characterName)
if(!character){
let best=null
let bestScore=0
const qTokens=tokens(characterNameRaw)
for(const c of characters){
const nameNorm=normalize(c.name)
if(!nameNorm)continue
if(nameNorm.includes(characterName)) {best=c;bestScore=1;break}
const nameTokens=tokens(c.name)
let common=0
for(const t of qTokens) if(nameTokens.includes(normalize(t))) common++
const tokenScore = qTokens.length? common/qTokens.length:0
let aliasTokenScore=0
if(c.aliases && Array.isArray(c.aliases)){
for(const a of c.aliases){
const aTokens=tokens(a)
let commonA=0
for(const t of qTokens) if(aTokens.includes(normalize(t))) commonA++
aliasTokenScore=Math.max(aliasTokenScore, qTokens.length? commonA/qTokens.length:0)
}
}
const levDist=levenshtein(characterName,nameNorm)
const levScore=1 - levDist/Math.max(characterName.length,nameNorm.length,1)
const score=Math.max(tokenScore,aliasTokenScore,levScore*0.9)
if(score>bestScore){bestScore=score;best=c}
}
if(bestScore>=0.6){character=best}
}
if(!character){await conn.reply(m.chat,`《✧》No se ha encontrado el personaje *${characterNameRaw}*. Asegúrate de que el nombre esté correcto.`,m);return}
const randomImage=character.img[Math.floor(Math.random()*character.img.length)]
const message=`❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
❖ Fuente » *${character.source}*`
await conn.sendFile(m.chat,randomImage,`${character.name}.jpg`,message,m)
}catch(error){await conn.reply(m.chat,`✘ Error al cargar la imagen del personaje: ${error.message}`,m)}
}

handler.help=['wimage <nombre del personaje>']
handler.tags=['anime']
handler.command=['charimage','wimage','waifuimage']
handler.group=true

export default handler
