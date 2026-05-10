import fetch from 'node-fetch'
import cheerio from 'cheerio'

const MEDIAFIRE_URL_REGEX = /^https?:\/\/(www\.)?mediafire\.com\//i

function normalizeUrl(url = '') {
  if (!url) return null
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `https://www.mediafire.com${url}`
  return url
}

function decodeScrambledUrl(scrambled) {
  if (!scrambled) return null
  try {
    return Buffer.from(scrambled, 'base64').toString('utf-8')
  } catch {
    return null
  }
}

function pickFirst($, selectors = []) {
  for (const selector of selectors) {
    const value = $(selector).first().text().trim()
    if (value) return value
  }
  return ''
}

function extractDownloadFromScripts(html = '') {
  const patterns = [
    /kNO\s*=\s*"([^"]+)"/i,
    /href\s*=\s*"(https?:\\\/\\\/[^"]*download[^"]+)"/i,
    /(https?:\/\/download\d+\.mediafire\.com\/[^"]+)/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (!match?.[1]) continue
    const candidate = match[1].replace(/\\\//g, '/')
    return normalizeUrl(candidate)
  }

  return null
}

async function mediafireScrape(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })

  if (!response.ok) {
    throw new Error(`MediaFire respondió con estado ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  const fileName = pickFirst($, ['.filename', '.dl-filename', 'h1.filename', '.file-title']) || $('title').text().split(' - ')[0].trim() || 'Unknown'
  const fileSize = pickFirst($, ['.details > li:first-child > span', '.file_size', '.file-size', '.size']) || 'Unknown'

  const downloadBtn = $('#downloadButton, a.input.popsok, a[data-scrambled-url]').first()
  const downloadFromHref = normalizeUrl(downloadBtn.attr('href'))
  const downloadFromScrambled = decodeScrambledUrl(downloadBtn.attr('data-scrambled-url'))
  const downloadFromScript = extractDownloadFromScripts(html)

  const downloadLink = downloadFromScrambled || downloadFromHref || downloadFromScript

  const meta = {}
  $('meta').each((_, element) => {
    const name = $(element).attr('name') || $(element).attr('property')
    const content = $(element).attr('content')
    if (!name || !content || name === 'undefined') return
    const key = name.includes(':') ? name.split(':').pop() : name
    meta[key] = content
  })

  const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/)
  const fileExtension = extMatch ? extMatch[1].toLowerCase() : ''
  const mimeMap = {
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    txt: 'text/plain',
    exe: 'application/x-msdownload',
    apk: 'application/vnd.android.package-archive',
  }

  return {
    fileName,
    fileSize,
    downloadLink,
    mimeType: mimeMap[fileExtension] || 'application/octet-stream',
    fileExtension,
    meta,
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) throw m.reply(`${emoji} Por favor, ingresa un link de mediafire.`)

  const url = text.trim()
  if (!MEDIAFIRE_URL_REGEX.test(url)) {
    throw m.reply(`${emoji} Link inválido, debe ser de MediaFire.`)
  }

  await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

  try {
    const data = await mediafireScrape(url)

    if (!data?.downloadLink) {
      throw new Error('No se pudo extraer el enlace de descarga.')
    }

    await conn.sendFile(
      m.chat,
      data.downloadLink,
      data.fileName || 'mediafire.file',
      `乂  *¡MEDIAFIRE - DESCARGAS!*  乂\n\n✩ *Nombre* : ${data.fileName || 'Unknown'}\n✩ *Peso* : ${data.fileSize || 'Unknown'}\n✩ *MimeType* : ${data.mimeType || 'application/octet-stream'}\n> ${dev}`,
      m,
    )

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
  } catch (error) {
    console.error('MEDIAFIRE_ERROR:', error)
    await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } })
    throw m.reply(`${emoji} Ocurrió un error al procesar el enlace de MediaFire.`)
  }
}

handler.help = ['mediafire']
handler.tags = ['descargas']
handler.command = ['mf', 'mediafire']
handler.register = true
handler.group = true

export default handler
