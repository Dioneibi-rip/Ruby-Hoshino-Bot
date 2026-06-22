const handler=async(m,{conn,command,usedPrefix,text})=>{
const emoji='✨'
const emoji2='❌'
const confirmar=text?.trim().toLowerCase()
const user=global.db.getUser(m.sender)
const deuda=Math.min(0,Number(user.coin)||0)+Math.min(0,Number(user.bank)||0)
if(deuda<0)return conn.reply(m.chat,`${emoji2} No puedes reiniciar tu cuenta mientras tengas deudas pendientes.\n\nDebes liquidar *¥${Math.abs(deuda).toLocaleString()} ${m.moneda}* antes de usar *${usedPrefix+command}*.`,m)
if(confirmar!=='si')return conn.reply(m.chat,`${emoji2} ¿Seguro que quieres reiniciar totalmente tu cuenta? Se borrarán economía, nivel, trabajos, matrimonio, estadísticas y cualquier progreso.

Escribe *${usedPrefix+command} si* para confirmar.`,m)
global.db.delete('users',m.sender)
return conn.reply(m.chat,`${emoji} Tu cuenta fue eliminada por completo. En tu próximo mensaje se creará otra vez desde cero con trabajo Ninguno, 0 monedas y sin vínculos anteriores.`,m)
}
handler.help=['unreg','quitaregistro','reset']
handler.tags=['rg']
handler.command=['unreg','quitaregistro','deregistrar','reset']
export default handler
