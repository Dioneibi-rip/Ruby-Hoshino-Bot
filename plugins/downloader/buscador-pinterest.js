import fetch from "node-fetch"
import baileys from "@whiskeysockets/baileys"

// Helper para envío de álbumes (sin cambios)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

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

// ========== NUEVO: Scraper directo de Pinterest ==========
async function pinterestScraper(query, limit = 10) {
  const url = `https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22scope%22%3A%22pins%22%2C%22rs%22%3A%22typed%22%7D%2C%22context%22%3A%7B%7D%7D`

  const headers = {
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
    'referer': 'https://id.pinterest.com/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    'x-app-version': 'c056fb7',
    'x-pinterest-appstate': 'active',
    'x-pinterest-pws-handler': 'www/index.js',
    'x-pinterest-source-url': '/',
    'x-requested-with': 'XMLHttpRequest'
  }

  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Pinterest respondió con estado ${res.status}`)
  
  const json = await res.json()
  if (!json.resource_response?.data?.results) return []

  const results = json.resource_response.data.results
    .map(item => {
      if (!item.images) return null
      // Prioridad: original > imagen mediana (400-600px) > pequeña
      const image_large = item.images.orig?.url || null
      const imageKeys = Object.keys(item.images)
      const mediumKey = imageKeys.find(k => /4\d{2}x|5\d{2}x|6\d{2}x/.test(k)) || imageKeys[0]
      const image_medium = item.images[mediumKey]?.url || null
      return {
        title: item.grid_title || item.title || 'Sin título',
        image_large_url: image_large,
        image_medium_url: image_medium,
        image_small_url: item.images['236x']?.url || null
      }
    })
    .filter(Boolean)

  return results.slice(0, limit)
}
// =========================================================

const handler = async (m, { conn, args, command, usedPrefix }) => {
  const rwait = global.rwait || "⏳"
  const done = global.done || "✅"
  const error = global.error || "❌"
  const dev = global.dev || ""

  if (!args[0]) {
    return conn.reply(m.chat, `☠️ Por favor, escribe qué quieres buscar en Pinterest.\nEjemplo: ${usedPrefix}${command} Luffy`, m)
  }

  const query = args.join(' ')
  const limit = 10

  try {
    await m.react(rwait)

    // Usamos el scraper directo en lugar de la API externa
    const images = await pinterestScraper(query, limit)

    if (images.length < 2) {
      await m.react(error)
      return conn.reply(m.chat, `☠️ No se encontraron suficientes imágenes para: *${query}*`, m)
    }

    const sendCount = Math.min(images.length, limit)

    const infoMessage =
      `⚓ *Pinterest Search*\n` +
      `✩̣̣̣̣̣ͯ┄•͙✧⃝•͙┄✩ͯ•͙͙✧⃝•͙͙✩ͯ\n` +
      `❍ *Búsqueda* › *${query}*\n` +
      `❍ *Resultados* › ${images.length} imágenes\n` +
      `❍ *Enviando* › ${sendCount} en álbum\n` +
      `──⇌••⇋──\n` +
      (dev ? dev + '\n' : '')

    await conn.reply(m.chat, infoMessage, m)

    // Construimos el array de imágenes usando la URL de mayor calidad disponible
    const albumImages = images.map(img => ({
      type: "image",
      data: { url: img.image_large_url || img.image_medium_url } // fallback si no hay original
    }))

    await sendAlbumMessage(conn, m.chat, albumImages, {
      caption: `⚓ Pinterest • ${query}`,
      quoted: m
    })

    await m.react(done)

  } catch (e) {
    console.error(e)
    await m.react(error)
    return conn.reply(m.chat, `☠️ Ocurrió un error al buscar en Pinterest.`, m)
  }
}

handler.help = ['pin', 'pinterest']
handler.tags = ['búsqueda']
handler.command = ['pin', 'pinterest', 'pins']
handler.group = true
handler.register = true

export default handler