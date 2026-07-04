import fetch from "node-fetch"
import baileys from "@whiskeysockets/baileys"

// Helper: delay personalizado (compatible con cualquier versión de Baileys)
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

const handler = async (m, { conn, args, command, usedPrefix }) => {
  // Definir valores por defecto para emojis/globales si no existen
  const rwait = global.rwait || "⏳"
  const done = global.done || "✅"
  const error = global.error || "❌"
  const dev = global.dev || ""   // evita ReferenceError

  if (!args[0]) {
    return conn.reply(m.chat, `☠️ Por favor, escribe qué quieres buscar en Pinterest.\nEjemplo: ${usedPrefix}${command} Luffy`, m)
  }

  const query = args.join(' ')
  const limit = 10

  try {
    await m.react(rwait)

    // Nueva API de Pinterest
    const response = await fetch(
      `https://api.alyacore.xyz/search/pinterest?query=${encodeURIComponent(query)}&limit=${limit}&key=LUFFY-GEAR6`
    )
    const json = await response.json()

    // Validación de la nueva estructura
    if (!json.status || !Array.isArray(json.data)) {
      throw new Error("La API no devolvió un formato válido")
    }

    if (json.data.length < 2) {
      await m.react(error)
      return conn.reply(m.chat, `☠️ No se encontraron suficientes imágenes para: *${query}*`, m)
    }

    const sendCount = Math.min(json.data.length, limit) // lo que realmente se enviará

    const infoMessage =
      `⚓ *Pinterest Search*\n` +
      `✩̣̣̣̣̣ͯ┄•͙✧⃝•͙┄✩ͯ•͙͙✧⃝•͙͙✩ͯ\n` +
      `❍ *Búsqueda* › *${query}*\n` +
      `❍ *Resultados* › ${json.data.length} imágenes\n` +
      `❍ *Enviando* › ${sendCount} en álbum\n` +
      `──⇌••⇋──\n` +
      (dev ? dev + '\n' : '')

    await conn.reply(m.chat, infoMessage, m)

    // Mapeo de imágenes: usa la URL en alta calidad (item.hd)
    const images = json.data.slice(0, limit).map(item => ({
      type: "image",
      data: { url: item.hd }
    }))

    await sendAlbumMessage(conn, m.chat, images, {
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
handler.coin = 2

export default handler