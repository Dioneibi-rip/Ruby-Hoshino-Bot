import { searchHentai, getHentaiDetail, getFileSize } from '../lib/hentai.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!db.data.chats[m.chat].nsfw && m.isGroup) {
    return m.reply(`${emoji} El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#nsfw on*`)
  }

  if (!text) {
    return conn.reply(m.chat, `🌱 Ejemplo de uso:\n• ${usedPrefix + command} Boku ni Harem Sexfriend\n• ${usedPrefix + command} https://veohentai.com/ver/...`, m)
  }

  try {
    m.react('🕒')

    if (text.includes('veohentai.com/ver/')) {
      const info = await getHentaiDetail(text)
      if (!info?.videoUrl) {
        const fallbackTitle = info?.title || decodeURIComponent(text.split('/ver/')[1]?.replace(/\/+$/, '')?.replace(/-/g, ' ') || 'Sin título')
        return conn.reply(m.chat, `❌ No pude extraer el enlace MP4 en este intento.\n\n• *Título:* ${fallbackTitle}\n• *Link:* ${text}\n\nIntenta de nuevo en unos segundos (los links con verify expiran rápido).`, m)
      }

      const peso = await getFileSize(info.videoUrl)
      const cap = `╭─「 🔞 *HENTAI - DOWNLOAD* 」
├ 🌴 *Title:* ${info.title || 'Sin título'}
├ 🌿 *Views:* ${info.views || 'N/A'}
├ 🌾 *Likes:* ${info.likes || 'N/A'}
├ 🌲 *Peso:* ${peso}
├ 🍄 *Dislikes:* ${info.dislikes || 'N/A'}
╰ 🔗 *Link:* ${text}`

      if (info.thumbnail) {
        await conn.sendFile(m.chat, info.thumbnail, 'thumb.jpg', cap, m)
      } else {
        await m.reply(cap)
      }

      await conn.sendFile(m.chat, info.videoUrl, `${(info.title || 'video').replace(/[\\/:*?"<>|]/g, '_')}.mp4`, '', m, false, {
        asDocument: true,
        mimetype: 'video/mp4'
      })
      m.react('✅')
      return
    }

    const results = await searchHentai(text)
    if (!results.length) return conn.reply(m.chat, '❌ No se encontraron resultados.', m)

    let cap = '╭─「 🔞 *HENTAI - SEARCH* 」\n'
    results.slice(0, 15).forEach((res, index) => {
      cap += `├ ${index + 1}. *${res.title}*\n`
      cap += `│ 🔗 ${res.link}\n`
    })
    cap += '╰─➤ Usa uno de los links para descargar.'
    await m.reply(cap)
    m.react('🔞')
  } catch (err) {
    console.error('Error en hentaidl:', err)
    return conn.reply(m.chat, '⚠️ Error en la ejecución.\n\n' + err.message, m)
  }
}

handler.help = ['hentaidl', 'hent']
handler.command = ['hentaidl', 'hdownload', 'hentai', 'hent']
handler.tags = ['download', 'nsfw']
handler.premium = true

export default handler
