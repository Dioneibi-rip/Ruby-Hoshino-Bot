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

function extractVideoRenderer(item) {
  if (!item) return null
  if (item.videoRenderer) return item.videoRenderer
  if (item.compactVideoRenderer) return item.compactVideoRenderer
  if (item.richItemRenderer?.content?.videoRenderer) return item.richItemRenderer.content.videoRenderer
  return null
}

function collectVideoRenderers(contents = []) {
  const videos = []
  for (const item of contents) {
    const video = extractVideoRenderer(item)
    if (video?.videoId) videos.push(video)
  }
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
  const match = html.match(/var ytInitialData = ({.*?});<\/script>/s)
  if (!match?.[1]) throw new Error('No se pudo extraer ytInitialData')

  const data = JSON.parse(match[1])
  const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || []
  const videos = []
  for (const section of sections) {
    const contents = section.itemSectionRenderer?.contents || section.richSectionRenderer?.content?.richShelfRenderer?.contents || []
    videos.push(...collectVideoRenderers(contents))
  }

  const all = videos.map(mapYoutubeVideo).filter(video => video.title && video.videoId)
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

conn.sendFile(m.chat, tes[0].thumbnail, 'yts.jpeg', teks, fkontak, m)

}
handler.help = ['ytsearch']
handler.tags = ['buscador']
handler.command = ['ytbuscar', 'ytsearch', 'yts']
handler.register = true
handler.coin = 1

export default handler
