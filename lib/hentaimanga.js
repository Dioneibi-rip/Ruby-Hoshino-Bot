import fetch from 'node-fetch'
import cheerio from 'cheerio'

const BASE = 'https://es.3hentai.net'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
}

const normalizeId = (text = '') => {
  const byUrl = text.match(/3hentai\.net\/d\/(\d+)/i)
  if (byUrl?.[1]) return byUrl[1]
  const byDigits = text.trim().match(/^(\d+)$/)
  if (byDigits?.[1]) return byDigits[1]
  return ''
}

const normalizeImageLink = (url = '') => {
  if (!url) return ''
  return url.replace(/t\.(jpg|jpeg|png|webp)(\?.*)?$/i, '.$1$2')
}

async function get3HentaiGallery(input) {
  const id = normalizeId(input)
  if (!id) throw new Error('ID inválido. Usa un ID numérico o URL de /d/.')

  const url = `${BASE}/d/${id}`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`Error en 3hentai: ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)

  const title = $('title').first().text().trim() || `3hentai-${id}`
  const links = []

  $('img[data-src], img[src]').each((_, el) => {
    const src = $(el).attr('data-src') || $(el).attr('src') || ''
    const full = src.startsWith('//') ? `https:${src}` : src
    const normalized = normalizeImageLink(full)
    if (/^https?:\/\//i.test(normalized) && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(normalized)) {
      links.push(normalized)
    }
  })

  const images = [...new Set(links)]
  if (!images.length) throw new Error('No se encontraron imágenes para descargar.')

  return { id, title, url, images }
}

export { get3HentaiGallery, normalizeId }
