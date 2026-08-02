import { enqueueMediaJob, getMediaQueueConnection } from '../../library/queue.js'
import { ytmp3, ytmp4 } from '../../library/youtubedl.js'
import { assertRemoteFileSize, replyIfMediaTooLarge } from '../../library/media-size.js'
import fs from 'fs'
import { execFile as execFileCb } from 'child_process'
import { join } from 'path'

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



async function nativeYoutubeSearchByVideoId(videoId) {
  const result = await nativeYoutubeSearch(`https://youtu.be/${videoId}`)
  return result.all.find(video => video.videoId === videoId) || result.all[0]
}

async function pathExists(file) {
  try {
    await fs.promises.access(file)
    return true
  } catch {
    return false
  }
}

const youtubeRegexID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|http:\/\/googleusercontent\.com\/youtube\.com\/0)([a-zA-Z0-9_-]{11})/

const newsletterJid = '120363335626706839@newsletter'
const newsletterName = '𖥔ᰔᩚ⋆｡˚ ꒰🍒 ʀᴜʙʏ-ʜᴏꜱʜɪɴᴏ | ᴄʜᴀɴɴᴇʟ-ʙᴏᴛ 💫꒱࣭'

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text || !text.trim()) {
      return conn.reply(m.chat, '✧ 𝙃𝙚𝙮! Debes escribir *el nombre o link* del video/audio para descargar.', m)
    }

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
    await enqueueMediaJob('youtube', {
      chat: m.chat,
      text: text.trim(),
      command,
      message: { key: m.key, message: m.message, sender: m.sender, chat: m.chat }
    }, { conn })
  } catch (error) {
    console.error(error)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return m.reply('⚠︎ Error inesperado.')
  }
}

handler.command = ['play', 'yta', 'ytmp3', 'playdoc', 'play2', 'ytv', 'ytmp4', 'play2doc', 'playaudio', 'mp4']
handler.help = ['play', 'yta', 'ytmp3', 'playdoc', 'play2', 'ytv', 'ytmp4', 'play2doc', 'playaudio', 'mp4']
handler.tags = ['descargas']

export default handler

function formatViews(views) {
  if (!views) return 'No disponible'
  if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)}B`
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k`

  return views.toString()
}

