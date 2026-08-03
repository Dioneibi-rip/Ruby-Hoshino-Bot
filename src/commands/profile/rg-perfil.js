import{formatJobLine,ensureJobFields}from'../../library/rpg-jobs.js'
import{ensureUserRole}from'../uncategorized/_roles.js'
import{resolveTarget,resolveInteractionTarget,resolveIdentityName}from'../../core/identity-utils.js'
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
let userId=await resolveInteractionTarget(m,conn)
let user=global.db.getUser(userId)
if(!user)return m.reply('> (っ- ‸ - ς) 𝖤𝗅 𝗎𝗌𝗎⍺𝗋𝗂𝗈 𝗇𝗈 𝖾𝗑𝗂𝗌𝗍𝖾 𝖾𝗇 𝗅⍺ 𝖻⍺𝗌𝖾 𝖽𝖾 𝖽⍺𝗍𝗈𝗌... 🌸')
ensureJobFields(user)
try{
let whatsappName
try{
whatsappName=await resolveIdentityName(conn,userId,{fallback:'𖤐 𝖲𝗂𝗇 𝖭𝗈𝗆𝖻𝗋𝖾 𖤐'})
}catch(e){
whatsappName='𖤐 𝖲𝗂𝗇 𝖭𝗈𝗆𝖻𝗋𝖾 𖤐'
}
const name=user.customName||user.name||whatsappName
const cumpleanos=user.birth||'𖠿 𝖭𝗈 𝖾𝗌𝗉𝖾𝖼𝗂𝖿𝗂𝖼⍺𝖽𝗈'
const genero=user.genre||'𖠿 𝖭𝗈 𝖾𝗌𝗉𝖾𝖼𝗂𝖿𝗂𝖼⍺𝖽𝗈'
const age=Number.isFinite(user.age)&&user.age>=0?`${user.age}`:`𝖣𝖾𝗌𝖼𝗈𝗇𝗈𝖼𝗂𝖽⍺ (𝖴𝗌⍺ ${usedPrefix}setage 𝗉⍺𝗋⍺ ⍺𝗇̃⍺𝖽𝗂𝗋𝗅⍺)`
let parejaId=await resolvePartnerJid(userId,user)
let parejaTag='✘ 𝖭⍺𝖽𝗂𝖾'
let mentions=[userId]
if(parejaId && typeof parejaId === 'string'){
parejaTag=`⚝ @${parejaId.split('@')[0]}`
if(/@s\.whatsapp\.net$/.test(parejaId))mentions.push(parejaId)
}
const description=user.description||'˖ ࣪⊹ 𝖭𝗂𝗇𝗀𝗎𝗇⍺ 𝖽𝖾𝗌𝖼𝗋𝗂𝗉𝖼𝗂𝗈́𝗇'
const exp=user.exp||0
const nivel=user.level||0
const role=ensureUserRole(user)
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
const botName=global.info?.botName||global.botname||'𝖤𝗅 𝖯𝗋𝗈𝗉𝗂𝖾𝗍⍺𝗋𝗂𝗈'
const profileText=`
╭━━━━「 𝖯𝖤𝖱𝖥𝖨𝖫 𝖣𝖤 𝖴𝖲𝖴𝖠𝖱𝖨𝖮 」━━━━
│ ⧉ 𖦹 𝖭𝗈𝗆𝖻𝗋𝖾 » ${name}
│ ⧉ 𖦹 𝖴𝗌𝖾𝗋 » @${userId.split('@')[0]}
│ ⧉ 𖦹 𝖣𝖾𝗌𝖼𝗋𝗂𝗉𝖼𝗂𝗈́𝗇 » ${description}
├────────────────────────
│ ⧉ 𖦹 𝖤𝖽⍺𝖽 » ${age}
│ ⧉ 𖦹 𝖢𝗎𝗆𝗉𝗅𝖾⍺𝗇̃𝗈𝗌 » ${cumpleanos}
│ ⧉ 𖦹 𝖦𝖾́𝗇𝖾𝗋𝗈 » ${genero}
│ ⧉ 𖦹 𝖢⍺𝗌⍺𝖽𝗈/⍺ 𝖼𝗈𝗇 » ${parejaTag}
├────────────────────────
│ ✦ 𝖳𝖨́𝖳𝖴𝖫𝖮 𝖣𝖤 𝖱𝖠𝖭𝖦𝖮 ✦
│ ⧉ 𖦹 ${role}
│ ⧉ 𖦹 𝖭𝗂𝗏𝖾𝗅 » ${nivel}
│ ⧉ 𖦹 𝖤𝗑𝗉 » ${exp.toLocaleString()}
├────────────────────────
│ ⧉ 𖦹 𝖢𝗈𝗂𝗇𝗌 » ${coins.toLocaleString()} ${moneda}
│ ⧉ 𖦹 𝖡⍺𝗇𝖼𝗈 » ${bankCoins.toLocaleString()} ${moneda}
│ ⧉ 𖦹 𝖯𝗋𝖾𝗆𝗂𝗎𝗆 » ${user.premium?'✔ 𝖠𝖼𝗍𝗂𝗏𝗈':'✘ 𝖨𝗇⍺𝖼𝗍𝗂𝗏𝗈'}
│ ⧉ 𖦹 𝖳𝗋⍺𝖻⍺𝗃𝗈 » ${jobLine}
╰━━━━「 ⋆｡°✩ ${botName} ⋆｡°✩ 」━━━━
`.trim()
await conn.sendMessage(m.chat,{image:{url:perfil},caption:profileText,contextInfo:{mentionedJid:mentions}},{quoted:m})
}catch(e){
await m.reply(`> 💔 (´；ω；\`) 𝖮𝖼𝗎𝗋𝗋𝗂𝗈́ 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 ⍺𝗅 𝗆𝗈𝗌𝗍𝗋⍺𝗋 𝖾𝗅 𝗉𝖾𝗋𝖿𝗂𝗅... ✨\n\n${e.message}`)
return false;
}
}
handler.help=['profile','perfil']
handler.tags=['rg']
handler.command=['profile','perfil']
export default handler
