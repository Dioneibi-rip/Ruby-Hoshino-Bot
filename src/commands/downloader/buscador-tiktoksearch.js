import axios from '../../library/http.js'
let handler=async(m,{conn,text})=>{
if(!text)return conn.reply(m.chat,' *°ʚ🎀ɞ° ¿Qᥙᥱ́ ძᥱsᥱᥲs ᑲᥙsᥴᥲr ᥱᥒ TіkT᥆k? Iᥒgrᥱsᥲ ᥙᥒ 𝗍ᥱx𝗍᥆ ȷᥙᥒ𝗍᥆ ᥲᥣ ᥴ᥆mᥲᥒძ᥆.* (✿◠‿◠)',m)
const fancy=value=>String(value).split('').map(character=>({a:'ᥲ',b:'ᑲ',c:'ᥴ',d:'ᑯ',e:'ᥱ',f:'𝖿',g:'g',h:'һ',i:'і',j:'j',k:'k',l:'ᥣ',m:'m',n:'ᥒ',o:'᥆',p:'⍴',q:'q',r:'r',s:'s',t:'𝗍',u:'ᥙ',v:'᥎',w:'ɯ',x:'x',y:'ᥡ',z:'z'}[character.toLowerCase()]||character)).join('')
try{
await m.react('🕒')
const{data:response}=await axios.post('https://www.tikwm.com/api/feed/search',new URLSearchParams({keywords:text,count:'10',cursor:'0',HD:'1'}),{timeout:15000,headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:'current_language=en','User-Agent':'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'}})
const results=(response?.data?.videos||[]).filter(video=>video.play).map(video=>({title:video.title||'Vі́ძᥱ᥆ TіkT᥆k',author:video.author?.nickname||'Dᥱsᥴ᥆ᥒ᥆ᥴіძ᥆',play:video.play,url:`https://www.tiktok.com/@${video.author?.unique_id||'tiktok'}/video/${video.video_id}`})).sort(()=>Math.random()-.5).slice(0,5)
if(!results.length)return conn.reply(m.chat,'❌ *N᥆ sᥱ ᥱᥒᥴ᥆ᥒ𝗍rᥲr᥆ᥒ rᥱsᥙᥣ𝗍ᥲძ᥆s.* ૮(>﹏<)ა',m)
await conn.sendCustomCarousel(m.chat,{title:'🔎 TіkT᥆k Sᥱᥲrᥴһ',text:`✦ Rᥱsᥙᥣ𝗍ᥲძ᥆s ძᥱ: ${text} ✨\n\n_Dᥱsᥣіzᥲ ρᥲrᥲ ᥎ᥱr mᥲ́s ᥎і́ძᥱ᥆s 👉_`,footer:'🔎 TіkT᥆k Sᥱᥲrᥴһ',cards:results.map(result=>({video:{url:result.play},title:'',body:fancy(result.title.length>70?`${result.title.slice(0,70)}...`:result.title),footer:`👤 Aᥙ𝗍᥆r: ${result.author}`,buttons:[{name:'cta_url',buttonParamsJson:JSON.stringify({display_text:'🔗 Vᥱr ᥱᥒ TіkT᥆k',url:result.url,merchant_url:result.url})},{name:'cta_copy',buttonParamsJson:JSON.stringify({display_text:'📋 C᥆ρіᥲr Eᥒᥣᥲᥴᥱ',copy_code:result.url})}]}))},{quoted:m})
await m.react('✅')
}catch(error){console.error(error);await m.react('❌')}
}
handler.help=['tiktoksearch <texto>']
handler.tags=['buscador']
handler.command=['tiktoksearch','ttss','tiktoks']
handler.group=true
handler.register=true
export default handler
