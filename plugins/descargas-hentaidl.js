import { searchHentai, getHentaiDetail } from '../lib/hentai.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!db.data.chats[m.chat].nsfw && m.isGroup) {
    return m.reply(`${emoji} El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#nsfw on*`)
  }

  if (!text) {
    return m.reply(`🔞 *Uso de HentaiDL*\n\n• ${usedPrefix + command} overflow\n• ${usedPrefix + command} https://hentai.tv/video/...`)
  }

  try {
    if (/https?:\/\//i.test(text)) {
      const info = await getHentaiDetail(text)
      if (!info.streams.length) return m.reply('❌ No se encontró información del video. Prueba con otro link del mismo título o vuelve a buscar con *hentaidl nombre* para obtener un enlace válido.')

      const selected = info.streams.find((s) => /mp4/i.test(s.type) || /\.mp4/i.test(s.src)) || info.streams[0]
      const caption = [
        '╭─「 🔞 *HENTAI DL* 」',
        `├ 🏷️ *Título:* ${info.title || 'Sin título'}`,
        `├ 🎞️ *Calidad:* ${selected.label}`,
        `├ 📦 *Formato:* ${selected.type || 'video/mp4'}`,
        '╰─➤ Enviando archivo...'
      ].join('\n')

      if (info.thumbnail) {
        await conn.sendFile(m.chat, info.thumbnail, 'thumb.jpg', caption, m)
      } else {
        await m.reply(caption)
      }

      await conn.sendFile(m.chat, selected.src, `${info.title || 'hentai'}.${selected.type?.includes('mpegURL') ? 'm3u8' : 'mp4'}`, '', m, false, { asDocument: true, mimetype: selected.type?.includes('mpegURL') ? 'application/x-mpegURL' : 'video/mp4' })
      return
    }

    const results = await searchHentai(text)
    if (!results.length) return m.reply('❌ No se encontraron resultados.')

    let out = '╭─「 🔎 *HENTAI SEARCH* 」\n'
    results.slice(0, 15).forEach((r, i) => {
      out += `├ ${i + 1}. *${r.title}*\n`
      out += `│ 👀 ${r.views || 'Sin dato'}\n`
      out += `│ 🔗 ${r.link}\n`
    })
    out += '╰─➤ Copia un link y úsalo con el comando para descargar.'

    await conn.sendMessage(m.chat, { text: out }, { quoted: m })
  } catch (e) {
    console.error('Error en hentaidl:', e)
    m.reply('⚠️ Error al procesar HentaiDL: ' + e.message)
  }
}

handler.help = ['hentaidl']
handler.tags = ['download', 'nsfw']
handler.command = ['hentaidl', 'hdownload']
handler.premium = true
handler.register = true

export default handler
