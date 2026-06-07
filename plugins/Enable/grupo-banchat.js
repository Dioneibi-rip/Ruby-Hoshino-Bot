let handler = async (m, {isROwner}) => {
if (!isROwner) throw 'Este comando solo puede ser utilizado por el creador.'
const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})
chat.isBanned = true
await m.react('🔕')
}
handler.help = ['banchat']
handler.tags = ['owner']
handler.command = ['banchat']
handler.owner = true
export default handler
