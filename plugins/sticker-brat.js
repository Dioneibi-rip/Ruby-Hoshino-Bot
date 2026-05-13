import Jimp from 'jimp'
import fetch from 'node-fetch'
import { sticker } from '../lib/sticker.js'

const FINAL_SIZE = 512
const WORK_SIZE = 1024
const MAX_TEXT_LENGTH = 280
const BG_COLOR = '#F2F2F2' // Gris muy claro para fondo
const SHADOW_COLOR = 0x20202050 // Sombra oscura con alfa, muy difuminada
const TEXT_COLOR = 0x000000FF // Texto negro sólido

const FONT_CANDIDATES = [
  Jimp.FONT_SANS_128_BLACK,
  Jimp.FONT_SANS_64_BLACK,
  Jimp.FONT_SANS_32_BLACK,
]

const emojiCache = new Map()

function normalizeText(text = '') {
  return text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_LENGTH)
}

function isEmojiToken(token = '') {
  return /\p{Extended_Pictographic}/u.test(token)
}

function emojiToCodePoints(emoji = '') {
  return [...emoji]
    .map((char) => char.codePointAt(0))
    .filter((cp) => cp !== 0xfe0f) // variation selector
    .map((cp) => cp.toString(16))
    .join('-')
}

async function getEmojiImage(emoji = '') {
  if (emojiCache.has(emoji)) return emojiCache.get(emoji)

  const code = emojiToCodePoints(emoji)
  if (!code) return null

  // Twemoji (72x72 PNG)
  const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${code}.png`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`emoji status ${res.status}`)
    const buf = await res.buffer()
    const img = await Jimp.read(buf)
    emojiCache.set(emoji, img)
    return img
  } catch (e) {
    emojiCache.set(emoji, null)
    return null
  }
}

// Nueva función para agrupar palabras y emojis en tokens útiles para el scatter layout
async function buildChunks(font, text = '') {
  const wordsRaw = text.split(' ').filter(Boolean)
  const chunks = []
  let currentWords = []
  
  const measureText = (txt) => Jimp.measureText(font, txt)
  const measureTextHeight = () => Jimp.measureTextHeight(font, 'Ay', WORK_SIZE)

  for (let raw of wordsRaw) {
    if (isEmojiToken(raw)) {
      if (currentWords.length) {
        const textToMeasure = currentWords.join(' ')
        chunks.push({
          type: 'text',
          text: textToMeasure,
          width: measureText(textToMeasure),
          height: measureTextHeight(),
        })
        currentWords = []
      }
      
      const emojiImg = await getEmojiImage(raw)
      if (emojiImg) {
        const size = Math.max(66, Math.min(140, measureTextHeight() + 6))
        chunks.push({
          type: 'emoji',
          text: raw,
          width: size,
          height: size,
          image: emojiImg.clone().resize(size, size, Jimp.RESIZE_BILINEAR),
        })
      }
    } else {
      currentWords.push(raw)
      // Agrupar palabras si son pocas, si son muchas o muy largas, forzar el final del chunk
      if (currentWords.length > 3 || measureText(currentWords.join(' ')) > WORK_SIZE * 0.7) {
        const textToMeasure = currentWords.join(' ')
        chunks.push({
          type: 'text',
          text: textToMeasure,
          width: measureText(textToMeasure),
          height: measureTextHeight(),
        })
        currentWords = []
      }
    }
  }

  if (currentWords.length) {
    const textToMeasure = currentWords.join(' ')
    chunks.push({
      type: 'text',
      text: textToMeasure,
      width: measureText(textToMeasure),
      height: measureTextHeight(),
    })
  }

  return chunks
}

// Nueva función para el diseño totalmente aleatorio de scatter
function scatterLayout(chunks = []) {
  const minPadding = 48
  const maxInitialY = WORK_SIZE * 0.15 // Iniciar cerca de la parte superior
  const verticalGapRaw = 90 // Base para el espacio vertical entre elementos
  const marginPerToken = 10 // Margen de separación de seguridad
  const scatterTokens = []

  let nextYBase = maxInitialY + verticalGapRaw

  // Ordenar de forma aleatoria los trozos de texto para máxima aleatoriedad
  const shuffledChunks = [...chunks].sort(() => 0.5 - Math.random())

  for (let i = 0; i < shuffledChunks.length; i++) {
    const chunk = shuffledChunks[i]
    
    // Ancho aleatorio dentro del lienzo (con padding)
    const availableWidth = WORK_SIZE - chunk.width - (minPadding * 2)
    const randomX = minPadding + Math.floor(Math.random() * availableWidth)
    
    // Y aleatorio con un incremento base para evitar solapamientos masivos
    const randomYGap = (Math.random() * verticalGapRaw * 2.5) - (verticalGapRaw * 0.5) // Variación mas grande
    const randomY = Math.floor(nextYBase + randomYGap)

    scatterTokens.push({ ...chunk, x: randomX, y: randomY })

    // Actualizar la base para el siguiente Y
    nextYBase = randomY + chunk.height + marginPerToken
  }

  return scatterTokens
}

// Nueva función para deformación de perspectiva (Warp) aleatoria
async function applyRandomWarp(image) {
  // Crear un lienzo temporal para el warp
  const warped = new Jimp(WORK_SIZE, WORK_SIZE, 0x00000000)

  // Factor de warp aleatorio, muy pequeño, solo para un toque de distorsión
  const warpFactor = 0.04
  const randomTopLeft = (Math.random() - 0.5) * warpFactor
  const randomBottomRight = (Math.random() - 0.5) * warpFactor
  const randomScale = 0.98 + (Math.random() * 0.04)

  // Aplicar un perspective transform simple para dar profundidad
  const src = [0, 0, WORK_SIZE, 0, WORK_SIZE, WORK_SIZE, 0, WORK_SIZE]
  const dest = [
    randomTopLeft * WORK_SIZE, randomTopLeft * WORK_SIZE, 
    WORK_SIZE * randomScale, randomBottomRight * WORK_SIZE, 
    WORK_SIZE, WORK_SIZE, 
    0, WORK_SIZE
  ]

  // Una manera simple de hacer un perspective transform en Jimp: redimensionar con perspectiva
  // Esto es complejo sin bibliotecas dedicadas, usaremos una aproximación con escalado y desplazamiento.
  // El verdadero warp de perspectiva no está en el API básico de Jimp. Usaremos una aproximación visual con escala y distorsión.
  const tempWarped = image.clone().scale(0.98, Jimp.RESIZE_BILINEAR)
  const offsetX = Math.floor((WORK_SIZE - tempWarped.getWidth()) / 2)
  const offsetY = Math.floor((WORK_SIZE - tempWarped.getHeight()) / 2)
  
  warped.composite(tempWarped, offsetX, offsetY)
  return warped
}

async function renderBratImage(text = '') {
  const cleanText = normalizeText(text)
  if (!cleanText) throw new Error('Texto vacío para generar sticker.')

  let bestLayout = null
  for (const fontPath of FONT_CANDIDATES) {
    const font = await Jimp.loadFont(fontPath)
    const chunks = await buildChunks(font, cleanText)
    const scattered = scatterLayout(chunks)
    
    // Verificar si el contenido cabe en la altura del lienzo
    const maxItemY = scattered.reduce((max, t) => Math.max(max, t.y + t.height), 0)
    if (maxItemY <= WORK_SIZE - 100) {
      bestLayout = { font, scattered }
      break
    }
  }

  // Fallback a fuente pequeña y diseño original si el scattered no cabe
  if (!bestLayout) {
    const fallbackFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
    const chunks = await buildChunks(fallbackFont, cleanText)
    // Usar un diseño híbrido para fallback, más denso pero aún aleatorio
    bestLayout = { font: fallbackFont, scattered: scatterLayout(chunks) }
  }

  const { font, scattered } = bestLayout

  const image = new Jimp(WORK_SIZE, WORK_SIZE, BG_COLOR)
  const contentLayer = new Jimp(WORK_SIZE, WORK_SIZE, 0x00000000)

  // Dibujar todo el contenido en una capa transparente
  for (const token of scattered) {
    if (token.type === 'emoji' && token.image) {
      contentLayer.composite(token.image, token.x, token.y + 2)
    } else {
      contentLayer.print(font, token.x, token.y, token.text)
    }
  }

  // APLICAR EL WARP DE PERSPECTIVA (aproximado)
  const warpedContent = await applyRandomWarp(contentLayer)

  // CREAR EFECTO BRAT DE PROFUNDIDAD
  // Capa para la sombra (profundidad)
  const depthLayer = warpedContent.clone()
  
  // 1. Desplazar ligeramente hacia abajo y a la derecha
  depthLayer.composite(warpedContent, 8, 8)
  
  // 2. Colorear la sombra (oscura pero translúcida) y difuminar para suavidad
  depthLayer.color([{ apply: 'xor', params: [BG_COLOR] }, { apply: 'xor', params: [SHADOW_COLOR] }]) // Aproximación
  depthLayer.blur(4).opacity(0.35)

  // 3. CAPA DE TEXTO PRINCIPAL: Suave pero visible
  const mainTextLayer = warpedContent.clone().blur(1) // Ligero desenfoque para efecto "soft toy"

  // COMPOSICIÓN FINAL
  // 1. Dibujar sombra (profundidad)
  image.composite(depthLayer, 0, 0)
  
  // 2. Dibujar texto principal sobre la sombra
  image.composite(mainTextLayer, 0, 0)

  // REDIMENSIONAR A TAMAÑO FINAL
  image.resize(FINAL_SIZE, FINAL_SIZE, Jimp.RESIZE_BILINEAR)

  return image.getBufferAsync(Jimp.MIME_PNG)
}

// El resto de funciones no cambian
async function makeBratSticker(text, packname, author) {
  const pngBuffer = await renderBratImage(text)
  const result = await sticker(pngBuffer, false, packname, author)

  if (!result) throw new Error('No se pudo renderizar el sticker.')
  return result
}

let handler = async (m, { conn, text }) => {
  if (!text) {
    return conn.sendMessage(
      m.chat,
      { text: `Por favor ingresa el texto para hacer un sticker brat.` },
      { quoted: m },
    )
  }

  try {
    await m.react?.('🕒')

    const userId = m.sender
    const packstickers = global.db.data.users[userId] || {}
    const texto1 = packstickers.text1 || global.packsticker
    const texto2 = packstickers.text2 || global.packsticker2

    const stiker = await makeBratSticker(text, texto1, texto2)
    await conn.sendFile(m.chat, stiker, 'brat.webp', '', m)
    await m.react?.('✅')
  } catch (error) {
    console.error('BRAT_STICKER_ERROR:', error)
    await m.react?.('✖️')
    return conn.sendMessage(
      m.chat,
      { text: `Ocurrió un error al generar el sticker brat.` },
      { quoted: m },
    )
  }
}

handler.command = ['brat']
handler.tags = ['sticker']
handler.help = ['brat *<texto>*']

export default handler
