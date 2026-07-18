import { normalizeJid, resolveIdentityName } from '../../core/identity-utils.js'
let handler=async(m,{conn,args,groupMetadata})=>{
const metadata=await conn.groupMetadata(m.chat).catch(()=>groupMetadata||{})
const participantIds=[...new Set((metadata?.participants||[]).flatMap(participant=>[participant?.id,participant?.jid,participant?.lid]).map(normalizeJid).filter(Boolean))]
const requestedPage=Number.parseInt(args[0],10)
const perPage=10
const rows=global.db.topUsersByIds?.(participantIds,{field:'coin'})||[]
const totalPages=Math.max(1,Math.ceil(rows.length/perPage))
const page=Math.min(Math.max(Number.isInteger(requestedPage)&&requestedPage>0?requestedPage:1,1),totalPages)
const start=(page-1)*perPage
const icons=['👑','🥈','🥉']
let text=`「✿」Los usuarios con más *${m.moneda}* son:\n\n`
for(const[rowIndex,row]of rows.slice(start,start+perPage).entries()){
const fallback=String(row.id).split('@')[0]
const name=(await resolveIdentityName(conn,row.id,{fallback})).replace(/@/g,'')||fallback
text+=`${icons[start+rowIndex]||'✰'} ${start+rowIndex+1} » *${name}:*\n\t\tTotal→ *¥${Number(row.coin||0).toLocaleString()} ${m.moneda}*\n`
}
if(!rows.length)text+='✰ Aún no hay balances de participantes registrados.\n'
await conn.reply(m.chat,`${text}\n> • Pagina *${page}* de *${totalPages}*`.trim(),m)
}
handler.help=['baltop']
handler.tags=['rpg']
handler.command=['baltop','eboard']
handler.group=true
handler.register=true
handler.exp=0
export default handler
