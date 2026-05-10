import Jimp from 'jimp'
import fetch from 'node-fetch'
import { sticker } from '../lib/sticker.js'

const FINAL_SIZE = 512
const WORK_SIZE = 1024
const MAX_TEXT_LENGTH = 280
const BG_COLOR = '#F2F2F2'
const TOKEN_GAP = 22

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

function splitWithEmoji(text = '') {
  // Separa emojis para poder renderizarlos como imagen.
  const expanded = text.replace(/(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu, ' $1 ')
  return expanded.split(' ').map((t) => t.trim()).filter(Boolean)
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
  } catch {
    emojiCache.set(emoji, null)
    return null
  }
}

async function buildToken(font, raw = '') {
  if (isEmojiToken(raw)) {
    const emojiImg = await getEmojiImage(raw)
    if (emojiImg) {
      const size = Math.max(66, Math.min(140, Jimp.measureTextHeight(font, 'Ay', WORK_SIZE) + 6))
      return {
        type: 'emoji',
        text: raw,
        width: size,
        height: size,
        image: emojiImg.clone().resize(size, size, Jimp.RESIZE_BILINEAR),
      }
    }
  }

  return {
    type: 'text',
    text: raw,
    width: Jimp.measureText(font, raw),
    height: Jimp.measureTextHeight(font, 'Ay', WORK_SIZE),
  }
}

function buildRows(tokens = []) {
  const rows = []
  let current = { left: null, right: null }

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]

    if (i > 0 && i % 8 === 5 && !current.left && !current.right) {
      rows.push({ center: tok })
      continue
    }

    if (!current.left) {
      current.left = tok
      continue
    }

    if (!current.right) {
      current.right = tok
      rows.push(current)
      current = { left: null, right: null }
    }
  }

  if (current.left || current.right) rows.push(current)
  return rows
}

async function chooseLayout(rawTokens = []) {
  for (const fontPath of FONT_CANDIDATES) {
    const font = await Jimp.loadFont(fontPath)
    const tokens = []

    for (const raw of rawTokens) {
      // eslint-disable-next-line no-await-in-loop
      tokens.push(await buildToken(font, raw))
    }

    const rows = buildRows(tokens)
    const lineHeight = Math.max(92, Jimp.measureTextHeight(font, 'Ay', WORK_SIZE) + 28)
    const contentHeight = rows.length * lineHeight

    if (contentHeight <= WORK_SIZE - 120) {
      return { font, rows, lineHeight }
    }
  }

  const fallbackFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
  const fallbackTokens = []
  for (const raw of rawTokens) {
    // eslint-disable-next-line no-await-in-loop
    fallbackTokens.push(await buildToken(fallbackFont, raw))
  }
  return {
    font: fallbackFont,
    rows: buildRows(fallbackTokens).slice(0, 18),
    lineHeight: Math.max(72, Jimp.measureTextHeight(fallbackFont, 'Ay', WORK_SIZE) + 18),
  }
}

function drawToken(layer, font, token, x, y) {
  if (!token) return

  if (token.type === 'emoji' && token.image) {
    layer.composite(token.image, x, y + 2)
    return
  }

  layer.print(font, x, y, token.text)
}

async function renderBratImage(text = '') {
  const cleanText = normalizeText(text)
  if (!cleanText) throw new Error('Texto vacío para generar sticker.')

  const rawTokens = splitWithEmoji(cleanText)
  if (!rawTokens.length) throw new Error('No se encontraron tokens para renderizar.')

  const { font, rows, lineHeight } = await chooseLayout(rawTokens)

  const image = new Jimp(WORK_SIZE, WORK_SIZE, BG_COLOR)
  const shadow = new Jimp(WORK_SIZE, WORK_SIZE, 0x00000000)
  const textLayer = new Jimp(WORK_SIZE, WORK_SIZE, 0x00000000)

  const leftX = 64
  const rightX = 586
  const centerX = 190
  const centerW = 640

  const contentHeight = rows.length * lineHeight
  let y = Math.max(56, Math.floor((WORK_SIZE - contentHeight) / 2))

  for (const row of rows) {
    if (row.center) {
      const token = row.center
      if (token.type === 'emoji' && token.image) {
        const cx = centerX + Math.floor((centerW - token.width) / 2)
        drawToken(shadow, font, token, cx + 6, y + 6)
        drawToken(textLayer, font, token, cx, y)
      } else {
        shadow.print(
          font,
          centerX + 6,
          y + 6,
          { text: token.text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_TOP },
          centerW,
          lineHeight,
        )
        textLayer.print(
          font,
          centerX,
          y,
          { text: token.text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_TOP },
          centerW,
          lineHeight,
        )
      }
    } else {
      if (row.left) {
        drawToken(shadow, font, row.left, leftX + 6, y + 6)
        drawToken(textLayer, font, row.left, leftX, y)
      }

      if (row.right) {
        const rightTokenX = rightX + (row.right.type === 'text' ? TOKEN_GAP : 0)
        drawToken(shadow, font, row.right, rightTokenX + 6, y + 6)
        drawToken(textLayer, font, row.right, rightTokenX, y)
      }
    }

    y += lineHeight
  }

  shadow.blur(3).opacity(0.24)
  textLayer.blur(1)

  image.composite(shadow, 0, 0)
  image.composite(textLayer, 0, 0)
  image.resize(FINAL_SIZE, FINAL_SIZE, Jimp.RESIZE_BILINEAR)

  return image.getBufferAsync(Jimp.MIME_PNG)
}

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
      { text: `${emoji} Por favor ingresa el texto para hacer un sticker brat.` },
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
      { text: `${msm} Ocurrió un error al generar el sticker brat.` },
      { quoted: m },
    )
  }
}

handler.command = ['brat']
handler.tags = ['sticker']
handler.help = ['brat *<texto>*']

export default handler