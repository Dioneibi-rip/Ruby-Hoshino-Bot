import Jimp from 'jimp'
import fetch from 'node-fetch'
import { sticker } from '../../lib/sticker.js'

const FINAL_SIZE = 512
const WORK_SIZE = 1024
const MAX_TEXT_LENGTH = 280
const BG_COLOR = '#FFFFFF'
const SAFE_MARGIN = 42
const MIN_BOTTOM_MARGIN = 32
const EMOJI_SCALE = 1.08
const BRAT_BLUR = 3
const TEXT_DENSITY_LIMIT = WORK_SIZE - SAFE_MARGIN - MIN_BOTTOM_MARGIN

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
  } catch (e) {
    emojiCache.set(emoji, null)
    return null
  }
}

async function buildToken(font, raw = '') {
  const lineHeight = Jimp.measureTextHeight(font, 'Ay', WORK_SIZE)

  if (isEmojiToken(raw)) {
    const emojiImg = await getEmojiImage(raw)
    if (emojiImg) {
      const size = Math.round(Math.max(76, Math.min(152, lineHeight * EMOJI_SCALE)))
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
    height: lineHeight,
  }
}

function getColumnCount(tokens = [], fontHeight = 0) {
  const textTokens = tokens.filter((token) => token.type === 'text')
  const shortTokens = textTokens.filter((token) => token.width <= fontHeight * 3.35).length
  const shortRatio = textTokens.length ? shortTokens / textTokens.length : 0

  if (tokens.length >= 9 && shortRatio >= 0.72) return 3
  if (tokens.length >= 7 && shortRatio >= 0.86) return 3
  return 2
}

function getColumnAnchors(columnCount = 2) {
  if (columnCount === 3) return [54, 395, 746]
  return [64, 586]
}

function getLineHeight(fontHeight = 0, rowsCount = 1) {
  const base = Math.round(fontHeight * 1.18)
  if (rowsCount <= 3) return Math.max(164, base)
  if (rowsCount <= 5) return Math.max(136, base)
  return Math.max(108, base)
}

function buildRows(tokens = [], columnCount = 2) {
  const rows = []

  for (let i = 0; i < tokens.length; i += columnCount) {
    rows.push(tokens.slice(i, i + columnCount))
  }

  return rows
}

function scoreLayout(rows = [], lineHeight = 0) {
  const filledCells = rows.reduce((total, row) => total + row.length, 0)
  const lastRowPenalty = rows.length > 1 && rows[rows.length - 1].length === 1 ? 0.45 : 0
  return rows.length * lineHeight + filledCells + lastRowPenalty
}

async function chooseLayout(rawTokens = []) {
  let bestLayout = null

  for (const fontPath of FONT_CANDIDATES) {
    const font = await Jimp.loadFont(fontPath)
    const tokens = []

    for (const raw of rawTokens) {
      // eslint-disable-next-line no-await-in-loop
      tokens.push(await buildToken(font, raw))
    }

    const fontHeight = Jimp.measureTextHeight(font, 'Ay', WORK_SIZE)
    const preferredColumns = getColumnCount(tokens, fontHeight)
    const columnOptions = preferredColumns === 3 ? [3, 2] : [2, 3]

    for (const columnCount of columnOptions) {
      const rows = buildRows(tokens, columnCount)
      const lineHeight = getLineHeight(fontHeight, rows.length)
      const contentHeight = rows.length * lineHeight
      const layout = {
        font,
        rows,
        lineHeight,
        columnAnchors: getColumnAnchors(columnCount),
        score: scoreLayout(rows, lineHeight),
      }

      if (contentHeight <= TEXT_DENSITY_LIMIT) return layout
      if (!bestLayout || layout.score < bestLayout.score) bestLayout = layout
    }
  }

  if (!bestLayout) {
    const fallbackFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
    const fallbackTokens = []
    for (const raw of rawTokens) {
      // eslint-disable-next-line no-await-in-loop
      fallbackTokens.push(await buildToken(fallbackFont, raw))
    }

    const rows = buildRows(fallbackTokens, 2).slice(0, 18)
    bestLayout = {
      font: fallbackFont,
      rows,
      lineHeight: Math.max(72, Jimp.measureTextHeight(fallbackFont, 'Ay', WORK_SIZE) + 18),
      columnAnchors: getColumnAnchors(2),
    }
  }

  return {
    ...bestLayout,
    rows: bestLayout.rows.slice(0, Math.max(1, Math.floor(TEXT_DENSITY_LIMIT / bestLayout.lineHeight))),
  }
}

function drawToken(layer, font, token, x, y) {
  if (!token) return

  if (token.type === 'emoji' && token.image) {
    layer.composite(token.image, Math.round(x), Math.round(y + 4))
    return
  }

  layer.print(font, Math.round(x), Math.round(y), token.text)
}

function getRowOffset(row = [], rowIndex = 0, rowsCount = 1) {
  if (row.length === 1 && rowsCount <= 2) return 0.38
  if (row.length === 1 && rowIndex % 3 === 1) return 0.16
  return 0
}

async function renderBratImage(text = '') {
  const cleanText = normalizeText(text)
  if (!cleanText) throw new Error('Texto vacío para generar sticker.')

  const rawTokens = splitWithEmoji(cleanText)
  if (!rawTokens.length) throw new Error('No se encontraron tokens para renderizar.')

  const { font, rows, lineHeight, columnAnchors } = await chooseLayout(rawTokens)

  const image = new Jimp(WORK_SIZE, WORK_SIZE, BG_COLOR)
  const textLayer = new Jimp(WORK_SIZE, WORK_SIZE, 0x00000000)

  const contentHeight = rows.length * lineHeight
  let y = Math.max(SAFE_MARGIN, Math.floor((WORK_SIZE - contentHeight) / 2) - 10)

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    const rowOffset = Math.round(getRowOffset(row, rowIndex, rows.length) * WORK_SIZE)

    for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
      const token = row[columnIndex]
      const anchor = columnAnchors[columnIndex] ?? columnAnchors[0]
      const x = Math.min(WORK_SIZE - token.width - SAFE_MARGIN, anchor + rowOffset)
      const tokenY = y + (token.type === 'emoji' ? Math.max(0, Math.round((lineHeight - token.height) * 0.24)) : 0)
      drawToken(textLayer, font, token, x, tokenY)
    }

    y += lineHeight
  }

  textLayer.blur(BRAT_BLUR)
  image.composite(textLayer, 0, 0)
  image.resize(FINAL_SIZE, FINAL_SIZE, Jimp.RESIZE_BILINEAR)
  image.blur(1)

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
