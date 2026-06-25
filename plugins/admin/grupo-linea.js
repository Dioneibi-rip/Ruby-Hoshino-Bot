const RUBY_ONLINE_THUMBNAIL_URL = 'https://i.postimg.cc/m2ccrBmq/ㅤcolumbinaㅤ-ㅤicon.jpg'
const RUBY_SOURCE_URL = 'https://github.com/Dioneibi-rip'

async function fetchThumbnailBuffer(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al descargar thumbnail`)
    }

    return Buffer.from(await response.arrayBuffer())
  } catch (error) {
    console.error('Error al descargar la imagen para externalAdReply:', error)
    return undefined
  }
}

let handler = async (m, { conn, args }) => {
  try {
    const id = args?.[0]?.match(/\d+-\d+@g\.us/)?.[0] || m.chat
    const messages = conn.chats[id]?.messages || {}
    const participantesUnicos = [
      ...new Set(
        Object.values(messages)
          .map((item) => item?.key?.participant)
          .filter(Boolean)
      )
    ]

    const listaEnLinea = participantesUnicos.length
      ? participantesUnicos.map((jid) => `@${jid.split('@')[0]}`).join('\n')
      : '*✧ No hay usuarios en línea en este momento :c.*'

    const mensaje = `*♡ Lista de usuarios en línea:*\n\n${listaEnLinea}\n\n> Ruby Hoshino Bot`
    const thumbnail = await fetchThumbnailBuffer(RUBY_ONLINE_THUMBNAIL_URL)

    await conn.sendMessage(m.chat, {
      text: mensaje,
      mentions: participantesUnicos,
      contextInfo: {
        externalAdReply: {
          title: '🌸 𝘙𝘶𝘣𝘺 𝘏𝘰𝘴𝘩𝘪𝘯𝘰 𝘉𝘰𝘵 ☆',
          body: '🪄 Welcome, to Ruby Hoshino.',
          mediaType: 1,
          previewType: 0,
          renderLargerThumbnail: false,
          sourceUrl: RUBY_SOURCE_URL,
          mediaUrl: RUBY_SOURCE_URL,
          ...(thumbnail ? { thumbnail, jpegThumbnail: thumbnail } : {})
        }
      }
    }, { quoted: m })

    await m.react('✅')
  } catch (error) {
    console.error(error)
    await m.reply('Hubo un error al enviar la lista de usuarios.')
  return false;
  }
}

handler.help = ['listonline']
handler.tags = ['grupo']
handler.command = ['listonline', 'online', 'linea', 'enlinea']
handler.group = true
handler.fail = null

export default handler
