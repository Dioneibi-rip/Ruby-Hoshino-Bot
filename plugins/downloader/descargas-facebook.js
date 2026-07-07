import fetch from 'node-fetch'
import cheerio from 'cheerio'

var handler = async (m, { conn, args, command, text }) => {
  const isCommand7 = /^(facebook|fb|facebookdl|fbdl)$/i.test(command)

  // Función para reportar errores (sin causar desconexión)
  async function reportError(e) {
    // Si rcanal no existe, se usa el chat actual
    const target = m.chat
    await conn.reply(target, `⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁: ${e.message || e}`, m, null)
    console.log(e)
  }

  // Obtener metadatos de la URL original (título, descripción)
  async function scrapeMetadata(pageUrl) {
    try {
      const resp = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      const html = await resp.text()
      const $ = cheerio.load(html)
      const getMeta = (name, attr = 'content') =>
        $(`meta[property="${name}"]`).attr(attr) ||
        $(`meta[name="${name}"]`).attr(attr) ||
        null
      return {
        title: getMeta('og:title') || getMeta('twitter:title'),
        description: getMeta('og:description') || getMeta('twitter:description'),
        siteName: "Facebook"
      }
    } catch (e) {
      return { title: null, description: null, siteName: "Facebook" }
    }
  }

  // ===== MÉTODO 1: SnapSave (recomendado) =====
  async function snapSave(url) {
    const res = await fetch('https://snapsave.app/action.php?lang=id&url=' + encodeURIComponent(url), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
      },
      timeout: 30000
    })
    if (!res.ok) throw new Error('SnapSave no respondió correctamente')
    const json = await res.json()
    if (json.error) throw new Error(json.message || 'Error de SnapSave')

    const videos = json.videos || json.data?.videos
    if (!videos || videos.length === 0) throw new Error('No se encontraron enlaces de video en SnapSave')

    // Preferencia HD > SD > primer enlace
    const hd = videos.find(v => v.quality === 'HD' || v.label === 'HD')
    const sd = videos.find(v => v.quality === 'SD' || v.label === 'SD')
    const chosen = hd || sd || videos[0]

    return {
      videoUrl: chosen.url,
      thumbnail: json.thumbnail || json.thumb || '',
      title: json.title || ''
    }
  }

  // ===== MÉTODO 2: fdown.net (fallback) =====
  async function fdownDownload(url) {
    const formData = `URLz=${encodeURIComponent(url)}`
    const res = await fetch('https://fdown.net/download.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
      },
      body: formData,
      timeout: 30000
    })
    if (!res.ok) throw new Error('fdown.net no respondió correctamente')
    const html = await res.text()
    const $ = cheerio.load(html)

    const title = $('h2').first().text().trim() || 'Facebook Video'
    const thumb = $('.thumbnail img').attr('src') || ''

    const downloadLinks = []
    $('table.table tbody tr').each((_, row) => {
      const quality = $(row).find('td').first().text().trim()
      const link = $(row).find('a').attr('href')
      if (link && link.startsWith('http')) {
        downloadLinks.push({ quality, url: link })
      }
    })

    if (downloadLinks.length === 0) throw new Error('No se encontraron enlaces en fdown')

    const hd = downloadLinks.find(l => l.quality.toLowerCase().includes('hd'))
    const sd = downloadLinks.find(l => l.quality.toLowerCase().includes('sd'))
    const chosen = hd || sd || downloadLinks[0]

    return {
      videoUrl: chosen.url,
      thumbnail: thumb,
      title: title
    }
  }

  // ===== LÓGICA PRINCIPAL =====
  if (isCommand7) {
    if (!text) return conn.reply(m.chat, `🚩 *Ingrese un enlace de Facebook*`, m, null)

    if (!args[0].match(/www\.facebook\.com|fb\.watch|web\.facebook\.com|business\.facebook\.com|video\.fb\.com/g))
      return conn.reply(m.chat, '🚩 *No es un enlace válido de Facebook*', m, null)

    conn.reply(m.chat, '🚀 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮𝗻𝗱𝗼 𝗘𝗹 𝗩𝗶𝗱𝗲𝗼 𝗗𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸, 𝗘𝘀𝗽𝗲𝗿𝗲 𝗨𝗻 𝗠𝗼𝗺𝗲𝗻𝘁𝗼....', m, {
      contextInfo: { forwardingScore: 2022, isForwarded: true }
    })

    m.react('⏳')  // Ajusta el emoji de espera si tu variable rwait no existe

    try {
      let videoData

      // Intentar con SnapSave primero
      try {
        videoData = await snapSave(args[0])
      } catch (snapError) {
        console.log('SnapSave falló, intentando con fdown.net...')
        // Fallback a fdown.net
        videoData = await fdownDownload(args[0])
      }

      // Obtener metadatos adicionales de la página original
      const meta = await scrapeMetadata(args[0])

      let caption = `꒰꒰͡  *𝗩𝗶𝗱𝗲𝗼 𝗱𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 ⁖❤️꙰* !! ര\n
┉ ᩿💭 ᩠〪ᷭׄ : *𝙏𝙄𝙏𝙐𝙇𝙊:* ${meta.title || videoData.title || 'No disponible'}
┉ ᩿💭 ᩠〪ᷭׄ : *𝘿𝙀𝙎𝘾𝙍𝙄𝙋𝘾𝙄𝙊́𝙉:* ${meta.description || 'No disponible'}
┉ ᩿💭 ᩠〪ᷭׄ : *𝙎𝙄𝙏𝙄𝙊:* Facebook
┉ ᩿💭 ᩠〪ᷭׄ : *𝙀𝙉𝙇𝘼𝘾𝙀 𝙊𝙍𝙄𝙂𝙄𝙉𝘼𝙇:* ${args[0]}
────────────────
> ${global.wm || ''}
`

      await conn.sendFile(m.chat, videoData.videoUrl, 'facebook.mp4', caption, m)

    } catch (e) {
      reportError(e)
    }
  }
}

handler.help = ['fb']
handler.tags = ['descargas']
handler.command = ['fb', 'facebook']
handler.register = true

export default handler