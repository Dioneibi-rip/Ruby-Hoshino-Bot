let handler=async(m)=>{
let user=global.db.getUser(m.sender)||{}
const premiumFactor=user.premium?1.25:1
const coinReward=Math.floor(randomInt(15000,25000)*premiumFactor)
const expReward=Math.floor(randomInt(6000,10000)*premiumFactor)
const diamondReward=Math.floor(randomInt(15,25)*premiumFactor)
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
function randomInt(min,max){
return Math.floor(Math.random()*(max-min+1))+min
}
