const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
const decode = text => String(text || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")

export class Maker {
  async Ephoto360(url, texts = []) {
    const page = await fetch(url, { headers: { 'user-agent': UA } })
    if (!page.ok) throw new Error(`Ephoto360 HTTP ${page.status}`)
    const html = await page.text()
    const token = html.match(/name=["']token["'][^>]*value=["']([^"']+)/i)?.[1] || ''
    const buildServer = html.match(/build_server\s*=\s*["']([^"']+)/i)?.[1] || 'https://en.ephoto360.com'
    const buildServerId = html.match(/build_server_id\s*=\s*["']([^"']+)/i)?.[1] || ''
    const form = new FormData()
    texts.forEach(text => form.append('text[]', text))
    form.append('submit', 'GO')
    form.append('token', token)
    form.append('build_server', buildServer)
    form.append('build_server_id', buildServerId)
    const res = await fetch(url, { method: 'POST', headers: { 'user-agent': UA, referer: url }, body: form })
    const out = await res.text()
    const image = out.match(/(?:src|href)=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i)?.[1]
    if (!image) throw new Error('No se pudo generar imagen en Ephoto360')
    return { image: new URL(decode(image), res.url).toString() }
  }
}
