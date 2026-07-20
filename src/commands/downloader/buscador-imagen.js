import baileys from "@whiskeysockets/baileys"
import { enqueueMediaJob, getMediaQueueConnection } from "../../library/queue.js"
import axios from '../../library/http.js'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Función para generar y transmitir el álbum de Baileys
async function sendAlbumMessage(conn, jid, medias, options = {}) {
  if (typeof jid !== "string") throw new TypeError(`jid debe ser string, se recibió: ${jid}`)
  if (medias.length < 2) throw new RangeError("Se necesitan al menos 2 imágenes para un álbum")
  const caption = options.text || options.caption || ""
  const delayMs = !isNaN(options.delay) ? options.delay : 500
  const quoted = options.quoted || null
  delete options.text
  delete options.caption
  delete options.delay
  delete options.quoted

  const album = baileys.generateWAMessageFromContent(
    jid,
    { messageContextInfo: {}, albumMessage: { expectedImageCount: medias.length } },
    quoted ? { quoted } : {}
  )
  await conn.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id })

  for (let i = 0; i < medias.length; i++) {
    const { type, data } = medias[i]
    const img = await baileys.generateWAMessage(
      album.key.remoteJid,
      { [type]: data, ...(i === 0 ? { caption } : {}) },
      { upload: conn.waUploadToServer }
    )
    img.message.messageContextInfo = {
      messageAssociation: { associationType: 1, parentMessageKey: album.key }
    }
    await conn.relayMessage(img.key.remoteJid, img.message, { messageId: img.key.id })
    await delay(delayMs)
  }
  return album
}

// Registro del manejador de la cola para este comando
function registerImageAlbumQueueHandler() {
  global.queueHandlers ||= new Map()
  if (global.queueHandlers.has("image:album")) return
  global.queueHandlers.set("image:album", async ({ jid, medias, options = {} }) => {
    const activeConn = getMediaQueueConnection()
    if (!activeConn) throw new Error("No hay conexión activa para la cola multimedia")
    await sendAlbumMessage(activeConn, jid, medias, options)
  })
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const rwait = '⏳'
  
  if (!text) {
    return conn.reply(m.chat, ` ׄ᱉᱉ Por favor, ingresa un término. ✧ 𝗘j𝗲m𝗽l𝗼: ${usedPrefix + command} paisajes naturales`, m)
  }
  
  await m.react(rwait)
  await conn.reply(m.chat, ' 🌿 ׄ ⢟ 𝗕𝘂𝘀𝗰𝗮𝗻𝗱𝗼 𝗹𝗮𝘀 𝗳𝗼𝘁𝗶𝘁𝗼𝘀 𝗺á𝘀 𝗹𝗶𝗻𝗱𝗮𝘀, 𝗲𝘀𝗽𝗲𝗿𝗲 𝘂𝗻 𝗺𝗼𝗺𝗲𝗻𝘁𝗼... 𞋬 🌱', m)
  
  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(text)}`
    
    // Petición con tu librería axios personalizada
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9'
      },
      responseType: 'text'
    })
    
    const html = response.data
    const images = []
    
    const regexList = [
      /"murl":"([^"]+)"/g,
      /murl&quot;:&quot;([^&]+)&quot;/g,
      /"(https?:\/\/[^"]+?\.(?:jpe?g|png))"/gi
    ]

    for (const regex of regexList) {
      let match
      while ((match = regex.exec(html)) !== null && images.length < 4) {
        if (!images.includes(match[1])) {
          images.push(match[1])
        }
      }
      if (images.length >= 4) break
    }
    
    // Baileys requiere mínimo 2 imágenes para crear un álbum válido
    if (images.length < 2) {
      await m.react('❌')
      return conn.reply(m.chat, `*🍂 No logré encontrar suficientes imágenes para:* ${text}`, m)
    }
    
    // Mapeamos las imágenes al formato que requiere el creador de álbumes
    const albumImages = images.map(imgUrl => ({
      type: "image",
      data: { url: imgUrl }
    }))

    // Encolamos el trabajo de envío multimedia
    registerImageAlbumQueueHandler()
    await enqueueMediaJob("image:album", {
      jid: m.chat,
      medias: albumImages,
      options: {
        caption: `⪛✰ ɪᴍᴀɢᴇɴ - ʙᴜsǫᴜᴇᴅᴀ ✰⪜\n🌿 *Resultado de:* ${text}`,
        quoted: m
      }
    }, { conn })
    
    await m.react('✅')
    
  } catch (error) {
    console.error(error)
    await m.react('✖️')
    conn.reply(m.chat, '*🥀 Ocurrió un error de conexión al buscar las imágenes. Intenta con otra palabra.*', m)
    return false
  }
}

handler.help = ['imagen <texto>']
handler.tags = ['buscador', 'tools', 'descargas']
handler.command = ['image', 'imagen', 'img']
handler.register = true

export default handler