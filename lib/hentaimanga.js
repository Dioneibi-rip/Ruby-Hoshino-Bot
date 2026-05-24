import { build3HentaiPdf, get3HentaiGallery, search3Hentai } from '../lib/hentaimanga.js'
import sharp from 'sharp' 

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
    
    // Extraemos el PDF y la primera imagen cruda (coverBuffer)
    const { pdfBuffer, fileName, downloaded, coverBuffer } = await build3HentaiPdf(gallery, 80)

    // 🖼️ LA MAGIA DE SHARP PARA LA MINIATURA 🖼️
    let jpegThumbnail
    try {
      // Usamos el código de tu amigo para forzar el formato y tamaño perfecto
      jpegThumbnail = await sharp(coverBuffer)
        .resize(250, 250, {
          fit: 'cover', 
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer()
    } catch (thumbError) {
      console.log('⚠️ Error al procesar imagen con sharp:', thumbError.message)
      jpegThumbnail = coverBuffer // Plan B por si acaso
    }

    // 🌸 Enviamos el documento usando propiedades nativas
    await conn.sendMessage(m.chat, {
      document: pdfBuffer,
      mimetype: 'application/pdf',
      fileName: fileName,
      pageCount: downloaded,       // 📄 Muestra la cantidad de páginas
      jpegThumbnail: jpegThumbnail // 🖼️ La portada perfecta en Buffer
    }, { quoted: m })

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
