import{build3HentaiPdf,get3HentaiGallery,search3Hentai}from'../lib/hentaimanga.js'
import sharp from'sharp'
let handler=async(m,{conn,text,usedPrefix,command})=>{
if(!db.data.chats[m.chat].nsfw&&m.isGroup){
return m.reply(`⸺      \`ㅤ  A V I S Oㅤ\`\n\`ㅤ ݰ   \`\n          𝗁 𝗲𝘆 ㅤܐㅤׄㅤ𝗬 𝗈𝗎!      *;* ⎖  𓌛ㅤㅤㅤ\n⎯⎯̸⎯⎯꯭⎯꯭⎯꯭⎯꯭⎯꯭⎯⎯̸⎯⎯\n\n> ㅤㅤㅤ𝖤𝗅 𝖼𝗈𝗇𝗍𝖾𝗇𝗂𝖽𝗈 𝖭𝖲𝖥𝖶 𝖾𝗌𝗍𝖺 𝖽𝖾𝗌𝖺𝖼𝗍𝗂𝗏𝖺𝖽𝗈  .\n\n\`ㅤㅤㅤܐ⸺𝘗𝘪𝘥𝘦 𝘢 𝘶𝘯 𝘢𝘥𝘮𝘪𝘯 𝘲𝘶𝘦 𝘭𝘰 𝘢𝘤𝘵𝘪𝘷𝘦\` ㅤׅ     ㅤׄ`)
}
if(!text){
return conn.reply(m.chat,`          ꒰͡ ͜⠸͜͡ ⠸͜͡꒱ㅤֺ  𓉣˒ㅤ꒰͡ ͜⠸͜͡ ⠸͜͡꒱\n\n⏜❜   🌸⃞ 𝗢𝗙𝗥𝗘𝗖𝗘𝗠𝗢𝗦 \n\n> ︵❜    ⩅🍡⩅   𝖡𝗎𝗌𝖼𝖺𝗋 𝗉𝗈𝗋 𝗇𝗈𝗆𝖻𝗋𝖾:\n> ︵❜    ⩅🍥⩅   ${usedPrefix+command} 𝖻𝗎𝗌𝖼𝖺𝗋 𝗌𝖼𝗁𝗈𝗈𝗅 𝖽𝖺𝗒𝗌\n> ︵❜    ⩅🌸⩅   𝖡𝗎𝗌𝖼𝖺𝗋 𝗉𝗈𝗋 𝖨𝖣/𝖫𝗂𝗇𝗄:\n> ︵❜    ⩅🍡⩅   ${usedPrefix+command} 123456\n> ︵❜    ⩅🍥⩅   ${usedPrefix+command} 𝗁𝗍𝗍𝗉𝗌://𝖾𝗌.3𝗁𝖾𝗇𝗍𝖺𝗂.𝗇𝖾𝗍/𝖽/123456\n\n          ꒰͡ ͜⠸͜͡ ⠸͜͡꒱ㅤֺ  𓉣˒ㅤ꒰͡ ͜⠸͜͡ ⠸͜͡꒱`,m)
}
try{
if(/^buscar\s+/i.test(text)){
const query=text.replace(/^buscar\s+/i,'').trim()
if(!query)return conn.reply(m.chat,'`ㅤܐ⸺𝘌𝘴𝘤𝘳𝘪𝘣𝘦 𝘢𝘭𝘨𝘰 𝘱𝘢𝘳𝘢 𝘣𝘶𝘴𝘤𝘢𝘳` ㅤׅ  ㅤׄ',m)
const results=await search3Hentai(query)
if(!results.length)return conn.reply(m.chat,'`ㅤܐ⸺𝘕𝘰 𝘴𝘦 𝘦𝘯𝘤𝘰𝘯𝘵𝘳𝘢𝘳𝘰𝘯 𝘳𝘦𝘴𝘶𝘭𝘵𝘢𝘥𝘰𝘴` ㅤׅ  ㅤׄ',m)
let cap='𞋪 ׅ ꩌ ۪  🔞 𝗦𝗲𝗮𝗿𝗰𝗵 𝗥𝗲𝘀𝘂𝗹𝘁𝘀  ᜔ ݁ 🍣ᩧ〪࣪𝆬  ֔  ࣭  \n\n─  𝕰𝗇𝖼𝗈𝗇𝗍𝗋𝖺𝗆𝗈𝗌 𝗅𝗈𝗌 𝗌𝗂𝗀𝗎𝗂𝖾𝗇𝗍𝖾𝗌 𝗋𝖾𝗌𝗎𝗅𝗍𝖺𝖽𝗈𝗌:\n\n'
results.forEach((item,idx)=>{
cap+=`─『🍡』 *${idx+1}.* 🔗 ${item.link}\n`
cap+=`─『🆔』 ${item.id}\n\n`
})
cap+='╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼╾╼\n\n'
cap+=`> ¡𝕮𝗅𝖺𝗋𝗈 𝗊𝗎𝖾 𝗌𝗂! 𝖴𝗌𝖺: ${usedPrefix+command} <𝗂𝖽|𝗅𝗂𝗇𝗄> 𝗉𝖺𝗋𝖺 𝖽𝖾𝗌𝖼𝖺𝗋𝗀𝖺𝗋`
await conn.reply(m.chat,cap,m)
return
}
await m.react('⏳')
const gallery=await get3HentaiGallery(text)
const{pdfBuffer,fileName,downloaded,coverBuffer}=await build3HentaiPdf(gallery,80)
let jpegThumbnail
try{
jpegThumbnail=await sharp(coverBuffer).resize(250,250,{fit:'cover',position:'center'}).jpeg({quality:80}).toBuffer()
}catch(thumbError){
jpegThumbnail=coverBuffer
}
await conn.sendMessage(m.chat,{document:pdfBuffer,mimetype:'application/pdf',fileName:fileName,pageCount:downloaded,jpegThumbnail:jpegThumbnail},{quoted:m})
await m.react('✅')
}catch(e){
await m.react('❌')
await conn.reply(m.chat,`⸺      \`ㅤ  E R R O Rㅤ\`\n\`ㅤ ݰ   \`\n          𝗁 𝗲𝘆 ㅤܐㅤׄㅤ𝗬 𝗈𝗎!      *;* ⎖  𓌛ㅤㅤㅤ\n⎯⎯̸⎯⎯꯭⎯꯭⎯꯭⎯꯭⎯꯭⎯⎯̸⎯⎯\n\n> ㅤㅤㅤ𝖮𝖼𝗎𝗋𝗋𝗂𝗈 𝗎𝗇 𝖾𝗋𝗋𝗈𝗋 𝗂𝗇𝖾𝗌𝗉𝖾𝗋𝖺𝖽𝗈  .\n\n\`ㅤㅤㅤܐ⸺${e.message}\` ㅤׅ     ㅤׄ`,m)
}
}
handler.help=['3hentai buscar <texto>','3hentai <id|url>']
handler.tags=['download','nsfw']
handler.command=['3hentai','h3dl','hentaimanga','hentai']
handler.premium=true
export default handler
