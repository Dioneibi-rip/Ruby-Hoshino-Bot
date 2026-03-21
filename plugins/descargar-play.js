import axios from 'axios'
import fs from 'fs'
import yts from 'yt-search'

const handler = async (m, { conn, args, usedPrefix, command }) => {

  if (!args[0]) {
    return conn.reply(
      m.chat,
      `🌾 *Ingresa el nombre o enlace de YouTube*\n\nEjemplo:\n${usedPrefix + command} yoasobi`,
      m
    )
  }

  try {

    await conn.sendMessage(m.chat, { react: { text: '🕔', key: m.key } })

    const q = args.join(" ")
    const search = await yts(q)
    const v = search.videos[0]

    if (!v) return conn.reply(m.chat, '*🪴 No se encontraron resultados*', m)

    const videoUrl = v.url
    const videoId = v.videoId

    const formatViews = (n) => {
      if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
      if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
      if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
      return n.toString()
    }

    const encabezado = `*┏━━━━❏*
┃ \`Título\`: *${v.title}*
┃ \`Autor\`: *${v.author.name}*
┃ \`Duración\`: *${v.timestamp}*
┃ \`Vistas\`: *${formatViews(v.views)}*
┃ \`Enlace\`: *${videoUrl}*
*┗━━❏*`

    await conn.sendMessage(
      m.chat,
      {
        image: { url: v.thumbnail },
        caption: encabezado
      },
      { quoted: m }
    )

    const validateUrl = async (url) => {
      if (!url || typeof url !== 'string') return null
      try {
        const res = await axios.head(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0'
          },
          timeout: 5000
        })
        return (res.status >= 200 && res.status < 400) ? url : null
      } catch {
        return null
      }
    }

    const getFastestAudio = async () => {

      try {
        const ryuResponse = await axios.get(`https://api.ryuzei.xyz/dl/ytmp3?url=${encodeURIComponent(videoUrl)}&key=Corvette`)
        const ryuLink = ryuResponse.data.url
        const ryuValid = await validateUrl(ryuLink)
        if (ryuValid) return ryuValid
      } catch {}

      const apiSources = [

        {
          name: 'BetaBotz',
          fn: () => axios
            .get(`https://api.betabotz.eu.org/api/download/ytmp3?url=${encodeURIComponent(videoUrl)}&apikey=Btz-b2H2x`)
            .then(r => r.data.result?.mp3 || r.data.result?.download?.url)
        },

        {
          name: 'Sylphy',
          fn: () => axios
            .get(`https://sylphy.xyz/download/v3/ytmp3?url=${videoId}&api_key=Killua-Wa`)
            .then(r => r.data.result?.download?.url || r.data.result?.url)
        },

        {
          name: 'Adonix',
          fn: () => axios
            .get(`https://api-adonix.ultraplus.click/download/ytaudio?apikey=Yuki-WaBot&url=${encodeURIComponent(videoUrl)}`)
            .then(r => r.data?.result?.url || r.data?.data?.url || r.data?.url)
        },

        {
          name: 'Vreden',
          fn: () => axios
            .get(`https://api.vreden.web.id/api/v1/download/youtube/audio?url=${encodeURIComponent(videoUrl)}`)
            .then(r => r.data.result?.download?.url)
        },

        {
          name: 'Stellar',
          fn: () => axios
            .get(`https://api.stellarwa.xyz/dl/ytdl?url=${encodeURIComponent(videoUrl)}&format=mp3&key=YukiWaBot`)
            .then(r => r.data.result?.download || r.data.result)
        }

      ]

      const errors = []

      for (const api of apiSources) {
        try {
          const link = await api.fn()
          const validLink = await validateUrl(link)
          if (validLink) return validLink
        } catch (e) {
          errors.push(`${api.name}: ${e.message}`)
        }
      }

      throw new Error(`Detalles:\n${errors.join('\n')}`)
    }

    const downloadUrl = await getFastestAudio()
    
    const img = fs.readFileSync('./menu-imagen/shiina.png')

    await conn.sendMessage(
      m.chat,
      {
        image: img,
        caption: "🎧 *Audio descargado, enviando archivo...*"
      },
      { quoted: m }
    )

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: downloadUrl },
        mimetype: 'audio/mpeg',
        fileName: `${v.title}.mp3`
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {

    await conn.reply(
      m.chat,
      `❌ *Error al descargar el audio*\n\n${e.message}`,
      m
    )

  }
}

handler.help = ['play']
handler.tags = ['descargas']
handler.command = ['play']

export default handler
