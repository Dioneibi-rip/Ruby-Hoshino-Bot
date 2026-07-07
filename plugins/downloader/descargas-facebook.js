import fetch from 'node-fetch'

var handler = async (m, { conn, args, command, text }) => {
  const isCommand7 = /^(facebook|fb|facebookdl|fbdl)$/i.test(command)

  async function reportError(e) {
    await conn.reply(m.chat, `⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁: ${e.message || e}`, m, null)
    console.log(e)
  }

  // Extraer URL del video directamente del HTML de Facebook
  async function extractFromFB(url) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 25000
    })
    if (!res.ok) throw new Error('No se pudo cargar la página de Facebook')
    const html = await res.text()

    // Buscar en el JSON embebido (__INITIAL_STATE__)
    let videoUrl = null
    let title = 'Facebook Video'
    let thumb = ''

    // Método 1: Buscar en objetos JSON (más común actualmente)
    const jsonMatch = html.match(/<script type="application\/json"[^>]*>([^<]+)<\/script>/g) || []
    for (const script of jsonMatch) {
      try {
        const content = script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
        const json = JSON.parse(content)
        // Recorrer el objeto en busca de "playable_url" o "browser_native_hd_url"
        const findUrl = (obj) => {
          if (!obj || typeof obj !== 'object') return null
          if (obj.playable_url) return obj.playable_url
          if (obj.browser_native_hd_url) return obj.browser_native_hd_url
          if (obj.video?.playable_url) return obj.video.playable_url
          for (const key of Object.keys(obj)) {
            const found = findUrl(obj[key])
            if (found) return found
          }
          return null
        }
        const urlFound = findUrl(json)
        if (urlFound) {
          videoUrl = urlFound
          // También intentar obtener título y miniatura
          const findTitle = (obj) => {
            if (obj?.video?.title) return obj.video.title
            if (obj?.title) return obj.title
            for (const key of Object.keys(obj)) {
              const t = findTitle(obj[key])
              if (t) return t
            }
            return null
          }
          const foundTitle = findTitle(json)
          if (foundTitle) title = foundTitle
          const findThumb = (obj) => {
            if (obj?.video?.thumbnail_uri) return obj.video.thumbnail_uri
            if (obj?.preferred_thumbnail?.image?.uri) return obj.preferred_thumbnail.image.uri
            for (const key of Object.keys(obj)) {
              const t = findThumb(obj[key])
              if (t) return t
            }
            return null
          }
          const foundThumb = findThumb(json)
          if (foundThumb) thumb = foundThumb
          break
        }
      } catch (e) { }
    }

    // Método 2: Regex clásico sobre el HTML (respaldo)
    if (!videoUrl) {
      const hdMatch = html.match(/"browser_native_hd_url"\s*:\s*"([^"]+)"/) ||
                     html.match(/hd_src\s*:\s*"([^"]+)"/)
      const sdMatch = html.match(/"playable_url"\s*:\s*"([^"]+)"/) ||
                     html.match(/sd_src\s*:\s*"([^"]+)"/)
      const thumbMatch = html.match(/"thumbnail_uri"\s*:\s*"([^"]+)"/) ||
                        html.match(/"preferred_thumbnail"\s*:\s*{"image"\s*:\s*{"uri"\s*:\s*"([^"]+)"/)
      videoUrl = hdMatch?.[1] || sdMatch?.[1] || null
      if (thumbMatch) thumb = thumbMatch[1]
      const titleMatch = html.match(/<title>(.*?)<\/title>/)
      if (titleMatch) title = titleMatch[1].replace(/ - Facebook$/, '').trim()
    }

    if (!videoUrl) throw new Error('No se pudo encontrar el enlace del video (¿el video es público?)')
    
    // Limpiar escapes (\/)
    videoUrl = videoUrl.replace(/\\\//g, '/')
    if (thumb) thumb = thumb.replace(/\\\//g, '/')
    return { videoUrl, title, thumbnail: thumb }
  }

  if (isCommand7) {
    if (!text) return conn.reply(m.chat, `🚩 *Ingrese un enlace de Facebook*`, m, null)
    if (!args[0].match(/www\.facebook\.com|fb\.watch|web\.facebook\.com|business\.facebook\.com|video\.fb\.com/g))
      return conn.reply(m.chat, '🚩 *No es un enlace válido de Facebook*', m, null)

    conn.reply(m.chat, '🚀 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮𝗻𝗱𝗼 𝗘𝗹 𝗩𝗶𝗱𝗲𝗼 𝗗𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸, 𝗘𝘀𝗽𝗲𝗿𝗲 𝗨𝗻 𝗠𝗼𝗺𝗲𝗻𝘁𝗼....', m, {
      contextInfo: { forwardingScore: 2022, isForwarded: true }
    })
    m.react('⏳')

    try {
      const { videoUrl, title } = await extractFromFB(args[0])

      let caption = `꒰꒰͡  *𝗩𝗶𝗱𝗲𝗼 𝗱𝗲 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 ⁖❤️꙰* !! ര\n
┉ ᩿💭 ᩠〪ᷭׄ : *𝙏𝙄𝙏𝙐𝙇𝙊:* ${title || 'No disponible'}
┉ ᩿💭 ᩠〪ᷭׄ : *𝙀𝙉𝙇𝘼𝙘𝙀 𝙊𝙍𝙄𝙂𝙄𝙉𝘼𝙇:* ${args[0]}
────────────────
> ${global.wm || ''}
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