function execFile(command, args) {
  return new Promise((resolve, reject) => {
    execFileCb(command, args, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

global.queueHandlers ||= new Map()
global.queueHandlers.set('youtube', async (data, ctx = {}) => {
  const conn = ctx.conn || getMediaQueueConnection()
  const m = data.message
  try {
    let searchResult = null
    const match = data.text.match(youtubeRegexID)

    if (match) {
      try {
        searchResult = await nativeYoutubeSearchByVideoId(match[1])
      } catch (e) {
        const s = await nativeYoutubeSearch(data.text)
        searchResult = s.all[0]
      }
    } else {
      const s = await nativeYoutubeSearch(data.text)
      searchResult = s.all.find(v => v.type === 'video') || s.all[0]
    }

    if (!searchResult) {
      await conn.sendMessage(data.chat, { react: { text: '❌', key: m.key } })
      return conn.reply(data.chat, '⚠︎ No encontré resultados.', m)
    }

    const { title, thumbnail, timestamp, views, ago, url, author } = searchResult
    const vistas = formatViews(views)
    const canal = author?.name || 'Desconocido'

    // Se mantiene intacta tu decoración y estética visual
    const infoMessage = `ㅤ۫ ㅤ 🦭 ୧ ˚ \\𝒅𝒆𝒔𝒄𝒂𝒓𝒈𝒂 𝒆𝒏 𝒄𝒂𝒎𝒊𝒏𝒐\` ! ୨ 𖹭 ִֶָ
᮫ؙܹ ᳘︵᮫ּܹ࡛〫ࣥܳ⌒ؙ۫ ᮫ּ۪֯⏝ֺ࣯࠭۟ ᮫ּ〪࣭︶᮫ܹ᳟〫࠭߳፝֟᷼⏜᮫᮫ּ〪࣭࠭〬︵᮫ּ᳝̼࣪ 🍚⃘ᩚּ̟߲ ּ〪࣪︵᮫࣭࣪࠭ᰯּ〪࣪࠭⏜ְ࣮〫߳ ᮫ּׅ࣪۟︶᮫ܹׅ࠭〬 ᮫ּּ࣭᷼⏝ᩥ᮫〪ܹ۟࠭۟۟ ᮫ּؙ⌒᮫ܹ۫︵ᩝּּ۟࠭ ࣭۪۟
🧊✿⃘࣪◌ ֪ \`𝗧𝗶́𝘁𝘂𝗹𝗼\` » ${title}
🧊✿⃘࣪◌ ֪ \`𝗖𝗮𝗻𝗮𝗹\` » ${canal}
🧊✿⃘࣪◌ ֪ \`𝗗𝘂𝗿𝗮𝗰𝗶𝗼́𝗻\` » ${timestamp}
🧊✿⃘࣪◌ ֪ \`𝗩𝗶𝘀𝘁𝗮𝘀\` » ${vistas}
🧊✿⃘࣪◌ ֪ \`𝗣𝘂𝗯𝗹𝗶𝗰𝗮𝗱𝗼\` » ${ago}
🧊✿⃘࣪◌ ֪ \`𝗟𝗶𝗻𝗸\` » ${url}

𐙚 🪵 ｡ Preparando tu descarga... ˙𐙚`.trim()

    await conn.sendMessage(data.chat, {
      image: { url: thumbnail },
      caption: infoMessage,
      contextInfo: {
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
          newsletterJid: newsletterJid,
          newsletterName: newsletterName,
          serverMessageId: -1
        }
      }
    }, { quoted: m })

    if (['play', 'yta', 'ytmp3', 'playaudio', 'playdoc'].includes(data.command)) {
      try {
        const r = await ytmp3(url, title)
        if (!r?.download?.url) throw new Error('Link caído')
        await assertRemoteFileSize(r.download.url, { label: 'audio' })

        if (data.command === 'playdoc') {
          const file = await conn.getFile(r.download.url)
          await conn.sendMessage(data.chat, {
            document: file.data,
            fileName: `${r.metadata.title}.mp3`,
            mimetype: 'audio/mpeg'
          }, { quoted: m })
        } else {
          await conn.sendMessage(data.chat, {
            audio: { url: r.download.url },
            fileName: `${r.metadata.title}.mp3`,
            mimetype: 'audio/mpeg',
            ptt: false
          }, { quoted: m })
        }

        await conn.sendMessage(data.chat, { react: { text: '✅', key: m.key } })
      } catch (e) {
        console.error(e)
        await conn.sendMessage(data.chat, { react: { text: '❌', key: m.key } })
        if (await replyIfMediaTooLarge(conn, data.chat, e, m, { label: 'audio' })) return
        return conn.reply(data.chat, 'Error al descargar audio.', m)
      }
    } else if (['play2', 'ytv', 'ytmp4', 'mp4', 'play2doc'].includes(data.command)) {
      try {
        const r = await ytmp4(url, title)
        if (!r?.download?.url) throw new Error('Link caído')
        await assertRemoteFileSize(r.download.url, { label: 'video' })

        const videoUrl = r.download.url
        const tmpDir = join(process.cwd(), 'tmp')
        if (!await pathExists(tmpDir)) await fs.promises.mkdir(tmpDir)

        const fileName = join(tmpDir, `${Date.now()}.mp4`)

        await execFile('ffmpeg', ['-i', videoUrl, '-c:v', 'copy', '-c:a', 'aac', '-movflags', '+faststart', fileName])

        if (!await pathExists(fileName)) throw new Error('Error en FFmpeg')

        const videoBuffer = await fs.promises.readFile(fileName)
        if (data.command === 'play2doc') {
          await conn.sendMessage(data.chat, {
            document: videoBuffer,
            fileName: `${title}.mp4`,
            mimetype: 'video/mp4'
          }, { quoted: m })
        } else {
          await conn.sendMessage(data.chat, {
            video: videoBuffer,
            fileName: `${title}.mp4`,
            caption: `${title}`,
            mimetype: 'video/mp4'
          }, { quoted: m })
        }

        await fs.promises.unlink(fileName)
        await conn.sendMessage(data.chat, { react: { text: '✅', key: m.key } })
      } catch (e) {
        console.error(e)
        await conn.sendMessage(data.chat, { react: { text: '❌', key: m.key } })
        if (await replyIfMediaTooLarge(conn, data.chat, e, m, { label: 'video' })) return
        return conn.reply(data.chat, '✦ No se pudo procesar el video. Intenta más tarde.', m)
      }
    }
  } catch (error) {
    console.error(error)
    await conn.sendMessage(data.chat, { react: { text: '❌', key: m.key } })
    return conn.reply(data.chat, '⚠︎ Error inesperado.', m)
  }
})