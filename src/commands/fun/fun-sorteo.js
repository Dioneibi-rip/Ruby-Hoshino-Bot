async function handler(m,{groupMetadata,command,conn,text,usedPrefix}){
let user=a=>'@'+a.split('@')[0]
if(!text)return conn.reply(m.chat,`${emoji} Por favor ingresa lo que deseas sortear.`,m)
const metadata=await conn.groupMetadata(m.chat).catch(()=>groupMetadata||{})
let ps=[...new Set((metadata?.participants||[]).flatMap(v=>[v?.id,v?.jid]).filter(Boolean))]
if(!ps.length)return conn.reply(m.chat,`${emoji} No pude obtener participantes para el sorteo.`,m)
let a=ps.getRandom()
let top=`*[🥳 \`ＦＥＬＩＣＩＤＡＤＥＳ\` 🥳]*\n\n${user(a)} 🥳\nAcaba de ganar el sorteo felicitaciones 🎉`
let txt=''
let count=0
for(const c of top){
await new Promise(resolve=>setTimeout(resolve,15))
txt+=c
count++
if(count%10===0){
conn.sendPresenceUpdate('composing',m.chat);
}
}
await conn.sendMessage(m.chat,{text:txt.trim(),mentions:conn.parseMention(txt)},{quoted:m,ephemeralExpiration:24*60*100,disappearingMessagesInChat:24*60*100})

}
handler.help=['sorteo']
handler.command=['sorteo']
handler.tags=['fun']
handler.group=true
handler.register=true

export default handler
