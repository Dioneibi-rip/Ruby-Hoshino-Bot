const handler=async(m)=>{
const user=global.db.getUser(m.sender)||{}
const coinReward=user.premium?25200:15750
const expReward=user.premium?6000:3500
const diamondReward=user.premium?14:8
user.coin=(user.coin||0)+coinReward
user.exp=(user.exp||0)+expReward
user.diamond=(user.diamond||0)+diamondReward
m.reply(`🎁 *Recompensa semanal*\n\n`+`💸 ${m.moneda}: *+${coinReward.toLocaleString()}*\n`+`✨ Exp: *+${expReward.toLocaleString()}*\n`+`💎 Diamantes: *+${diamondReward}*\n\n`+`👑 Premium recibe más monedas, EXP y diamantes.`)
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
