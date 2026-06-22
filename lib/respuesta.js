import fetch from 'node-fetch'

const imagenes=[
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%A4%8D%20(1).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%8C%9FRuby%20Hoshino%F0%9F%8C%9F.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%97%8B%F0%9D%97%8E%F0%9D%96%BB%F0%9D%97%92%20%F0%9D%97%81%F0%9D%97%88%F0%9D%97%8C%F0%9D%97%81%F0%9D%97%82%F0%9D%97%87%F0%9D%97%88.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%93%A1%F0%9D%93%BE%F0%9D%93%AB%F0%9D%94%82%20%F0%9D%93%98%F0%9D%93%AC%F0%9D%93%B8%F0%9D%93%B7%F0%9D%93%BC%20%E2%AD%90%F0%9F%92%AB.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%91%B9%F0%9D%92%96%F0%9D%92%83%F0%9D%92%9A%20%F0%9D%91%AF%F0%9D%92%90%F0%9D%92%94%F0%9D%92%89%F0%9D%92%8A%F0%9D%92%8F%F0%9D%92%90.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%9D%A4.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%86Hoshino%20Ruby%E2%98%86.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%85%20!!%20(2).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%85%20!!%20(1).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%CB%9A%20%E0%BC%98%E2%99%A1%20%E2%8B%86%EF%BD%A1%CB%9A%20Hoshino%20Ruby.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/ruby%20hoshino%20(9).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/ruby%20hoshino%20(11).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(15).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(14).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(13).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20hoshino%20%F0%9F%A7%A1.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20_%20oshi%20no%20ko%20_.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20-%20%F0%9F%8C%9F%5BOshi%20no%20Ko%5D%F0%9F%8C%9F%20icons.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(10).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20%23oshinokk.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Hoshino%20Ruby%20(3).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%23oshinoko%20%23%EC%B5%9C%EC%95%A0%EC%9D%98%EC%95%84%EC%9D%B4.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9D%99%8D%F0%9D%99%AA%F0%9D%99%97%F0%9D%99%AE%20%F0%9D%99%83%F0%9D%99%A4%F0%9D%99%A8%F0%9D%99%9D%F0%9D%99%9E%F0%9D%99%A3%F0%9D%99%A4.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%F0%9F%8E%80%20%E2%8B%AE%20%F0%9D%91%B9%F0%9D%92%96%F0%9D%92%83%F0%9D%92%9A%20%F0%9D%92%8A%F0%9D%92%84%F0%9D%92%90%F0%9D%92%8F.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%98%85%20!!%20(3).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E2%9D%A4%EF%B8%8F%F0%9D%91%AF%F0%9D%92%90%F0%9D%92%94%F0%9D%92%89%F0%9D%92%8A%F0%9D%92%8F%F0%9D%92%90%20%F0%9D%91%B9%F0%9D%92%96%F0%9D%92%83%F0%9D%92%9A%E2%9D%A4%EF%B8%8F.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/%E0%AD%A8%E0%A7%8E.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(19).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(18).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(17).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/_%20(16).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(16).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(15).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(14).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(13).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby%20Hoshino%20(12).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Hoshino%20Ruby%20%E2%99%A1.jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Hoshino%20Ruby%20(4).jpeg",
"https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/(%F0%9F%8E%80)%20%20%E2%80%A6%20%20%E2%97%9E%20ruby%20%E2%97%9F%20%E2%98%86.jpeg"
]

const newsletterJid='120363335626706839@newsletter'
const newsletterName='𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭'
const fallbackImage='https://files.catbox.moe/xr2m6u.jpg'

