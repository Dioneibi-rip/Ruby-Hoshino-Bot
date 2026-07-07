import fetch from 'node-fetch'
import cheerio from 'cheerio'

var handler = async (m, { conn, args, command, text }) => {
  const isCommand7 = /^(facebook|fb|facebookdl|fbdl)$/i.test(command)

  async function reportError(e) {
    await conn.reply(m.chat, `⁖🧡꙰ 𝙾𝙲𝚄𝚁𝚁𝙸𝙾 𝚄𝙽 𝙴𝚁𝚁𝙾𝚁: ${e.message || e}`, m, null)
    console.log(e)
  }

  // Descarga usando fdown.net
  async function fdownDownload(url) {
    const formData = `URLz=${encodeURIComponent(url)}`
    const res = await fetch('https://fdown.net/es/download.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      },
      body: formData,
      timeout: 30000
    })
    if (!res.ok) throw new Error('fdown.net no respondió')
    const html = await res.text()
    const $ = cheerio.load(html)

    // Verificar si hubo error
    if ($('.alert-danger').length) {
      throw new Error($('.alert-danger').text().trim() || 'Error desconocido de fdown')
    }

    // Extraer título
    const title = $('.card-title').first().text().trim() || 'Facebook Video'
    // Extraer thumbnail
    const thumb = $('.card img').first().attr('src') || ''

    // Buscar enlaces de descarga (tabla)
    const downloadRows = $('table tbody tr')
    let hdUrl = null
    let sdUrl = null

    downloadRows.each((i, row) => {
      const text = $(row).text().toLowerCase()
      const link = $(row).find('a').attr('href')
      if (!link) return
      if (text.includes('hd') || text.includes('alta') || text.includes('high')) {
        hdUrl = link
      } else if (text.includes('sd') || text.includes('normal') || text.includes('baja')) {
        sdUrl = link
      }
    })

    // Si no se detectó por texto, tomar el primer enlace de la tabla
    if (!hdUrl && !sdUrl) {
      const firstLink = $('table a').first().attr('href')
      if (firstLink) sdUrl = firstLink
    }

    const videoUrl = hdUrl || sdUrl
    if (!videoUrl) throw new Error('No se encontraron enlaces de descarga')

    return { videoUrl, title, thumb }
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
      const { videoUrl, title } = await fdownDownload(args[0])

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