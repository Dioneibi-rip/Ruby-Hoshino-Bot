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

export async function fbdl(url) {
  const home = await fetch('https://fdownloader.net/', { headers: { 'user-agent': UA } })
  const html = await home.text()
  const token = html.match(/name=["']token["'][^>]*value=["']([^"']+)/i)?.[1] || html.match(/value=["']([^"']+)["'][^>]*name=["']token/i)?.[1] || ''
  const response = await postForm('https://fdownloader.net/api/ajaxSearch', { k_exp: '', k_token: token, q: url, lang: 'en', web: 'fdownloader.net', v: 'v2' }, { referer: 'https://fdownloader.net/' })
  const json = await response.json()
  const htmlData = json.data || json.html || ''
  const urls = uniqueUrls([...htmlData.matchAll(/href=["']([^"']+\.mp4[^"']*)["']/gi)].map(match => match[1]))
  const data = urls.map((mediaUrl, index) => ({ url: absolute(mediaUrl, 'https://fdownloader.net/'), quality: index === 0 ? 'HD' : 'SD' }))
  if (!data.length) throw new Error(json.message || 'No se pudo extraer video de Facebook')
  return { status: true, data }
}

export async function igdl(url) {
  const api = `https://api.dorratz.com/igdl?url=${encodeURIComponent(url)}`
  const res = await fetch(api, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} al consultar Instagram`)
  const json = await res.json()
  const raw = json.data || json.result || json.media || json.url || json
  const list = Array.isArray(raw) ? raw : [raw]
  const urls = uniqueUrls(list.flatMap(item => typeof item === 'string' ? [item] : [item?.url, item?.download_url, item?.video, item?.thumbnail]))
  if (!urls.length) throw new Error(json.message || 'No se pudo extraer contenido de Instagram')
  return { status: true, data: urls.map(mediaUrl => ({ url: mediaUrl })) }
}
