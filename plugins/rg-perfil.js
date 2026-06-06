import fs from'fs'
import path from'path'
import{formatJobLine,ensureJobFields}from'../lib/rpg-jobs.js'
const marriagesFile=path.resolve('src/database/casados.json')
function loadMarriages(){
try{
if(!fs.existsSync(marriagesFile))return{}
return JSON.parse(fs.readFileSync(marriagesFile,'utf8'))||{}
}catch(e){
return{}
}
}
function resolvePartnerJid(userId,user){
if(user?.marry)return user.marry
const marriages=loadMarriages()
if(marriages[userId]?.partner)return marriages[userId].partner
return null
}
let handler=async(m,{conn,usedPrefix})=>{
let userId
if(m.quoted?.sender)userId=m.quoted.sender
else if(m.mentionedJid?.[0])userId=m.mentionedJid[0]
else userId=m.sender
let user=global.db.data.users[userId]
if(!user)return m.reply('⚠️ El usuario no existe en la base de datos.')
ensureJobFields(user)
try{
let whatsappName
try{
whatsappName=await conn.getName(userId)
}catch(e){
whatsappName='𖤐 Sin Nombre 𖤐'
}
const name=user.customName||user.name||whatsappName
const cumpleanos=user.birth||'𖠿 No especificado'
const genero=user.genre||'𖠿 No especificado'
const age=Number.isFinite(user.age)&&user.age>=0?`${user.age}`:`Desconocida (Usa ${usedPrefix}setage para añadirla)`
let parejaId=resolvePartnerJid(userId,user)
let parejaTag='✘ Nadie'
let mentions=[userId]
if(parejaId){
parejaTag=`⚝ @${parejaId.split('@')[0]}`
if(/@s\.whatsapp\.net$/.test(parejaId))mentions.push(parejaId)
}
const description=user.description||'˖ ࣪⊹ Ninguna descripción'
const exp=user.exp||0
const nivel=user.level||0
const role=user.role||'✧ Sin rango'
const coins=user.coin||0
const bankCoins=user.bank||0
const jobLine=formatJobLine(user)
const moneda=m.moneda||'Coins'
let perfil
try{
perfil=await conn.profilePictureUrl(userId,'image')
}catch(e){
perfil='https://files.catbox.moe/xr2m6u.jpg'
}
const botName=global.info?.botName||global.botname||'El Propietario'
const profileText=`
╭━━━━「 𝖯𝖤𝖱𝖥𝖨𝖫 𝖣𝖤 𝖴𝖲𝖴𝖠𝖱𝖨𝖮 」━━━━
│ ⧉ 𖦹 𝖭𝗈𝗆𝖻𝗋𝖾 » ${name}
│ ⧉ 𖦹 𝖴𝗌𝖾𝗋 » @${userId.split('@')[0]}
│ ⧉ 𖦹 𝖣𝖾𝗌𝖼𝗋𝗂𝗉𝗍𝗂𝗈𝗇 » ${description}
├────────────────────────
│ ⧉ 𖦹 𝖠𝗀𝖾 » ${age}
│ ⧉ 𖦹 𝖢𝗎𝗆𝗉𝗅𝖾 » ${cumpleanos}
│ ⧉ 𖦹 𝖦énero » ${genero}
│ ⧉ 𖦹 𝖢𝖺𝗌𝖺𝖽𝗈/𝖺 𝖢𝗈𝗇 » ${parejaTag}
├────────────────────────
│ ⧉ 𖦹 𝖭𝗂𝗏𝖾𝗅 » ${nivel}
│ ⧉ 𖦹 𝖤𝗑𝗉 » ${exp.toLocaleString()}
│ ⧉ 𖦹 𝖱𝖺𝗇𝗀𝗈 » ${role}
├────────────────────────
│ ⧉ 𖦹 𝖢𝗈𝗂𝗇𝗌 » ${coins.toLocaleString()} ${moneda}
│ ⧉ 𖦹 𝖡𝖺𝗇𝗄 » ${bankCoins.toLocaleString()} ${moneda}
│ ⧉ 𖦹 𝖯𝗋𝖾𝗆𝗂𝗎𝗆 » ${user.premium?'✔ Activo':'✘ Inactivo'}
│ ⧉ 𖦹 𝖳𝗋𝖺𝖻𝖺𝗃𝗈 » ${jobLine}
╰━━━━「 ⋆｡°✩ ${botName} ⋆｡°✩ 」━━━━
`.trim()
await conn.sendMessage(m.chat,{image:{url:perfil},caption:profileText,contextInfo:{mentionedJid:mentions}},{quoted:m})
}catch(e){
await m.reply(`⚠️ Error al mostrar el perfil:\n\n${e.message}`)
}
}
handler.help=['profile','perfil']
handler.tags=['rg']
handler.command=['profile','perfil']
export default handler
