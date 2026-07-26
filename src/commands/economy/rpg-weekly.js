const handler=async(m)=>{
const user=global.db.getUser(m.sender)||{}
const premiumMultiplier=user.premium?1.25:1
const coinReward=Math.floor(randomInt(4000,7000)*premiumMultiplier)
const expReward=Math.floor(randomInt(1800,3200)*premiumMultiplier)
const diamondReward=Math.floor(randomInt(5,9)*premiumMultiplier)
user.coin=(user.coin||0)+coinReward
user.exp=(user.exp||0)+expReward
user.diamond=(user.diamond||0)+diamondReward
m.reply(`🎁 *Recompensa semanal*\n\n`+`💸 ${m.moneda}: *+${coinReward.toLocaleString()}*\n`+`✨ Exp: *+${expReward.toLocaleString()}*\n`+`💎 Diamantes: *+${diamondReward}*\n\n`+`👑 Premium aplica un multiplicador controlado máximo x1.25.`)
}
handler.help=['weekly']
handler.tags=['rpg']
handler.command=['semanal','weekly']
handler.group=true
handler.register=true
handler.cooldown=604800000
handler.cooldownMessage = (seconds, time, hms) => `🎁 Ya reclamaste tu semanal.
Vuelve en *${hms}*`;

export default handler

function randomInt(min,max){
return Math.floor(Math.random()*(max-min+1))+min
}
