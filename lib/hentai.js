import fetch from 'node-fetch'
import cheerio from 'cheerio'

const BASE = 'https://veohentai.com'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
}

const normalizeUrl = (url = '') => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

const decodeB64 = (str = '') => {
  try {
    return Buffer.from(str, 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

const extractMp4Url = (content = '') => {
  if (!content) return ''

  const cleaned = content
    .replace(/\\\//g, '/')
    .replace(/\u0026/gi, '&')
    .replace(/&amp;/g, '&')

  const rawMp4 = cleaned.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s<]*/i)
  if (rawMp4?.[0]) return rawMp4[0].replace(/&amp;/g, '&')

  return ''
}

const extractFromScripts = (html = '') => {
  if (!html) return ''

  const urlInWindowOpen = html.match(/(?:window\.open|location\.href)\((['"])(https?:\\\/\\\/[^"']+?\.mp4[^"']*)\1/i)
  if (urlInWindowOpen?.[2]) return extractMp4Url(urlInWindowOpen[2])

  const urlInJson = html.match(/(['"])(https?:\\\/\\\/[^"']+?\.mp4[^"']*)\1/i)
  if (urlInJson?.[2]) return extractMp4Url(urlInJson[2])

  return ''
}

async function searchHentai(query) {
  const res = await fetch(`${BASE}/?s=${encodeURIComponent(query)}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`Error de búsqueda: ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  const results = []
  $('.grid a, article a').each((_, el) => {
    const link = normalizeUrl($(el).attr('href'))
    const title = $(el).find('h2,h3').first().text().trim() || $(el).attr('title')?.trim()
    if (link.includes('/ver/') && title) results.push({ title, link })
  })

  return [...new Map(results.map((v) => [v.link, v])).values()]
}

async function getHentaiDetail(url) {
  const target = normalizeUrl(url)
  const res = await fetch(target, { headers: HEADERS })
  if (!res.ok) throw new Error(`Error en detalle: ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  const title = $('h1.text-whitegray.text-lg, h1').first().text().trim() || $('title').text().trim()
  const views = $('h4.text-whitelite.text-sm').first().text().trim()
  const likes = $('#num-like').first().text().trim()
  const dislikes = $('#num-dislike').first().text().trim()
  const thumbnail = normalizeUrl($('meta[property="og:image"]').attr('content') || $('img').first().attr('src'))

  let videoUrl = ''

  // 1) Primero intentar el botón/link de descarga directo en la página principal.
  $('a[href]').each((_, el) => {
    if (videoUrl) return
    const href = $(el).attr('href') || ''
    const text = $(el).text().toLowerCase()
    const looksLikeDownload = /descarg|download|bajar/.test(text) || /\.mp4(\?|$)/i.test(href)
    if (!looksLikeDownload) return

    const normalized = normalizeUrl(href)
    if (/\.mp4(\?|$)/i.test(normalized)) videoUrl = normalized
  })

  // 2) Buscar cualquier URL mp4 incrustada en el HTML principal.
  if (!videoUrl) {
    videoUrl = extractMp4Url(html)
  }

  // 2.1) Algunas páginas guardan la URL MP4 escapada dentro de scripts.
  if (!videoUrl) {
    videoUrl = extractFromScripts(html)
  }

  // 3) Fallback: intentar extraer desde el iframe/player.
  const iframeSrc = normalizeUrl($('.aspect-w-16.aspect-h-9 iframe, iframe').first().attr('src'))
  if (!videoUrl && iframeSrc) {
    const iframeRes = await fetch(iframeSrc, { headers: { ...HEADERS, Referer: target } })
    if (!iframeRes.ok) throw new Error(`Error en player: ${iframeRes.status}`)
    const iframeHtml = await iframeRes.text()

    const directMatch = iframeHtml.match(/data-id="\/player\.php\?u=([^&"\s]*)/i)
    const fileMatch = iframeHtml.match(/["']file["']\s*:\s*["'](https?:\/\/[^"']+)["']/i)

    if (directMatch?.[1]) {
      videoUrl = decodeB64(decodeURIComponent(directMatch[1]))
    }
    if (!videoUrl && fileMatch?.[1]) {
      videoUrl = fileMatch[1]
    }
    if (!videoUrl) {
      videoUrl = extractMp4Url(iframeHtml)
    }
    if (!videoUrl) {
      videoUrl = extractFromScripts(iframeHtml)
    }
  }

  return { title, views, likes, dislikes, thumbnail, videoUrl }
}

async function getFileSize(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: HEADERS })
    const size = Number.parseInt(res.headers.get('content-length') || '0', 10)
    if (!size) return 'Desconocido'
    if (size >= 1e9) return `${(size / 1e9).toFixed(2)} GB`
    if (size >= 1e6) return `${(size / 1e6).toFixed(2)} MB`
    if (size >= 1e3) return `${(size / 1e3).toFixed(2)} KB`
    return `${size} Bytes`
  } catch {
    return 'Desconocido'
  }
}

export { searchHentai, getHentaiDetail, getFileSize }
