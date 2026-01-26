import{WAMessageStubType}from'@whiskeysockets/baileys'
import PhoneNumber from'awesome-phonenumber'
import chalk from'chalk'
import{watchFile}from'fs'

const terminalImage=global.opts['img']?require('terminal-image'):''
const urlRegex=(await import('url-regex-safe')).default({strict:false})

export default async function(m,conn={user:{}}){
if(m.key.remoteJid==='status@broadcast')return
let _name=await conn.getName(m.sender)
let sender=PhoneNumber('+'+m.sender.replace('@s.whatsapp.net','')).getNumber('international')+(_name?' ~'+chalk.green.bold(_name):'')
let chat=await conn.getName(m.chat)
let img
try{
if(global.opts['img']){
img=/sticker|image/gi.test(m.mtype)?await terminalImage.buffer(await m.download()):false
}
}catch(e){}
let filesize=0
try{
filesize=(m.msg?(m.msg.vcard?m.msg.vcard.length:m.msg.fileLength?(m.msg.fileLength.low||m.msg.fileLength):m.text?m.text.length:0):m.text?m.text.length:0)||0
}catch(e){filesize=0}
let user=global.db.data.users[m.sender]
let me=PhoneNumber('+'+(conn.user?.jid).replace('@s.whatsapp.net','')).getNumber('international')
let oraAttuale=new Date()
let oraFormattata=oraAttuale.toLocaleString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
let chatName=chat?(m.isGroup?chalk.red.bold('Grupo: ')+chat:chalk.green.bold('Privado: ')+chat):chalk.gray('Chat Desconocido')
let messageType=m.mtype?m.mtype.replace(/message$/i,'').replace('audio',m.msg.ptt?'PTT':'audio').replace(/^./,v=>v.toUpperCase()):'Sistema'
if(m.messageStubType)messageType='Notif. Grupo'
let userInfo=user?` | ${user.exp} EXP | ${user.limit||'?'} L | NvL ${user.level}`:' | Usuario Nuevo'
console.log(chalk.green.dim('~'.repeat(20))+chalk.red.bold(' R U B Y  H O S H I N O ')+chalk.green.dim('~'.repeat(20)))
console.log(`${chalk.red('╭')}${chalk.green('─')}${chalk.white('⋯')}${chalk.green('─[ ')+chalk.red.bold('BOT INFO')+chalk.green(' ]')}${chalk.green.dim('─'.repeat(38))}
${chalk.red('│')} 🌈 ${chalk.red.bold('Bot:')} ${chalk.white(me+' ~'+conn.user.name)}
${chalk.red('│')} 🔔 ${chalk.white.bold('Hora:')} ${chalk.yellow(oraFormattata)}
${chalk.red('│')} 🏷️ ${chalk.white.bold('Tipo:')} ${chalk.green(messageType)}
${chalk.red('│')} 🍭 ${chalk.white.bold('Peso:')} ${chalk.yellow(filesize===0?'0 B':(filesize/1009**Math.floor(Math.log(filesize)/Math.log(1000))).toFixed(1)+' '+(['',...'KMGTP'][Math.floor(Math.log(filesize)/Math.log(1000))]||'')+'B')}
${chalk.red('├')}${chalk.green('─')}${chalk.white('⋯')}${chalk.green('─[ ')+chalk.green.bold('USER INFO')+chalk.green(' ]')}${chalk.green.dim('─'.repeat(37))}
${chalk.red('│')} 🌺 ${chalk.green.bold('De:')} ${chalk.white(sender)}
${chalk.red('│')} 🌟 ${chalk.white.bold('Info:')} ${chalk.yellow(m.exp+' Exp'+userInfo)}
${chalk.red('│')} 🏠 ${chalk.white.bold('Chat:')} ${chalk.white(chatName)}
${chalk.red('╰')}${chalk.green.dim('─'.repeat(56))}`.trim())
if(img)console.log(img.trimEnd())
if(typeof m.text==='string'&&m.text){
let log=m.text.replace(/\u200e+/g,'')
let mdRegex=/(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.||[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g
let mdFormat=(depth=4)=>(_,type,text,monospace)=>{
let types={_: 'italic','*':'bold','~':'strikethrough'}
text=text||monospace
let formatted=!types[type]||depth<1?text:type==='*'?chalk.green.bold(text.replace(mdRegex,mdFormat(depth-1))):type==='_'?chalk.red.italic(text.replace(mdRegex,mdFormat(depth-1))):chalk.white.dim(text.replace(mdRegex,mdFormat(depth-1)))
return formatted
}
if(log.length<4096){
log=log.replace(urlRegex,(url,i,text)=>{
let end=url.length+i
return i===0||end===text.length||(/^\s$/.test(text[end])&&/^\s$/.test(text[i-1]))?chalk.cyan.underline(url):url
})
}
log=log.replace(mdRegex,mdFormat(4))
if(m.mentionedJid){
for(let user of m.mentionedJid){
log=log.replace('@'+user.split`@`[0],chalk.cyan.bold('@'+await conn.getName(user)))
}
}
let prefix=m.error!=null?chalk.red.bold('❗️ ERROR: '):m.isCommand?chalk.yellow.bold('🔔 COMANDO: '):chalk.white('💬 MENSAJE: ')
console.log(prefix+(m.error!=null?chalk.red(log):m.isCommand?chalk.yellow(log):log))
}
if(/document/i.test(m.mtype))console.log(chalk.green(`📜 Documento: ${m.msg.fileName||m.msg.displayName||'Sin nombre'}`))
else if(/ContactsArray/i.test(m.mtype))console.log(chalk.cyan(`👨‍👩‍👧‍👦 Contactos Múltiples`))
else if(/contact/i.test(m.mtype))console.log(chalk.cyan(`👨 Contacto: ${m.msg.displayName||''}`))
else if(/audio/i.test(m.mtype)){
const duration=m.msg.seconds||0
console.log(`${m.msg.ptt?chalk.red.bold('🎤 (PTT) '):chalk.green.bold('🎵 (AUDIO) ')}${chalk.yellow(Math.floor(duration/60).toString().padStart(2,0))}${chalk.white(':')}${chalk.yellow((duration%60).toString().padStart(2,0))}`)
}
console.log()
}

let file=global.__filename(import.meta.url)
watchFile(file,()=>{console.log(chalk.yellow("🔔 Actualización en 'lib/print.js'"))})
