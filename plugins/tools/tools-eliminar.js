let handler = async (m) => {
return m.reply('⚠️ El historial reciente en memoria fue desactivado para ahorrar RAM. Usa la función nativa de responder y eliminar un mensaje específico desde WhatsApp.')
}
handler.help = ['borrarmsg']
handler.tags = ['tools']
handler.command = ['borrarmsg', 'delmsg', 'eliminarmsg']
handler.group = true
handler.admin = true
handler.botAdmin = true
export default handler
