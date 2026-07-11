import fetch from 'node-fetch'
const handler=async(m,{conn,text,usedPrefix,command})=>{
if(!text)return conn.reply(m.chat,`🚩 *${toFancy("Ingrese el nombre de un repositorio")}*\n\n📌 ${toFancy("Ejemplo")}: ${usedPrefix+command} Ruby Hoshino Bot`,m,rcanal)
const toFancy=(str)=>{const map={'a':'ᥲ','b':'ᑲ','c':'ᥴ','d':'ᑯ','e':'ᥱ','f':'𝖿','g':'g','h':'һ','i':'і','j':'j','k':'k','l':'ᥣ','m':'m','n':'ᥒ','o':'᥆','p':'⍴','q':'q','r':'r','s':'s','t':'𝗍','u':'ᥙ','v':'᥎','w':'ɯ','x':'x','y':'ᥡ','z':'z','A':'A','B':'B','C':'C','D':'D','E':'E','F':'F','G':'G','H':'H','I':'I','J':'J','K':'K','L':'L','M':'M','N':'N','O':'O','P':'P','Q':'Q','R':'R','S':'S','T':'T','U':'U','V':'V','W':'W','X':'X','Y':'Y','Z':'Z'};return str.split('').map(c=>map[c]||c).join('')}
const formatDate=(n,locale='es')=>{const d=new Date(n);return d.toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
try{
await m.react(rwait)
const res=await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(text)}`)
const json=await res.json()
if(!json.items||json.items.length===0)throw 'No results'
const results=json.items.slice(0,5)
let str=results.map((repo,index)=>{return `
┌͡╼᮫͜  ⟆ 🍟  ${toFancy("Resultado")} ${1+index} ㅤ
┆᮫⌣⃕╼̟ᜒ 👑 ${toFancy("Creador")}: ${repo.owner.login}
┆⌣⃕╼̟ᜒ 📦 ${toFancy("Nombre")}: ${repo.name}
┆⌣⃕╼̟ᜒ 📅 ${toFancy("Creado")}: ${formatDate(repo.created_at)}
┆⌣⃕╼̟ᜒ 💥 ${toFancy("Actualizado")}: ${formatDate(repo.updated_at)}
┆⌣⃕╼̟ᜒ 👀 ${toFancy("Visitas")}: ${repo.watchers}
┆⌣⃕╼̟ᜒ 🌟 ${toFancy("Estrellas")}: ${repo.stargazers_count}
┆⌣⃕╼̟ᜒ 🍂 ${toFancy("Bifurcado")}: ${repo.forks}
┆⌣⃕╼̟ᜒ 📝 ${toFancy("Descripción")}: ${repo.description?repo.description:'Sin Descripción'}
┆⌣⃕╼̟ᜒ 🔗 ${toFancy("Enlace")}: ${repo.html_url}
┆⌣⃕╼̟ᜒ 📥 ${toFancy("Clone")}: ${repo.clone_url}
└͡╼᮫͜ ⌢᜔֔⌣ׄ𝅄⌢ֵ݊⌣֘ ܁ ⌢᜔֔⌣ׄ𝅄⌢ֵ݊⌣֘܁⌢̼ׄ
`.trim()}).join('\n\n')
let img=await(await fetch(json.items[0].owner.avatar_url)).buffer()
let txtHeader=`✿ ㅤ ׄㅤ 🪷̸ㅤ ˒˓ㅤ 𓏸̶ ㅤ ׄ   ✿\n         \`\`\`G I T H U B   S E A R C H\`\`\`\n\n${str}\n\n 𖥻    ·  ˖ ࣪  𓈃    ${toFancy("Búsqueda Finalizada")}    ‧₊˚ ㅤ ☆`
await conn.sendMessage(m.chat,{text:txtHeader,contextInfo:{}},{quoted:m})
await m.react(done)
}catch(e){
await m.react(error)
conn.reply(m.chat,`🚩 *${toFancy("No se encontraron resultados para")}:* ${text}`,m,fake)
return false
}
}
handler.help=['githubsearch']
handler.tags=['buscador']
handler.command=['githubsearch']
handler.register=true
export default handler
