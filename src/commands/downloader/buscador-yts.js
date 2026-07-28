function getText(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value.simpleText) return value.simpleText
  if (Array.isArray(value.runs)) return value.runs.map(run => run.text || '').join('')
  return ''
}

function parseDurationSeconds(duration) {
  if (!duration || typeof duration !== 'string') return 0
  return duration.split(':').map(Number).reduce((total, part) => (total * 60) + (Number.isFinite(part) ? part : 0), 0)
}

function parseViews(viewsText) {
  if (!viewsText) return 0
  const normalized = viewsText.replace(/,/g, '').replace(/\./g, '')
  const match = normalized.match(/\d+/)
  return match ? Number(match[0]) : 0
}

function extractYtInitialData(html = '') {
  const marker = 'ytInitialData'
  const markerIndex = html.indexOf(marker)
  if (markerIndex < 0) throw new Error('No se pudo extraer ytInitialData')
  const start = html.indexOf('{', markerIndex)
  if (start < 0) throw new Error('No se pudo extraer ytInitialData')
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < html.length; i++) {
    const char = html[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{') depth++
    else if (char === '}') {
      depth--
      if (depth === 0) return JSON.parse(html.slice(start, i + 1))
    }
  }
  throw new Error('ytInitialData incompleto')
}

function collectVideoRenderers(node, videos = []) {
  if (!node || typeof node !== 'object') return videos
  if (Array.isArray(node)) {
    for (const item of node) collectVideoRenderers(item, videos)
    return videos
  }
  const video = node.videoRenderer || node.compactVideoRenderer || node.richItemRenderer?.content?.videoRenderer
  if (video?.videoId) videos.push(video)
  for (const value of Object.values(node)) collectVideoRenderers(value, videos)
  return videos
}

function mapYoutubeVideo(video) {
  const videoId = video.videoId
  const title = getText(video.title)
  const timestamp = getText(video.lengthText) || getText(video.thumbnailOverlays?.find(overlay => overlay.thumbnailOverlayTimeStatusRenderer)?.thumbnailOverlayTimeStatusRenderer?.text)
  const viewsText = getText(video.viewCountText) || getText(video.shortViewCountText)
  const authorName = getText(video.ownerText) || getText(video.longBylineText) || getText(video.shortBylineText)
  const thumbnails = video.thumbnail?.thumbnails || []
  const thumbnail = thumbnails.at(-1)?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return {
    type: 'video',
    title,
    videoId,
    url: `https://youtu.be/${videoId}`,
    timestamp,
    duration: {
      timestamp,
      seconds: parseDurationSeconds(timestamp)
    },
    seconds: parseDurationSeconds(timestamp),
    views: parseViews(viewsText),
    ago: getText(video.publishedTimeText) || 'No disponible',
    author: { name: authorName || 'Desconocido' },
    thumbnail
  }
}

async function nativeYoutubeSearch(query) {
  const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'accept-language': 'es-ES,es;q=0.9,en;q=0.8'
    }
  })
  if (!response.ok) throw new Error(`YouTube respondió con estado ${response.status}`)

  const html = await response.text()
  const data = extractYtInitialData(html)
  const seen = new Set()
  const all = collectVideoRenderers(data)
    .map(mapYoutubeVideo)
    .filter(video => {
      if (!video.title || !video.videoId || seen.has(video.videoId)) return false
      seen.add(video.videoId)
      return true
    })
  return { all, videos: all }
}

var handler = async (m, { text, conn, args, command, usedPrefix }) => {

if (!text) return conn.reply(m.chat, `${emoji} Por favor, ingresa una busqueda de Youtube.`, m)

conn.reply(m.chat, wait, m)

let results
try {
results = await nativeYoutubeSearch(text)
} catch (error) {
console.error(error)
return conn.reply(m.chat, '⚠︎ Error inesperado.', m)
}
let tes = results.all
if (!tes.length) return conn.reply(m.chat, '⚠︎ No encontré resultados.', m)
let teks = results.all.map(v => {
switch (v.type) {
case 'video': return `「✦」Resultados de la búsqueda para *<${text}>*

> ☁️ Título » *${v.title}*
> 🍬 Canal » *${v.author.name}*
> 🕝 Duración » *${v.timestamp}*
> 📆 Subido » *${v.ago}*
> 👀 Vistas » *${v.views}*
> 🔗 Enlace » ${v.url}`}}).filter(v => v).join('\n\n••••••••••••••••••••••••••••••••••••\n\n')

conn.reply(m.chat, teks, m)

}
handler.help = ['ytsearch']
handler.tags = ['buscador']
handler.command = ['ytbuscar', 'ytsearch', 'yts']
handler.register = true
handler.coin = 1

export default handler
