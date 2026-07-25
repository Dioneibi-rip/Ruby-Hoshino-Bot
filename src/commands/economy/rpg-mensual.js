let handler=async(m)=>{
let user=global.db.getUser(m.sender)||{}
const premiumFactor=user.premium?1.3:1
const coinReward=Math.floor(pickRandom([90000,102000,114000,126000])*premiumFactor*0.7)
const expReward=Math.floor(pickRandom([12000,14000,16000,18000])*premiumFactor)
const diamondReward=Math.floor(pickRandom([28,34,40,46])*premiumFactor)
user.coin=(user.coin||0)+coinReward
user.exp=(user.exp||0)+expReward
user.diamond=(user.diamond||0)+diamondReward
const mensaje=`
╭───────「  🎁 𝐌𝐄𝐍𝐒𝐔𝐀𝐋 - 𝐁𝐎𝐍𝐔𝐒 🎁 」───────
│ ✿ ¡Has reclamado tu regalo mensual!
│
│ 💸 ${m.moneda}: *+¥${coinReward.toLocaleString()}*
│ ✨ Experiencia: *+${expReward.toLocaleString()} XP*
│ 💎 Diamantes: *+${diamondReward}*
│ 👑 Multiplicador premium: *x${premiumFactor}*
╰─────────────────────────────

⏳ Puedes volver a reclamarlo dentro de *4 semanas*
`.trim()
m.reply(mensaje)
}
handler.help=['mensual']
handler.tags=['rpg']
handler.command=['mensual','monthly']
handler.group=true
handler.register=true
handler.cooldown=2419200000
handler.cooldownMessage = (seconds, time, hms) => `${emoji3} ✿ Ya reclamaste tu *recompensa mensual* ✿
⏳ Vuelve en *${hms}*`;

export default handler
function pickRandom(list){
return list[Math.floor(Math.random()*list.length)]
}
