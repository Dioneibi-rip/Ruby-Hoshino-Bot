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

const sanitizeFileName = (name = 'manga') => name.replace(/[<>:"/\\|?*]+/g, '').trim() || 'manga'

async function search3Hentai(query) {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`Error de búsqueda en 3hentai: ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  const results = []
  $('a[href*="/d/"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const id = normalizeId(href)
    if (!id) return

    const link = href.startsWith('http') ? href : `${BASE}${href.startsWith('/') ? '' : '/'}${href}`
    const title = $(el).attr('title') || $(el).text().trim() || $(el).find('img').attr('alt') || `3hentai-${id}`
    const thumb = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || ''
    results.push({ id, title: title.trim(), link, thumb: thumb.startsWith('//') ? `https:${thumb}` : thumb })
  })

  return [...new Map(results.map((v) => [v.link, v])).values()].slice(0, 20)
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
    if (/^https?:\/\//i.test(normalized) && /\.(jpg|jpeg)(\?|$)/i.test(normalized)) {
      links.push(normalized)
    }
  })

  const images = [...new Set(links)]
  if (!images.length) throw new Error('No se encontraron imágenes JPG para generar PDF.')

  return { id, title, url, images }
}

const getJpegSize = (buffer) => {
  if (!buffer || buffer.length < 4 || buffer[0] !== 0xFF || buffer[1] !== 0xD8) return { width: 1000, height: 1400 }
  let i = 2
  while (i < buffer.length) {
    if (buffer[i] !== 0xFF) { i++; continue }
    const marker = buffer[i + 1]
    const length = buffer.readUInt16BE(i + 2)
    if ([0xC0, 0xC1, 0xC2].includes(marker)) {
      const height = buffer.readUInt16BE(i + 5)
      const width = buffer.readUInt16BE(i + 7)
      return { width, height }
    }
    i += 2 + length
  }
  return { width: 1000, height: 1400 }
}

const buildPdfFromJpegs = (title, jpegBuffers) => {
  const objects = []
  const pushObj = (content) => { objects.push(content); return objects.length }

  const pageIds = []
  for (const img of jpegBuffers) {
    const size = getJpegSize(img)
    const imgObj = pushObj(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${size.width} /Height ${size.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`), img, Buffer.from('\nendstream')]))
    const contentStream = `q\n${size.width} 0 0 ${size.height} 0 0 cm\n/Im${imgObj} Do\nQ`
    const contentObj = pushObj(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`)
    const pageObj = pushObj(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${size.width} ${size.height}] /Resources << /XObject << /Im${imgObj} ${imgObj} 0 R >> >> /Contents ${contentObj} 0 R >>`)
    pageIds.push(pageObj)
  }

  const kids = pageIds.map((id) => `${id} 0 R`).join(' ')
  const pagesId = pushObj(`<< /Type /Pages /Kids [${kids}] /Count ${pageIds.length} >>`)
  for (const pageId of pageIds) {
    objects[pageId - 1] = String(objects[pageId - 1]).replace('/Parent 0 0 R', `/Parent ${pagesId} 0 R`)
  }
  const catalogId = pushObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)
  const infoId = pushObj(`<< /Title (${title.replace(/[()]/g, '')}) /Producer (Ruby-Hoshino-Bot) >>`)

  let offset = 0
  const chunks = [Buffer.from('%PDF-1.4\n')]
  offset += chunks[0].length
  const xref = ['0000000000 65535 f ']

  for (let i = 0; i < objects.length; i++) {
    const obj = Buffer.isBuffer(objects[i]) ? objects[i] : Buffer.from(String(objects[i]))
    const head = Buffer.from(`${i + 1} 0 obj\n`)
    const tail = Buffer.from('\nendobj\n')
    xref.push(String(offset).padStart(10, '0') + ' 00000 n ')
    chunks.push(head, obj, tail)
    offset += head.length + obj.length + tail.length
  }

  const xrefOffset = offset
  const xrefBody = `xref\n0 ${objects.length + 1}\n${xref.join('\n')}\n`
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  chunks.push(Buffer.from(xrefBody), Buffer.from(trailer))

  return Buffer.concat(chunks)
}

async function build3HentaiPdf(gallery, limit = 80) {
  const selected = gallery.images.slice(0, limit)
  const jpegBuffers = []

  for (const url of selected) {
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) continue
    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    if (!contentType.includes('jpeg') && !contentType.includes('jpg')) continue
    const arr = await res.arrayBuffer()
    jpegBuffers.push(Buffer.from(arr))
  }

  if (!jpegBuffers.length) throw new Error('No se pudieron descargar imágenes JPG para crear el PDF.')

  const safeTitle = sanitizeFileName(`${gallery.title} (${gallery.id})`)
  const pdfBuffer = buildPdfFromJpegs(safeTitle, jpegBuffers)

  return { pdfBuffer, fileName: `${safeTitle}.pdf`, downloaded: jpegBuffers.length, selected: selected.length }
}

export { get3HentaiGallery, normalizeId, search3Hentai, build3HentaiPdf }
