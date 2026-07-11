import jadibotServiceHandler from '../../services/jadibots/jadibot-serbot.js'

const handler = async (m, context) => jadibotServiceHandler(m, context)

handler.help = ['qr', 'code']
handler.tags = ['serbot']
handler.command = ['qr', 'code']

export default handler
