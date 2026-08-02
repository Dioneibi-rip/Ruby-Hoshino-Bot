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
        const metadata = await conn.groupMetadata(id).catch(() => null)
        
        // Obtener la lista completa de miembros actuales para validar
        const miembrosActuales = (metadata?.participants || []).map((item) => item?.id)

        // Buscar el registro de presencias en la memoria del bot
        const presencias = (conn.presences && conn.presences[id]) || (conn.chats && conn.chats[id]?.presences) || {}

        // Filtrar solo los usuarios activos que aún son miembros del grupo
        const usuariosEnLinea = Object.keys(presencias).filter(jid => {
            const estado = presencias[jid]?.lastKnownPresence
            return (estado === 'available' || estado === 'composing') && miembrosActuales.includes(jid)
        })

        const listaEnLinea = usuariosEnLinea.length
            ? usuariosEnLinea.map((jid) => `✧ @${jid.split('@')[0]}`).join('\n')
            : '*✧ No hay participantes visibles en línea en este momento :c.*'

        const mensaje = `*♡ Lista de usuarios en línea:*\n\n${listaEnLinea}\n\n> Ruby Hoshino Bot`
        const thumbnail = await fetchThumbnailBuffer(RUBY_ONLINE_THUMBNAIL_URL)

        await conn.sendMessage(m.chat, {
            text: mensaje,
            mentions: usuariosEnLinea,
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

handler.needsParticipants = true

export default handler
