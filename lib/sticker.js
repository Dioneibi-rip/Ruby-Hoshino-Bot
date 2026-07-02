import { Sticker } from 'wa-sticker-formatter'
import fetch from 'node-fetch'
import { fileTypeFromBuffer } from 'file-type'
import { randomUUID } from 'crypto'
import { tmpdir } from 'os'
import { join } from 'path'
import { promises as fs } from 'fs'
import { spawn } from 'child_process'

const MAX_INPUT_BYTES = 8 * 1024 * 1024

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
if (!Buffer.isBuffer(buffer) || buffer.length < 256) throw new Error('Archivo multimedia vacío o corrupto')
const type = await fileTypeFromBuffer(buffer)
if (!type || !/^(image|video)\//.test(type.mime)) throw new Error('Formato multimedia inválido')
return type
}

function runFfmpeg(args) {
return new Promise((resolve, reject) => {
const ff = spawn('ffmpeg', args)
let stderr = ''
ff.stderr.on('data', chunk => stderr += chunk.toString())
ff.on('error', reject)
ff.on('close', code => code === 0 ? resolve() : reject(new Error(stderr || `ffmpeg falló con código ${code}`)))
})
}

async function convertWithFfmpeg(buffer, type) {
const id = randomUUID()
const input = join(tmpdir(), `${id}.${type.ext || 'bin'}`)
const output = join(tmpdir(), `${id}.webp`)
await fs.writeFile(input, buffer)
try {
const common = ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-vf', 'scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:-1:-1:color=0x00000000,fps=15', '-loop', '0', '-an', '-vsync', '0']
await runFfmpeg([...common, '-c:v', 'libwebp', '-lossless', '0', '-compression_level', '6', '-q:v', buffer.length > MAX_INPUT_BYTES ? '55' : '70', output])
return await fs.readFile(output)
} finally {
await fs.rm(input, { force: true }).catch(() => {})
await fs.rm(output, { force: true }).catch(() => {})
}
}

async function convertWithFormatter(buffer, packname, author, categories) {
const st = new Sticker(buffer, { pack: packname, author, type: 'full', categories, quality: buffer.length > MAX_INPUT_BYTES ? 50 : 70 })
return await st.toBuffer()
}

async function sticker(img, url, packname = '', author = '', categories = ['']) {
const input = await readInput(img, url)
const type = await assertMedia(input)
let webp
try {
webp = await convertWithFfmpeg(input, type)
webp = await addExif(webp, packname, author, categories)
} catch (error) {
webp = await convertWithFormatter(input, packname, author, categories)
}
if (!Buffer.isBuffer(webp) || webp.length < 256) throw new Error('No se pudo generar el sticker')
return webp
}

async function addExif(buffer, packname = '', author = '', categories = ['']) {
const st = new Sticker(buffer, { pack: packname, author, type: 'full', categories, quality: 70 })
return await st.toBuffer()
}

export { sticker, addExif }
