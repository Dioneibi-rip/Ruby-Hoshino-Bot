import fetch from 'node-fetch';

const handler=async(m,{conn,args,usedPrefix,command})=>{
const emoji="🌸";
const tiktokRegex=/^(https?:\/\/)?(www\.|vm\.|vt\.|t\.)?tiktok\.com\/.+/i;

if(!args[0]||!tiktokRegex.test(args[0])){
return conn.reply(m.chat,`*< DESCARGAS - TIKTOK />*\n\n*☁️ Iɴɢʀᴇsᴇ Uɴ Eɴʟᴀᴄᴇ Dᴇ Vɪᴅᴇᴏ Dᴇ Tɪᴋᴛᴏᴋ.*\n\n*💌 Eᴊᴇᴍᴘʟᴏ:* _${usedPrefix+command} https://vm.tiktok.com/ZM6UHJYtE/_`.trim(),m,rcanal);
}

try{
await conn.reply(m.chat,`_💌 @${m.sender.split`@`[0]} ᩭ✎Enviando Video, espere un momento..._`,m,rcanal);

const tiktokData=await tiktokdl(args[0]);
const result=tiktokData?.data;

if(!result?.play){
return conn.reply(m.chat,`${emoji} ❌ 𝑼𝒑𝒔… 𝒏𝒐 𝒑𝒖𝒅𝒆 𝒐𝒃𝒕𝒆𝒏𝒆𝒓 𝒆𝒍 𝒗𝒊𝒅𝒆𝒐.`,m);
}

const caption=`_💌  ᩭ✎Tiktok sin marca de agua descargado con éxito_

「${result.title||'✧ 𝑺𝒊𝒏 𝒕𝒊𝒕𝒖𝒍𝒐 ✧'}」

❀ 𝘼𝙐𝙏𝙊𝙍: ${result.author?.nickname||'Desconocido'}
❀ 𝘿𝙐𝙍𝘼𝘾𝙄𝙊𝙉: ${result.duration||0}s
❀ 𝙑𝙄𝙎𝙏𝘼𝙎: ${result.play_count||0}
❀ 𝙇𝙄𝙆𝙀𝙎: ${result.digg_count||0}
❀ 𝘾𝙊𝙈𝙀𝙉𝙏𝘼𝙍𝙄𝙊𝙎: ${result.comment_count||0}
❀ 𝘾𝙊𝙈𝙋𝘼𝙍𝙏𝙄𝘿𝙊𝙎: ${result.share_count||0}
❀ 𝙁𝙀𝘾𝙃𝘼: ${formatDate(result.create_time)}
`.trim();

await conn.sendFile(m.chat,result.play,'tiktok.mp4',caption,m);
await m.react("🌸");

}catch(e){
console.error(e);
return conn.reply(m.chat,`❌ 𝑬𝒓𝒓𝒐𝒓 𝒂𝒍 𝒅𝒆𝒔𝒄𝒂𝒓𝒈𝒂𝒓:\n${e.message}`,m);
}
};

handler.help=['tiktok','tt'].map(v=>v+' *<link>*');
handler.tags=['descargas'];
handler.command=['tiktok','tt','tiktokdl','ttdl'];
handler.group=true;
handler.register=true;

export default handler;

async function tiktokdl(url){
const api=`https://www.tikwm.com/api/?url=${url}&hd=1`;
const res=await fetch(api);
return await res.json();
}

function formatDate(timestamp){
const date=new Date(timestamp*1000);
return date.toLocaleString('es-ES',{timeZone:'America/Mexico_City'});
}