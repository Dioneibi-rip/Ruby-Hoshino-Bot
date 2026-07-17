let toM = a => '@' + a.split('@')[0]
function handler(m, { groupMetadata }) {
let ps = (groupMetadata?.participants || []).map(v => v.id).filter(Boolean)
if (ps.length < 2) return m.reply(`${emoji} Necesito al menos 2 participantes.`)
let a = ps.getRandom()
let b
do b = ps.getRandom()
while (b === a)
m.reply(`${emoji} Vamos a hacer algunas amistades.\n\n*Oye ${toM(a)} hablale al privado a ${toM(b)} para que jueguen y se haga una amistad 🙆*\n\n*Las mejores amistades empiezan con un juego 😉.*`, null, {
mentions: [a, b]
})}
handler.help = ['amistad']
handler.tags = ['fun']
handler.command = ['amigorandom','amistad']
handler.group = true
handler.register = true

export default handler
