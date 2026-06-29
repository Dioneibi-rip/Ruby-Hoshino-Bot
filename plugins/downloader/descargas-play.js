import { enqueueMediaJob } from '../../lib/queue.js'

const handler = async (m, { conn, text, command }) => {
if (!text || !text.trim()) {
return conn.reply(m.chat, '✧ 𝙃𝙚𝙮! Debes escribir *el nombre o link* del video/audio para descargar.', m)
}
const mode = ['play', 'yta', 'ytmp3', 'playaudio'].includes(command) ? 'audio' : 'video'
await enqueueMediaJob('youtube', { chat: m.chat, text: text.trim(), mode, sender: m.sender })
}

handler.command = ['play', 'yta', 'ytmp3', 'play2', 'ytv', 'ytmp4', 'playaudio', 'mp4']
handler.help = ['play', 'yta', 'ytmp3', 'play2', 'ytv', 'ytmp4', 'playaudio', 'mp4']
handler.tags = ['descargas']

export default handler
