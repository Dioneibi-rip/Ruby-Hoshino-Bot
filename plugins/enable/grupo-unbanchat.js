let handler = async (m, {isROwner}) => {
if (!isROwner) throw 'Este comando solo puede ser utilizado por el creador.'
const chat = global.db.getChat(m.chat)
chat.isBanned = false
await m.react('✅')
}
handler.help = ['unbanchat']
handler.tags = ['owner']
handler.command = ['unbanchat', 'desbanearchat']
handler.owner = true
export default handler
