import { randomBytes, randomUUID } from 'crypto'
import { tmpdir } from 'os'
import { join } from 'path'
import { promises as fs } from 'fs'
import { spawn } from 'child_process'
import { fileTypeFromBuffer } from './fileType.js'

const MAX_INPUT_BYTES = 8 * 1024 * 1024
const MAX_CONCURRENT_STICKERS = Math.max(1, Number.parseInt(process.env.STICKER_CONCURRENCY || '1', 10))
let activeStickerJobs = 0
const stickerWaiters = []

async function runStickerJob(task) {
  if (activeStickerJobs >= MAX_CONCURRENT_STICKERS) await new Promise(resolve => stickerWaiters.push(resolve))
  activeStickerJobs += 1
  try { return await task() } finally { activeStickerJobs -= 1; stickerWaiters.shift()?.() }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    ff.stderr.on('data', chunk => { stderr += chunk.toString() })
    ff.on('error', reject)
    ff.on('close', code => code === 0 ? resolve() : reject(new Error(stderr || `ffmpeg falló con código ${code}`)))
  })
}

async function readInput(img, url) {
  if (url && !img) {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } })
    if (!r.ok) throw new Error('No se pudo descargar la imagen')
    return Buffer.from(await r.arrayBuffer())
  }
  if (Buffer.isBuffer(img)) return img
  if (img instanceof ArrayBuffer) return Buffer.from(img)
  if (ArrayBuffer.isView(img)) return Buffer.from(img.buffer, img.byteOffset, img.byteLength)
  throw new Error('Imagen inválida')
}

async function assertMedia(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 16) throw new Error('Archivo multimedia vacío o corrupto')
  const type = await fileTypeFromBuffer(buffer)
  if (!type || !/^(image|video)\//.test(type.mime)) throw new Error('Formato multimedia inválido')
  return type
}

export function buildExif({ pack = '', author = '', categories = [], id = randomBytes(32).toString('hex') } = {}) {
  const rawCategories = Array.isArray(categories) ? categories : [categories]
  const data = JSON.stringify({
    'sticker-pack-id': id,
    'sticker-pack-name': pack,
    'sticker-pack-publisher': author,
    emojis: rawCategories.filter(Boolean),
    'android-app-store-link': 'https://play.google.com/store/apps/details?id=com.termux',
    'ios-app-store-link': 'https://itunes.apple.com/app/sticker-maker-studio/id1443326857'
  })
  const json = Buffer.from(data, 'utf8')
  const header = Buffer.from([0x49,0x49,0x2a,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00])
  header.writeUIntLE(json.length, 14, 4)
  return Buffer.concat([header, json])
}

function makeChunk(type, payload) {
  const header = Buffer.alloc(8)
  header.write(type, 0, 4, 'ascii')
  header.writeUInt32LE(payload.length, 4)
  return payload.length % 2 ? Buffer.concat([header, payload, Buffer.from([0])]) : Buffer.concat([header, payload])
}

function parseChunks(webp) {
  if (webp.slice(0, 4).toString() !== 'RIFF' || webp.slice(8, 12).toString() !== 'WEBP') throw new Error('WebP inválido')
  const chunks = []
  for (let offset = 12; offset + 8 <= webp.length;) {
    const type = webp.slice(offset, offset + 4).toString('ascii')
    const size = webp.readUInt32LE(offset + 4)
    const start = offset + 8
    const end = start + size
    if (end > webp.length) break
    chunks.push({ type, payload: webp.slice(start, end) })
    offset = end + (size % 2)
  }
  return chunks
}

function ensureVp8x(chunks) {
  if (chunks[0]?.type === 'VP8X') return chunks
  const image = chunks.find(chunk => chunk.type === 'VP8 ' || chunk.type === 'VP8L')
  const vp8x = Buffer.alloc(10)
  if (image?.type === 'VP8 ') {
    const idx = image.payload.indexOf(Buffer.from([0x9d, 0x01, 0x2a]))
    if (idx !== -1 && idx + 10 <= image.payload.length) {
      vp8x.writeUIntLE((image.payload.readUInt16LE(idx + 3) & 0x3fff) - 1, 4, 3)
      vp8x.writeUIntLE((image.payload.readUInt16LE(idx + 5) & 0x3fff) - 1, 7, 3)
    }
  } else if (image?.type === 'VP8L' && image.payload.length >= 5) {
    const bits = image.payload.readUInt32LE(1)
    const width = (bits & 0x3fff) + 1
    const height = ((bits >> 14) & 0x3fff) + 1
    vp8x.writeUIntLE(width - 1, 4, 3)
    vp8x.writeUIntLE(height - 1, 7, 3)
  }
  return [{ type: 'VP8X', payload: vp8x }, ...chunks]
}

export function injectExif(webpBuffer, exifBuffer) {
  const chunks = ensureVp8x(parseChunks(webpBuffer)).filter(chunk => chunk.type !== 'EXIF')
  const vp8x = chunks.find(chunk => chunk.type === 'VP8X')
  if (vp8x) vp8x.payload[0] |= 0b00001000
  const insertAt = Math.max(1, chunks.findIndex(chunk => chunk.type === 'VP8 ' || chunk.type === 'VP8L' || chunk.type === 'ANIM'))
  chunks.splice(insertAt === 0 ? 1 : insertAt, 0, { type: 'EXIF', payload: exifBuffer })
  const body = Buffer.concat([Buffer.from('WEBP'), ...chunks.map(chunk => makeChunk(chunk.type, chunk.payload))])
  const riff = Buffer.alloc(8)
  riff.write('RIFF', 0, 4, 'ascii')
  riff.writeUInt32LE(body.length, 4)
  const finalBuffer = Buffer.concat([riff, body])
  finalBuffer.writeUInt32LE(finalBuffer.length - 8, 4)
  return finalBuffer
}

export async function convertToWebp(buffer, type) {
  const id = randomUUID()
  const input = join(tmpdir(), `${id}.${type.ext || 'bin'}`)
  const output = join(tmpdir(), `${id}.webp`)
  await fs.writeFile(input, buffer)
  try {
    const vf = 'scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:-1:-1:color=0x00000000,fps=15'
    await runFfmpeg(['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-vf', vf, '-loop', '0', '-an', '-vsync', '0', '-c:v', 'libwebp', '-lossless', '0', '-compression_level', '6', '-q:v', buffer.length > MAX_INPUT_BYTES ? '55' : '70', '-f', 'webp', output])
    return await fs.readFile(output)
  } finally {
    await fs.rm(input, { force: true }).catch(() => {})
    await fs.rm(output, { force: true }).catch(() => {})
  }
}

export async function sticker(img, url, packname = '', author = '', categories = ['']) {
  return runStickerJob(async () => {
    try {
      const input = await readInput(img, url)
      const type = await assertMedia(input)
      const webp = type.mime === 'image/webp' ? input : await convertToWebp(input, type)
      return injectExif(webp, buildExif({ pack: packname, author, categories }))
    } catch (error) {
      throw new Error(error?.message || 'No se pudo generar el sticker')
    }
  })
}

export async function addExif(buffer, packname = '', author = '', categories = ['']) {
  return runStickerJob(async () => {
    try {
      const input = await readInput(buffer)
      const type = await assertMedia(input)
      const webp = type.mime === 'image/webp' ? input : await convertToWebp(input, type)
      return injectExif(webp, buildExif({ pack: packname, author, categories }))
    } catch (error) {
      throw new Error(error?.message || 'No se pudo agregar metadatos al sticker')
    }
  })
}
