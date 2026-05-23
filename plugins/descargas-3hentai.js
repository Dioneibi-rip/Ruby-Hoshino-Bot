import { get3HentaiGallery } from '../lib/hentaimanga.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!db.data.chats[m.chat].nsfw && m.isGroup) {
    return m.reply(`${emoji} El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#nsfw on*`)
  }

  if (!text) {
    return conn.reply(m.chat, `🌱 Uso:\n• ${usedPrefix + command} 123456\n• ${usedPrefix + command} https://es.3hentai.net/d/123456`, m)
  }

  try {
    await m.react('🕒')
    const gallery = await get3HentaiGallery(text)

    const maxImages = 25
    const selected = gallery.images.slice(0, maxImages)

    await conn.reply(
      m.chat,
      `🔞 *3Hentai descargador*\n` +
        `• *Título:* ${gallery.title}\n` +
        `• *ID:* ${gallery.id}\n` +
        `• *Total imágenes:* ${gallery.images.length}\n` +
        `• *Enviando:* ${selected.length}${gallery.images.length > maxImages ? ` (límite ${maxImages})` : ''}`,
      m
    )

    for (let i = 0; i < selected.length; i++) {
      const img = selected[i]
      await conn.sendFile(m.chat, img, `page-${String(i + 1).padStart(3, '0')}.jpg`, `📄 Página ${i + 1}/${selected.length}`, m)
    }

    if (gallery.images.length > maxImages) {
      await conn.reply(m.chat, `⚠️ Solo envié ${maxImages} páginas para evitar saturar el chat.`, m)
    }

    await m.react('✅')
  } catch (e) {
    console.error('Error 3hentai:', e)
    await conn.reply(m.chat, `❌ Error al descargar desde 3hentai.\n\n${e.message}`, m)
  }
}

handler.help = ['3hentai <id|url>']
handler.tags = ['download', 'nsfw']
handler.command = ['3hentai', 'h3dl', 'hentaimanga']
handler.premium = true

export default handler
