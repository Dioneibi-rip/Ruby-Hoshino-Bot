import{formatJobLine,ensureJobFields}from'../../lib/rpg-jobs.js'
async function loadMarriages(){
return global.db?.getSection?.('marriages') || {}
}
async function resolvePartnerJid(userId,user){
if(user?.marry)return user.marry
const marriages=await loadMarriages()
if(marriages[userId]?.partner)return marriages[userId].partner
return null
}
let handler=async(m,{conn,usedPrefix})=>{
let userId
if(m.quoted?.sender)userId=m.quoted.sender
else if(m.mentionedJid?.[0])userId=m.mentionedJid[0]
else userId=m.sender
let user=global.db.getUser(userId)
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
let parejaId=await resolvePartnerJid(userId,user)
let parejaTag='✘ Nadie'
let mentions=[userId]
if(parejaId && typeof parejaId === 'string'){
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
╭━━━━「 𝖯𝖤𝖱𝖥𝖨𝖫 𝖣𝖤 𝖴𝖲𝖴𝖠𝖱𝖎𝖔 」━━━━
│ ⧉ 𖦹 𝖭𝗈𝗆𝖻𝗋𝖊 » ${name}
│ ⧉ 𖦹 𝖴𝗌𝖊𝗋 » @${userId.split('@')[0]}
│ ⧉ 𖦹 𝖣𝖾𝗌𝖈𝗋𝗂𝗉𝗍𝗂𝖔𝗇 » ${description}
├────────────────────────
│ ⧉ 𖦹 𝖠𝗀𝖊 » ${age}
│ ⧉ 𖦹 𝖢𝗎𝗆𝗉𝗅𝖊 » ${cumpleanos}
│ ⧉ 𖦹 𝖦𝗌𝗇𝖊𝗋𝖔 » ${genero}
│ ⧉ 𖦹 𝖈𝖆𝗌𝖎𝖉𝖔/𝖎 𝖈𝖙𝗇 » ${parejaTag}
├────────────────────────
│ ⧉ 𖦹 𝖭𝗂𝗏𝖊𝗅 » ${nivel}
│ ⧉ 𖦹 𝖤𝖝𝗉 » ${exp.toLocaleString()}
│ ⧉ 𖦹 𝖱𝖆𝖓𝖆𝖔 » ${role}
├────────────────────────
│ ⧉ 𖦹 𝖈𝗈𝗂𝖓𝖘 » ${coins.toLocaleString()} ${moneda}
│ ⧉ 𖦹 𝖇𝖎𝖘𝖐 » ${bankCoins.toLocaleString()} ${moneda}
│ ⧉ 𖦹 𝖕𝖕𝖈𝖔𝖎𝖍𝖎𝖔 » ${user.premium?'✔ Activo':'✘ Inactivo'}
│ ⧉ 𖦹 𝖈𝗋𝖎𝖇𝖖𝖏𝖔 » ${jobLine}
╰━━━━「 ⋆｡°✩ ${botName} ⋆｡°✩ 」━━━━
`.trim()
await conn.sendMessage(m.chat,{image:{url:perfil},caption:profileText,contextInfo:{mentionedJid:mentions}},{quoted:m})
}catch(e){
await m.reply(`⚠️ Error al mostrar el perfil:\n\n${e.message}`)
  return false;
}
}
handler.help=['profile','perfil']
handler.tags=['rg']
handler.command=['profile','perfil']
export default handler
