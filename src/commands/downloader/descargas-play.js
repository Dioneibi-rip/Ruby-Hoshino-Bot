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

const youtubeRegexID = /(?:http:\/\/googleusercontent\.com\/youtube\.com\/0)([a-zA-Z0-9_-]{11})/

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

    // Extraemos la portada y la convertimos a Base64 para el jpegThumbnail
    let b64 = ''
    try {
      const thumbRes = await conn.getFile(thumbnail)
      b64 = thumbRes.data.toString('base64')
    } catch (e) {
      console.log('Error al procesar la miniatura:', e)
    }

    // Nuevo método usando relayMessage con extendedTextMessage y el preview "shadow"
    await conn.relayMessage(
      data.chat,
      {
        extendedTextMessage: {
          text: infoMessage,
          matchedText: url, // Vinculamos el texto de coincidencia al link real de YouTube
          description: `Duración: ${timestamp} • Canal: ${canal}`, // Descripción que aparecerá en el cuadro
          title: title, // Usamos el nombre del video como título
          previewType: 'shadow',
          jpegThumbnail: b64, // Pasamos el buffer en string de la portada
          contextInfo: {
            quotedMessage: m.message,
            participant: m.sender,
            stanzaId: m.key.id, // Aseguramos usar m.key.id (el ID real de baileys)
            remoteJid: data.chat,
            // Conservamos tu configuración del canal/newsletter
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: newsletterName,
              serverMessageId: -1
            }
          }
        }
      },
      { quoted: m }
    )

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