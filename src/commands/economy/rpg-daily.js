const handler=async(m,{conn})=>{
const normalizeJid=(jid)=>{
if(!jid)return null
jid=jid.replace(/[^\d@]/g,'')
if(!jid.includes('@'))return null
if(jid.endsWith('@s.whatsapp.net'))return jid
if(jid.endsWith('@g.us'))return jid
if(!jid.endsWith('@s.whatsapp.net'))jid=jid.split('@')[0]+'@s.whatsapp.net'
return jid
}
const normalizedSender=normalizeJid(m.sender)
const user=global.db.getUser(normalizedSender)
user.dailyStreak=Math.min(30,(user.dailyStreak||0)+1)
const streak=user.dailyStreak
const premiumMultiplier=user.premium?1.25:1
const coinReward=Math.floor(randomInt(500,1000)*premiumMultiplier)
const diamondReward=1+Math.floor(streak/10)+(user.premium?1:0)
const expReward=Math.floor(randomInt(220,420)*(1+Math.min(0.20,streak*0.01))*premiumMultiplier)
user.coin=(user.coin||0)+coinReward
user.diamond=(user.diamond||0)+diamondReward
user.exp=(user.exp||0)+expReward
conn.reply(m.chat,`「✿」Recompensa diaria reclamada (racha *${streak}*):\n`+`💰 ${m.moneda}: *+${coinReward.toLocaleString()}*\n`+`💎 Diamantes: *+${diamondReward}*\n`+`✨ Exp: *+${expReward}*\n\n`+`Rango diario estabilizado: *500-1,000 ${m.moneda}* (Premium máx. x${premiumMultiplier})`,m)
}
handler.help=['daily','diario']
handler.tags=['rpg']
handler.command=['daily','diario']
handler.group=true
handler.register=true
handler.cooldown=86400000
handler.cooldownMessage = (seconds, time, hms) => `🌸 Ya cobraste tu diario.
⏳ Vuelve en *${hms}*.`;

export default handler

function randomInt(min,max){
return Math.floor(Math.random()*(max-min+1))+min
}
