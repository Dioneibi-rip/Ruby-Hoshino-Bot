import{userDefault}from'../../src/core/defaults.js'
const handler=async(m,{conn,command,usedPrefix,text})=>{
const emoji='✨'
const emoji2='❌'
const confirmar=text?.trim().toLowerCase()
if(confirmar!=='si')return conn.reply(m.chat,`${emoji2} ¿Seguro que quieres resetear tu cuenta? Se borrarán tu edad, nombre personalizado, economía, nivel, estadísticas y demás datos de usuario.\n\nEscribe *${usedPrefix+command} si* para confirmar.`,m)
const whatsappName=String(m.pushName||m.name||conn.getName?.(m.sender)||'').trim()
global.db.data.users[m.sender]={...userDefault,name:whatsappName,customName:'',registered:true,age:-1,regTime:-1}
return conn.reply(m.chat,`${emoji} Tu cuenta fue reseteada. Quedaste como usuario nuevo y volveré a usar tu nombre de WhatsApp automáticamente.`,m)
}
handler.help=['unreg','quitaregistro']
handler.tags=['rg']
handler.command=['unreg','quitaregistro','deregistrar']
export default handler
