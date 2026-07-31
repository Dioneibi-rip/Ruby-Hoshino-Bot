import { stopSubbotByOwner } from '../../core/subbot-engine.js'
let handler = async (m, { conn }) => conn.reply(m.chat, await stopSubbotByOwner(m.sender) ? '⏸️ Tu Sub-Bot quedó pausado.' : '🥀 No encontré un Sub-Bot activo asociado a ti.', m)
handler.help = ['stop']
handler.tags = ['jadibot']
handler.command = ['stop', 'pausarai', 'pausarbot']
export default handler
