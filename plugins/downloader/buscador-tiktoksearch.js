import axios from 'axios'

const {
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  proto
} = (await import('@whiskeysockets/baileys')).default

let handler = async (m, { conn, text }) => {

  if (!text) {
    return conn.reply(
      m.chat,
      '🍟 *¿Qué deseas buscar en TikTok? Ingresa un texto.*',
      m
    )
  }

  const toFancy = str => {
    const map = {
      'a': 'ᥲ',
      'b': 'ᑲ',
      'c': 'ᥴ',
      'd': 'ᑯ',
      'e': 'ᥱ',
      'f': '𝖿',
      'g': 'g',
      'h': 'һ',
      'i': 'і',
      'j': 'j',
      'k': 'k',
      'l': 'ᥣ',
      'm': 'm',
      'n': 'ᥒ',
      'o': '᥆',
      'p': '⍴',
      'q': 'q',
      'r': 'r',
      's': 's',
      't': '𝗍',
      'u': 'ᥙ',
      'v': '᥎',
      'w': 'ɯ',
      'x': 'x',
      'y': 'ᥡ',
      'z': 'z'
    }

    return str
      .split('')
      .map(c => map[c] || c)
      .join('')
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }

  try {
    await m.react('🕒')

    let searchResults = []

    try {
      const { data: response } = await axios.post(
        'https://www.tikwm.com/api/feed/search',
        new URLSearchParams({
          keywords: text,
          count: 10
        }),
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      if (response.data?.videos) {
        searchResults = response.data.videos.map(v => ({
          title: v.title,
          cover: v.cover.startsWith('http')
            ? v.cover
            : `https://www.tikwm.com${v.cover}`,
          author: v.author.nickname,
          url: `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}`
        }))
      }
    } catch {}

    if (!searchResults.length) {
      try {
        const { data: response } = await axios.get(
          `https://api.bk9.site/search/tiktok?q=${encodeURIComponent(text)}`,
          { timeout: 10000 }
        )

        if (response.status && response.BK9) {
          searchResults = response.BK9.map(v => ({
            title: v.desc,
            cover: v.cover,
            author: v.author.nickname,
            url: `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}`
          }))
        }
      } catch {}
    }

    if (!searchResults.length) {
      return conn.reply(
        m.chat,
        '❌ No se encontraron videos. Las APIs de búsqueda están caídas temporalmente.',
        m
      )
    }

    shuffleArray(searchResults)

    const selectedResults = searchResults.slice(0, 5)

    const cards = []

    for (const result of selectedResults) {
      try {
        const imageResponse = await axios.get(result.cover, {
          responseType: 'arraybuffer',
          timeout: 15000
        })

        const mediaMessage = await prepareWAMessageMedia(
          {
            image: Buffer.from(imageResponse.data)
          },
          {
            upload: conn.waUploadToServer
          }
        )

        cards.push({
          body: proto.Message.InteractiveMessage.Body.fromObject({
            text: toFancy(
              result.title.length > 50
                ? result.title.substring(0, 50) + '...'
                : result.title
            )
          }),

          footer: proto.Message.InteractiveMessage.Footer.fromObject({
            text: `👤 ${result.author}`
          }),

          header: proto.Message.InteractiveMessage.Header.fromObject({
            title: toFancy('TikTok Video'),
            hasMediaAttachment: true,
            imageMessage: mediaMessage.imageMessage
          }),

          nativeFlowMessage:
            proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
              buttons: [
                {
                  name: 'cta_url',
                  buttonParamsJson: JSON.stringify({
                    display_text: '🔗 Ver en TikTok',
                    url: result.url,
                    merchant_url: result.url
                  })
                },
                {
                  name: 'cta_copy',
                  buttonParamsJson: JSON.stringify({
                    display_text: '📋 Copiar Enlace',
                    copy_code: result.url
                  })
                }
              ]
            })
        })
      } catch (e) {
        console.log('Error cargando portada:', e.message)
      }
    }

    if (!cards.length) {
      return conn.reply(
        m.chat,
        '❌ No se pudieron cargar las portadas.',
        m
      )
    }

    const message = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },

            interactiveMessage:
              proto.Message.InteractiveMessage.fromObject({
                body: {
                  text: `${toFancy('✦ Rᥱsᥙᥣ𝗍ᥲძ᥆s ძᥱ:')} ${text}\n_Desliza para ver más videos 👉_`
                },

                footer: {
                  text: '🔎 TikTok Search'
                },

                header: {
                  hasMediaAttachment: false
                },

                carouselMessage: {
                  cards
                }
              })
          }
        }
      },
      { quoted: m }
    )

    await conn.relayMessage(
      m.chat,
      message.message,
      {
        messageId: message.key.id
      }
    )

    await m.react('✅')

  } catch (e) {
    console.error(e)
    await m.react('❌')
  }
}

handler.help = ['tiktoksearch <texto>']
handler.tags = ['buscador']
handler.command = ['tiktoksearch', 'ttss', 'tiktoks']
handler.group = true
handler.register = true

export default handler