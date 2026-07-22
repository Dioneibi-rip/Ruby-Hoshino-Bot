const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'

const decodeHtml = text => String(text || '')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/\\\//g, '/')

function absolute(url, base) {
  try { return new URL(decodeHtml(url), base).toString() } catch { return decodeHtml(url) }
}

function uniqueUrls(urls) {
  return [...new Set(urls.filter(Boolean).map(url => decodeHtml(url).trim()).filter(url => /^https?:\/\//i.test(url)))]
}

function collectMediaUrls(input, output = []) {
  if (!input) return output
  if (typeof input === 'string') {
    if (/^https?:\/\//i.test(input)) output.push(input)
    return output
  }
  if (Array.isArray(input)) {
    for (const item of input) collectMediaUrls(item, output)
    return output
  }
  if (typeof input === 'object') {
    for (const [key, value] of Object.entries(input)) {
      if (/^(url|download|download_url|downloadUrl|video|videoUrl|hd|sd|thumbnail|image|src|link)$/i.test(key)) collectMediaUrls(value, output)
      else if (typeof value === 'object') collectMediaUrls(value, output)
    }
  }
  return output
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json, text/plain, */*', ...(options.headers || {}) }, ...options })
  if (!res.ok) throw new Error(`HTTP ${res.status} al consultar ${url}`)
  return res.json()
}

async function postForm(url, payload, headers = {}) {
  const body = new URLSearchParams(payload)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', ...headers },
    body
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} al consultar ${url}`)
  return res
}

async function cobaltDownload(url) {
  const res = await fetch('https://api.cobalt.tools/api/json', {
    method: 'POST',
    headers: { 'user-agent': UA, accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ url, vQuality: '720', filenamePattern: 'basic', isAudioOnly: false })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} al consultar cobalt`)
  const json = await res.json()
  const urls = uniqueUrls(collectMediaUrls(json))
  if (!urls.length) throw new Error(json.text || json.message || 'Cobalt no devolvió media')
  return urls.map(mediaUrl => ({ url: mediaUrl, quality: json.status || 'media' }))
}

export async function fbdl(url) {
  const attempts = [
    async () => cobaltDownload(url),
    async () => {
      const home = await fetch('https://fdownloader.net/', { headers: { 'user-agent': UA } })
      const html = await home.text()
      const token = html.match(/name=["']token["'][^>]*value=["']([^"']+)/i)?.[1] || html.match(/value=["']([^"']+)["'][^>]*name=["']token/i)?.[1] || ''
      const response = await postForm('https://fdownloader.net/api/ajaxSearch', { k_exp: '', k_token: token, q: url, lang: 'en', web: 'fdownloader.net', v: 'v2' }, { referer: 'https://fdownloader.net/' })
      const json = await response.json()
      const htmlData = json.data || json.html || ''
      const urls = uniqueUrls([
        ...[...htmlData.matchAll(/href=["']([^"']+\.mp4[^"']*)["']/gi)].map(match => match[1]),
        ...collectMediaUrls(json)
      ])
      return urls.map((mediaUrl, index) => ({ url: absolute(mediaUrl, 'https://fdownloader.net/'), quality: index === 0 ? 'HD' : 'SD' }))
    }
  ]
  for (const attempt of attempts) {
    try {
      const data = await attempt()
      if (data.length) return { status: true, data }
    } catch {}
  }
  throw new Error('No se pudo extraer video de Facebook')
}

export async function igdl(url) {
  const attempts = [
    async () => cobaltDownload(url),
    async () => {
      const json = await fetchJson(`https://api.dorratz.com/igdl?url=${encodeURIComponent(url)}`)
      const raw = json.data || json.result || json.media || json.url || json
      return uniqueUrls(collectMediaUrls(raw)).map(mediaUrl => ({ url: mediaUrl }))
    },
    async () => {
      const json = await fetchJson(`https://api.saveig.app/api/ajaxSearch?url=${encodeURIComponent(url)}`)
      return uniqueUrls(collectMediaUrls(json)).map(mediaUrl => ({ url: mediaUrl }))
    }
  ]
  for (const attempt of attempts) {
    try {
      const data = await attempt()
      if (data.length) return { status: true, data }
    } catch {}
  }
  throw new Error('No se pudo extraer contenido de Instagram')
}
