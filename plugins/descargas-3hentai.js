import { build3HentaiPdf, get3HentaiGallery, search3Hentai } from '../lib/hentaimanga.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!db.data.chats[m.chat].nsfw && m.isGroup) {
    return m.reply(`${emoji} El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#nsfw on*`)
  }

  if (!text) {
    return conn.reply(m.chat, `🌱 Uso:\n• ${usedPrefix + command} buscar school days\n• ${usedPrefix + command} 123456\n• ${usedPrefix + command} https://es.3hentai.net/d/123456`, m)
  }

  try {
    if (/^buscar\s+/i.test(text)) {
      const query = text.replace(/^buscar\s+/i, '').trim()
      if (!query) return conn.reply(m.chat, '❌ Escribe algo para buscar.', m)

      const results = await search3Hentai(query)
      if (!results.length) return conn.reply(m.chat, '❌ No encontré resultados en 3hentai.', m)

      let cap = '╭─「 🔞 *3HENTAI - SEARCH* 」\n'
      results.forEach((item, idx) => {
        cap += `├ ${idx + 1}. *${item.title}*\n`
        cap += `│ 🆔 ${item.id}\n`
        cap += `│ 🔗 ${item.link}\n`
      })
      cap += `╰─➤ Usa ${usedPrefix + command} <id|link> para descargar en PDF.`

      const thumb = results.find((x) => x.thumb)?.thumb
      if (thumb) await conn.sendFile(m.chat, thumb, 'thumb.jpg', cap, m)
      else await conn.reply(m.chat, cap, m)
      return
    }

    await m.react('🕒')
    const gallery = await get3HentaiGallery(text)
    const { pdfBuffer, fileName, downloaded, selected } = await build3HentaiPdf(gallery, 80)

    const cap = `🔞 *3HENTAI PDF*\n` +
      `• *Título:* ${gallery.title}\n` +
      `• *ID:* ${gallery.id}\n` +
      `• *Páginas incluidas:* ${downloaded}/${selected}\n` +
      `• *Fuente:* ${gallery.url}`

    await conn.sendFile(m.chat, pdfBuffer, fileName, cap, m, false, {
      asDocument: true,
      mimetype: 'application/pdf'
    })

    await m.react('✅')
  } catch (e) {
    console.error('Error 3hentai:', e)
    await conn.reply(m.chat, `❌ Error con 3hentai.\n\n${e.message}`, m)
  }
}

handler.help = ['3hentai buscar <texto>', '3hentai <id|url>']
handler.tags = ['download', 'nsfw']
handler.command = ['3hentai', 'h3dl', 'hentaimanga', 'hentai']
handler.premium = true

export default handler
