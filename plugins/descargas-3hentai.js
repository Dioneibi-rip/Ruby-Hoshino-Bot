import { build3HentaiPdf, get3HentaiGallery, search3Hentai } from '../lib/hentaimanga.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!db.data.chats[m.chat].nsfw && m.isGroup) {
    return m.reply(`🛑 *¡Alto ahí!*\nEl contenido *NSFW* está desactivado en este grupo.\n> 🍓 *Nota:* Un administrador puede activarlo usando » \`#nsfw on\``)
  }

  if (!text) {
    return conn.reply(m.chat, `🌸 *¿Cómo buscar?*\n\n╭─⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂\n│ 🍓 *Por nombre:*\n│ ↳ ${usedPrefix + command} buscar school days\n│\n│ 🍓 *Por ID o Link:*\n│ ↳ ${usedPrefix + command} 123456\n│ ↳ ${usedPrefix + command} https://es.3hentai.net/d/123456\n╰─⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂⢂`, m)
  }

  try {
    // ────────── 🔍 BÚSQUEDA ──────────
    if (/^buscar\s+/i.test(text)) {
      const query = text.replace(/^buscar\s+/i, '').trim()
      if (!query) return conn.reply(m.chat, '❌ *Escribe algo para buscar.*', m)

      const results = await search3Hentai(query)
      if (!results.length) return conn.reply(m.chat, '🥀 *No encontré resultados en 3hentai para tu búsqueda.*', m)

      let cap = '╭─「 🔞 *3HENTAI SEARCH* 」─✧\n│\n'
      results.forEach((item, idx) => {
        cap += `├ 🎀 *${idx + 1}.* ${item.title}\n`
        cap += `│ 🆔 *ID:* ${item.id}\n`
        cap += `│ 🔗 *Link:* ${item.link}\n`
        cap += `│\n`
      })
      cap += `╰─➤ 🍓 *Usa:* ${usedPrefix + command} <id|link> para descargar.`

      const thumb = results.find((x) => x.thumb)?.thumb
      if (thumb) await conn.sendFile(m.chat, thumb, 'thumb.jpg', cap, m)
      else await conn.reply(m.chat, cap, m)
      return
    }

    // ────────── 📥 DESCARGA ──────────
    await m.react('⏳')
    const gallery = await get3HentaiGallery(text)
    const { pdfBuffer, fileName } = await build3HentaiPdf(gallery, 80)

    // Se envía el documento limpio, sin caption (texto vacío), solo el archivo.
    await conn.sendFile(m.chat, pdfBuffer, fileName, '', m, false, {
      asDocument: true,
      mimetype: 'application/pdf'
    })

    // Reacción de éxito al finalizar
    await m.react('✅')

  } catch (e) {
    console.error('Error 3hentai:', e)
    await m.react('❌')
    await conn.reply(m.chat, `🥀 *Ocurrió un error al procesar tu solicitud.*\n\n> 💡 *Detalle:* ${e.message}`, m)
  }
}

handler.help = ['3hentai buscar <texto>', '3hentai <id|url>']
handler.tags = ['download', 'nsfw']
handler.command = ['3hentai', 'h3dl', 'hentaimanga', 'hentai']
handler.premium = true

export default handler