const handler=async(type,conn,m,comando)=>{
const msg={
rowner:'「 🌌 」 *¡A-Ah! (⁄ ⁄•⁄ω⁄•⁄ ⁄) ᴇsᴛᴀ ғᴜɴᴄɪᴏ́ɴ ᴇs ᴇxᴄʟᴜsɪᴠᴀ ᴘᴀʀᴀ ᴍɪ ᴄʀᴇᴀᴅᴏʀ ᴄᴇʟᴇsᴛɪᴀʟ,* `ᴅɪᴏɴᴇɪʙɪ-sᴀᴍᴀ` *~ 💫*\n\n> 🎀 `sᴏʟᴏ ǫᴜɪᴇɴ ᴍᴇ ᴅɪᴏ ᴠɪᴅᴀ ᴘᴜᴇᴅᴇ ᴜsᴀʀʟᴀ.` ฅ(•ㅅ•❀)ฅ',
owner:'「 👑 」 *¡Nʏᴀᴀ~! (≧◡≦) sᴏʟᴏ ᴍɪ* `ᴅᴜᴇɴ̃ᴏ ʏ ᴘʀᴏɢʀᴀᴍᴀᴅᴏʀᴇs` *ᴛɪᴇɴᴇɴ ᴘᴇʀᴍɪsᴏ ᴘᴀʀᴀ ᴇᴊᴇᴄᴜᴛᴀʀ ᴇsᴛᴏ~ 💕*',
mods:'「 🧸 」 *Uɢᴜᴜ~ (,,>﹏<,,) ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ ᴇs ᴇxᴄʟᴜsɪᴠᴏ ᴘᴀʀᴀ ʟᴏs* `ᴀʏᴜᴅᴀɴᴛᴇs ᴍᴀ́ɢɪᴄᴏs` *ᴅᴇ ʀᴜʙʏ. ✨*',
premium:'「 💎 」 *¡Eʜʜ~? (o_O) ᴇsᴛᴀ ʜᴀʙɪʟɪᴅᴀᴅ ᴇs sᴏʟᴏ ᴘᴀʀᴀ* `ᴜsᴜᴀʀɪᴏs ᴘʀᴇᴍɪᴜᴍ-ᴅᴇsᴜ` *~ ʟᴏ sɪᴇɴᴛᴏ ᴍᴜᴄʜᴏ.* 🌸',
group:'「 🐾 」 *¡Oɴɪɪ-ᴄʜᴀɴ! (ง ื▿ ื)ว ᴇsᴛᴀ ғᴜɴᴄɪᴏ́ɴ sᴏ́ʟᴏ ᴘᴜᴇᴅᴇ ᴜsᴀʀsᴇ ᴇɴ* `ɢʀᴜᴘᴏs` *... ¡Iɴᴠɪ́ᴛᴀᴍᴇ ᴀ ᴜɴᴏ!* 🍡',
private:'「 💌 」 *Sʜʜ~ ( ˘ ³˘)♥︎ ᴜsᴀ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ ᴇɴ* `ᴘʀɪᴠᴀᴅᴏ` *ᴄᴏɴᴍɪɢᴏ, ᴘᴏʀғɪs... sᴏʟᴏ ᴛᴜ́ ʏ ʏᴏ 💙.*',
admin:'「 🛡️ 」 *¡Kʏᴀʜ~! ( Ò﹏Ó) sᴏʟᴏ ʟᴏs* `ᴀᴅᴍɪɴ-sᴇɴᴘᴀɪ` *ᴅᴇʟ ɢʀᴜᴘᴏ ᴘᴜᴇᴅᴇɴ ᴜsᴀʀ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ.* 🎀',
botAdmin:'「 🔧 」 *¡E-ᴇsᴘᴇʀᴀ! (｡•́︿•̀｡)* `ɴᴇᴄᴇsɪᴛᴏ sᴇʀ ᴀᴅᴍɪɴ` *ᴘᴀʀᴀ ʜᴀᴄᴇʀ ᴇsᴏ... ¿ᴍᴇ ᴀʏᴜᴅᴀs ᴀ ᴅᴇsᴀᴛᴀʀ ᴍɪ ᴘᴏᴅᴇʀ?* 💫',
unreg:'「 🔄 」 *Tu perfil se crea automáticamente.* Si quieres empezar desde cero, usa `/unreg si` para reiniciar tu cuenta.',
nsfw:'「 🚫 」 *¡B-ʙᴀᴋᴀ! (///￣ ￣///) ᴇʟ ᴄᴏɴᴛᴇɴɪᴅᴏ* `ɴsғᴡ` *ᴇsᴛᴀ́ ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ ᴘᴀʀᴀ ᴘʀᴏᴛᴇɢᴇʀ ᴛᴜ ᴘᴜʀᴏ ᴋᴏᴋᴏʀᴏ 💙.*',
restrict:'「 📵 」 *¡Oᴜʜ~! (￣▽￣*)ゞ ᴇsᴛᴀ ᴏᴘᴄɪᴏ́ɴ ᴇsᴛᴀ́* `ʟɪᴍɪᴛᴀᴅᴀ` *ᴘᴏʀ ᴍɪ ᴄʀᴇᴀᴅᴏʀ.*\n\n> 💌 `ᴄᴏɴᴛᴀᴄᴛᴀ ᴄᴏɴ ᴇ́ʟ sɪ ᴅᴇsᴇᴀs ᴀᴄᴛɪᴠᴀʀʟᴀ.`'
}[type]

if(msg){
const randomUrl=imagenes[Math.floor(Math.random()*imagenes.length)]
const matchedUrl='https://github.com/Dioneibi-rip'

let rimg
try{
const response=await fetch(randomUrl)
if(response.ok){
const arrayBuffer=await response.arrayBuffer()
rimg=Buffer.from(arrayBuffer)
}else{
throw new Error()
}
}catch(error){
try{
const fallbackRes=await fetch(fallbackImage)
const fbBuffer=await fallbackRes.arrayBuffer()
rimg=Buffer.from(fbBuffer)
}catch{
rimg=null
}
}

await conn.sendMessage(m.chat,{
text:`${matchedUrl}\n\n${msg}`,
contextInfo:{
externalAdReply:{
title:'⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥',
body:'꒰ 🧺 ᑲіᥱᥒ᥎ᥱᥒіძ᥆ ᥲᥣ sᥙ́ρᥱr ᑲ᥆𝗍 ძᥱ ᥕһᥲ𝗍sᥲρρ ꒱',
thumbnail:rimg,
sourceUrl:matchedUrl,
mediaType:1,
renderLargerThumbnail:true
},
isForwarded:true,
forwardingScore:999,
forwardedNewsletterMessageInfo:{
newsletterJid,
newsletterName,
serverMessageId:-1
}
}
},{quoted:m})

await m.react('🎀')
}

return true
}

export default handler