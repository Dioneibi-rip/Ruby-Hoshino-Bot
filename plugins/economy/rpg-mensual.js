let handler=async(m)=>{
let user=global.db.getUser(m.sender)||{}
const premiumFactor=user.premium?1.3:1
const coinReward=Math.floor(pickRandom([180000,204000,228000,252000])*premiumFactor)
const expReward=Math.floor(pickRandom([24000,28000,32000,36000])*premiumFactor)
const diamondReward=Math.floor(pickRandom([28,34,40,46])*premiumFactor)
user.coin=(user.coin||0)+coinReward
user.exp=(user.exp||0)+expReward
user.diamond=(user.diamond||0)+diamondReward
user.diamonds=(user.diamonds||0)+diamondReward
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
export default handler
function pickRandom(list){
return list[Math.floor(Math.random()*list.length)]
}
