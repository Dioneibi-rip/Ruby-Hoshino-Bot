import axios from 'axios'
import cheerio from 'cheerio'

const BASE = 'https://hentai.tv'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
}

const normalizeUrl = (url = '') => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

async function searchHentai(query) {
  const { data } = await axios.get(`${BASE}/?s=${encodeURIComponent(query)}`, { headers: HEADERS, timeout: 30000 })
  const $ = cheerio.load(data)
  const results = []

  $('div.flex > div.crsl-slde').each((_, el) => {
    const title = $(el).find('a').first().text().trim()
    const link = normalizeUrl($(el).find('a').first().attr('href'))
    const views = $(el).find('p').text().trim()
    const thumbnail = normalizeUrl($(el).find('img').attr('src'))
    if (title && link) results.push({ title, link, views, thumbnail })
  })

  return results
}

async function getHentaiDetail(url) {
  const { data } = await axios.get(normalizeUrl(url), { headers: HEADERS, timeout: 30000 })
  const $ = cheerio.load(data)

  const title = $('h1').first().text().trim() || $('title').text().trim()
  const description = $('meta[name="description"]').attr('content') || $('p').first().text().trim()
  const thumbnail = normalizeUrl($('meta[property="og:image"]').attr('content') || $('video').attr('poster'))

  const streams = []
  $('video source').each((_, el) => {
    const src = normalizeUrl($(el).attr('src'))
    const label = ($(el).attr('label') || $(el).attr('res') || '').trim()
    const type = ($(el).attr('type') || '').trim()
    if (src) streams.push({ src, label: label || 'default', type })
  })

  if (!streams.length) {
    const raw = data.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/gi) || []
    raw.forEach((src, i) => streams.push({ src, label: `m3u8-${i + 1}`, type: 'application/x-mpegURL' }))
  }

  return { title, description, thumbnail, streams }
}

export { searchHentai, getHentaiDetail }
