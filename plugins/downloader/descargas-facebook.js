import fetch from 'node-fetch'
import cheerio from 'cheerio'

var handler = async (m, { conn, args, command, usedPrefix, text }) => {
  const isCommand7 = /^(facebook|fb|facebookdl|fbdl)$/i.test(command)

  async function reportError(e) {
    await conn.reply(m.chat, `⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁: ${e.message || e}`, m, rcanal)
    console.log(e)
  }

  // Función para obtener metadatos de la página (título, descripción)
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

  // Nueva función de descarga usando getvidfb.com
  async function getVidFb(url) {
    const encodedUrl = encodeURIComponent(url)
    const formData = `url=${encodedUrl}&lang=en&type=redirect`

    const res = await fetch('https://getvidfb.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
        'Origin': 'https://getvidfb.com',
        'Referer': 'https://getvidfb.com/'
      },
      body: formData,
      timeout: 30000 // 30 segundos
    })

    if (!res.ok) throw new Error('Error al contactar con el servidor de descarga')
    const html = await res.text()
    const $ = cheerio.load(html)

    const videoContainer = $('#snaptik-video')
    if (!videoContainer.length) throw new Error('No se encontró el contenedor del video. Enlace inválido o video no disponible.')

    const thumb = videoContainer.find('.snaptik-left img').attr('src') || ''
    const title = videoContainer.find('.snaptik-middle h3').text().trim() || 'Facebook Video'

    // Buscar enlaces de descarga (priorizamos HD o SD)
    const links = []
    videoContainer.find('.abuttons a').each((_, el) => {
      const link = $(el).attr('href')
      const spanText = $(el).find('.span-icon span').last().text().trim()
      if (!link || !link.startsWith('http')) return

      let quality = 'unknown'
      if (spanText.includes('HD')) quality = 'HD'
      else if (spanText.includes('SD')) quality = 'SD'
      else if (spanText.includes('Audio') || spanText.includes('Mp3')) quality = 'audio'
      else if (spanText.includes('Photo') || spanText.includes('Jpg')) quality = 'photo'
      else return

      links.push({ url: link, quality })
    })

    if (links.length === 0) throw new Error('No se encontraron enlaces de descarga')

    // Elegir el mejor: primero HD, luego SD
    const best = links.find(l => l.quality === 'HD') || links.find(l => l.quality === 'SD')
    if (!best) throw new Error('No se encontró enlace de video (HD/SD)')

    return {
      videoUrl: best.url,
      thumbnail: thumb,
      title
    }
  }

  if (isCommand7) {
    if (!text) return conn.reply(m.chat, `🚩 *Ingrese un enlace de facebook*`, m, rcanal)

    if (!args[0].match(/www\.facebook\.com|fb\.watch|web\.facebook\.com|business\.facebook\.com|video\.fb\.com/g))
      return conn.reply(m.chat, '🚩 *No es un enlace válido de Facebook*', m, rcanal)

    conn.reply(m.chat, '🚀 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮𝗻𝗱𝗼 𝗘𝗹 𝗩𝗶𝗱𝗲𝗼 𝗗𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸, 𝗘𝘀𝗽𝗲𝗿𝗲 𝗨𝗻 𝗠𝗼𝗺𝗲𝗻𝘁𝗼....', m, {
      contextInfo: {
        forwardingScore: 2022,
        isForwarded: true
      }
    })

    m.react(rwait)

    try {
      // 1. Obtener enlace de video con getvidfb
      const { videoUrl, thumbnail, title: fbTitle } = await getVidFb(args[0])

      // 2. Obtener metadatos adicionales de la página original
      const meta = await scrapeMetadata(args[0])

      let caption = `꒰꒰͡  *𝗩𝗶𝗱𝗲𝗼 𝗱𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 ⁖❤️꙰* !! ര\n
┉ ᩿💭 ᩠〪ᷭׄ : *𝙏𝙄𝙏𝙐𝙇𝙊:* ${meta.title || fbTitle || 'No disponible'}
┉ ᩿💭 ᩠〪ᷭׄ : *𝘿𝙀𝙎𝘾𝙍𝙄𝙋𝘾𝙄𝙊́𝙉:* ${meta.description || 'No disponible'}
┉ ᩿💭 ᩠〪ᷭׄ : *𝙎𝙄𝙏𝙄𝙊:* Facebook
┉ ᩿💭 ᩠〪ᷭׄ : *𝙀𝙉𝙇𝘼𝘾𝙀 𝙊𝙍𝙄𝙂𝙄𝙉𝘼𝙇:* ${args[0]}
────────────────
> ${global.wm}
`

      await conn.sendFile(m.chat, videoUrl, 'facebook.mp4', caption, m)

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