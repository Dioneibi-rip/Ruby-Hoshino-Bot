import { destroySubbotByOwner } from '../../core/subbot-engine.js'
let handler = async (m, { conn }) => conn.reply(m.chat, await destroySubbotByOwner(m.sender) ? '✅ Tu sesión de Sub-Bot fue eliminada.' : '🥀 No encontré una sesión de Sub-Bot asociada a ti.', m)
handler.help = ['deletesesion']
handler.tags = ['jadibot']
handler.command = ['deletesesion', 'deletebot', 'deletesession']
export default handler
