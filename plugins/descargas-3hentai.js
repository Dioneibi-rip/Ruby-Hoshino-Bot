import { build3HentaiPdf, get3HentaiGallery, search3Hentai } from '../lib/hentaimanga.js'
import { extractImageThumb } from '@whiskeysockets/baileys'
import fetch from 'node-fetch' // 🌸 Necesario para el proxy de la miniatura

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
    const { pdfBuffer, fileName, downloaded } = await build3HentaiPdf(gallery, 80)

    // 🖼️ TRUCO PARA LA MINIATURA (Igual al de nhentai) 🖼️
    let jpegThumbnail = ''
    try {
      // Pasamos la primera imagen por DuckDuckGo para purificar su formato
      const proxyUrl = `https://external-content.duckduckgo.com/iu/?u=${encodeURIComponent(gallery.images[0])}`
      const reqThumb = await fetch(proxyUrl)
      const thumbBuf = Buffer.from(await reqThumb.arrayBuffer())

      // Ahora sí, extractImageThumb no lanzará "Invalid input"
      const extractedThumb = await extractImageThumb(thumbBuf)
      
      // WhatsApp suele requerir que la miniatura de los documentos sea en Base64
      jpegThumbnail = extractedThumb.toString('base64')
    } catch (thumbError) {
      console.log('⚠️ Error al generar miniatura:', thumbError.message)
    }

    // 🌸 Armamos las opciones de envío
    let msgOptions = {
      document: pdfBuffer,
      mimetype: 'application/pdf',
      fileName: fileName,
      pageCount: downloaded // 📄 Indicador visual de páginas
    }

    // Si se logró crear la portada, la inyectamos al mensaje
    if (jpegThumbnail) {
      msgOptions.jpegThumbnail = jpegThumbnail
    }

    // Enviamos usando las propiedades nativas
    await conn.sendMessage(m.chat, msgOptions, { quoted: m })

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
