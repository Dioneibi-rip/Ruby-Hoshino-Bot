import axios from 'axios'
import cheerio from 'cheerio'

const BASE = 'https://hentai.tv'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  Referer: `${BASE}/`
}

const normalizeUrl = (url = '') => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

const uniqBySrc = (arr = []) => {
  const seen = new Set()
  return arr.filter((item) => {
    if (!item?.src || seen.has(item.src)) return false
    seen.add(item.src)
    return true
  })
}

function extractScriptStreams(html = '') {
  const streams = []
  const patterns = [
    /["']file["']\s*:\s*["'](https?:\/\/[^"']+)["']/gi,
    /["']src["']\s*:\s*["'](https?:\/\/[^"']+)["']/gi,
    /(https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/gi,
    /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/gi
  ]

  for (const rgx of patterns) {
    for (const match of html.matchAll(rgx)) {
      const src = normalizeUrl(match[1])
      if (!src) continue
      const type = src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'
      streams.push({ src, label: type === 'video/mp4' ? 'mp4' : 'm3u8', type })
    }
  }

  return uniqBySrc(streams)
}

async function searchHentai(query) {
  const { data } = await axios.get(`${BASE}/?s=${encodeURIComponent(query)}`, { headers: HEADERS, timeout: 30000 })
  const $ = cheerio.load(data)
  const results = []

  $('div.flex > div.crsl-slde, article, .post, .inside-article').each((_, el) => {
    const title = $(el).find('a').first().text().trim() || $(el).find('h2,h3').first().text().trim()
    const link = normalizeUrl($(el).find('a').first().attr('href'))
    const views = $(el).find('p,.views,.meta').first().text().trim()
    const thumbnail = normalizeUrl($(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src'))
    if (title && link && /^https?:\/\//.test(link)) results.push({ title, link, views, thumbnail })
  })

  return uniqBySrc(results.map(v => ({ ...v, src: v.link }))).map(({ src, ...rest }) => rest)
}

async function getHentaiDetail(url) {
  const target = normalizeUrl(url)
  const { data } = await axios.get(target, { headers: HEADERS, timeout: 30000 })
  const $ = cheerio.load(data)

  const title = $('h1').first().text().trim() || $('title').text().trim()
  const description = $('meta[name="description"]').attr('content') || $('p').first().text().trim()
  const thumbnail = normalizeUrl($('meta[property="og:image"]').attr('content') || $('video').attr('poster') || $('img').first().attr('src'))

  let streams = []

  $('video source, source').each((_, el) => {
    const src = normalizeUrl($(el).attr('src'))
    const label = ($(el).attr('label') || $(el).attr('res') || $(el).attr('size') || '').trim()
    const type = ($(el).attr('type') || (src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4')).trim()
    if (src) streams.push({ src, label: label || (type === 'video/mp4' ? 'mp4' : 'm3u8'), type })
  })

  const iframeUrl = normalizeUrl($('iframe').first().attr('src'))
  if (iframeUrl) {
    try {
      const iframeRes = await axios.get(iframeUrl, { headers: { ...HEADERS, Referer: target }, timeout: 30000 })
      streams.push(...extractScriptStreams(iframeRes.data))
    } catch {}
  }

  streams.push(...extractScriptStreams(data))

  streams = uniqBySrc(streams)

  return { title, description, thumbnail, streams }
}

export { searchHentai, getHentaiDetail }
