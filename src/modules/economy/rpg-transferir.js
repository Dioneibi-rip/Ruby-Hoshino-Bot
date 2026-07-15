import { buildParticipantsByLid, normalizeIdentityJid, resolveTarget, resolveIdentityName } from '../../core/identity-utils.js'
async function handler(m,{conn,args,usedPrefix,command,participants}){
const participantsByLid=buildParticipantsByLid(participants)
let who=await resolveTarget(m,conn,{participantsByLid,errorMessage:''})
if(!who)return m.reply(`${emoji} ᥱ𝗍і𝗊ᥙᥱ𝗍ᥲ ᥆ rᥱs⍴᥆ᥒძᥱ ᥲᥣ mᥱᥒsᥲȷᥱ ძᥱᥣ ᥙsᥙᥲrі᥆ ᥲᥣ 𝗊ᥙᥱ 𝗊ᥙіᥱrᥱs 𝗍rᥲᥒsFᥱrіr.`)
let senderJid=await normalizeIdentityJid(conn,m.sender,participantsByLid)
let targetJid=await normalizeIdentityJid(conn,who,participantsByLid)
const amountText=args.find(arg=>!arg.startsWith('@')&&isNumber(arg))
if(!amountText)return m.reply(`(๑•̌ . •̑๑)ˀ̣ˀ̣  ძᥱᑲᥱs ᥱs⍴ᥱᥴі𝖿іᥴᥲr ᥣᥲ ᥴᥲᥒ𝗍іძᥲძ ძᥱ ${m.moneda} 𝗊ᥙᥱ 𝗊ᥙіᥱrᥱs transferir.\n> *ᥱȷᥱm⍴ᥣ᥆:* ${usedPrefix+command} 1000 @usuario`)
const count=Math.min(Number.MAX_SAFE_INTEGER,Math.max(1,parseInt(amountText)))
const tax=Math.floor(count*0.10)
const received=count-tax
const user=global.db.getUser(senderJid)
const type='coin'
const bankType='bank'
if(user[bankType]<count)return m.reply(`⚠️ ᥒ᥆ 𝗍іᥱᥒᥱs sᥙ𝖿іᥴіᥱᥒ𝗍ᥱs ${m.moneda} ᥱᥒ ᥱᥣ ᑲᥲᥒᥴ᥆ ⍴ᥲrᥲ rᥱᥲᥣіzᥲr ᥣᥲ transferenciᥲ.`)
if(!global.db.userExists(targetJid))return m.reply(`❌ ᥱᥣ ᥙsᥙᥲrі᥆ ᥒ᥆ sᥱ ᥱᥒᥴᥙᥱᥒ𝗍rᥲ ᥱᥒ mі ᑲᥲsᥱ ძᥱ datos.`)
if(targetJid===senderJid)return m.reply(`❌ ᥒ᥆ ⍴ᥙᥱძᥱs 𝗍rᥲᥒs𝖿ᥱrіr𝗍ᥱ ძіᥒᥱr᥆ ᥲ 𝗍і mіsm᥆.`)
user[bankType]-=count
const target=global.db.getUser(targetJid)
target[type]=(target[type]||0)+received
const mentionText=await resolveIdentityName(conn,targetJid,{participantsByLid,fallback:`@${String(targetJid).split('@')[0]}`})
global.db.updateUser(senderJid,{[bankType]:user[bankType]})
global.db.updateUser(targetJid,{[type]:target[type]})
m.reply(`✅ ¡𝗍rᥲᥒsFᥱrᥱᥒᥴіᥲ ᥱ᥊і𝗍᥆sᥲ!\n\n› һᥲs ᥱᥒ᥎іᥲძ᥆ *${count.toLocaleString()} ${m.moneda}* ᥲ ${mentionText}.\n› Impuesto comercial 10%: *${tax.toLocaleString()} ${m.moneda}*.\n› ${mentionText} recibió *${received.toLocaleString()} ${m.moneda}*.\n› 𝗍ᥱ 𝗊ᥙᥱძᥲᥒ *${user[bankType].toLocaleString()} ${m.moneda}* en el banco.`,null,{mentions:[targetJid]})
}
handler.help=['pay <cantidad> @usuario']
handler.tags=['rpg']
handler.command=['pay','transfer']
handler.group=true
handler.register=true
export default handler
function isNumber(x){
if(typeof x==='string')x=x.trim()
return !isNaN(x)&&x!==''
}
