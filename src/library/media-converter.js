import { promises } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'

import { bufferToBlob } from './http.js'

async function removeTempFile(filename) {
  if (!filename) return
  await promises.unlink(filename).catch(() => {})
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args)
    child.on('error', reject)
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${command} terminó con código ${code}`)))
  })
}

async function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  let tmp
  let out
  let outputHandedOff = false
  try {
    const tmpDir = join(process.cwd(), 'tmp')
    await promises.mkdir(tmpDir, { recursive: true })
    tmp = join(tmpDir, `${Date.now()}.${ext}`)
    out = `${tmp}.${ext2}`
    await promises.writeFile(tmp, buffer)
    await runProcess('ffmpeg', ['-y', '-i', tmp, ...args, out])
    const data = await promises.readFile(out)
    outputHandedOff = true
    return { data, filename: out, delete: () => removeTempFile(out) }
  } finally {
    await removeTempFile(tmp)
    if (!outputHandedOff) await removeTempFile(out)
  }
}

function resizeImage(buffer, width, height, ext = 'jpg') {
  return ffmpeg(buffer, ['-vf', `scale=${width}:${height}`, '-frames:v', '1'], ext, 'jpg')
}

function generateProfilePicture(buffer) {
  return ffmpeg(buffer, ['-vf', "scale='if(gt(iw,ih),550,-2)':'if(gt(iw,ih),-2,650)'", '-frames:v', '1'], 'jpg', 'jpg')
}

function toPTT(buffer, ext) {
  return ffmpeg(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on'], ext, 'ogg')
}

function toAudio(buffer, ext) {
  return ffmpeg(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-compression_level', '10'], ext, 'opus')
}

function toVideo(buffer, ext) {
  return ffmpeg(buffer, ['-c:v', 'libx264', '-c:a', 'aac', '-ab', '128k', '-ar', '44100', '-crf', '32', '-preset', 'slow'], ext, 'mp4')
}

async function ezgifConvert(source, type, selector) {
  const form = new FormData()
  const isUrl = typeof source === 'string' && /^https?:\/\//.test(source)
  form.append('new-image-url', isUrl ? source : '')
  if (isUrl) form.append('new-image', '')
  else form.append('new-image', bufferToBlob(source, 'image/webp'), 'image.webp')
  const res = await fetch(`https://ezgif.com/${type}`, { method: 'POST', body: form })
  const html = await res.text()
  const form2 = new FormData()
  const obj = {}
  for (const match of html.matchAll(/<input\b[^>]*name=["']([^"']+)["'][^>]*>/gi)) {
    const tag = match[0]
    const name = match[1]
    const value = tag.match(/value=["']([^"']*)["']/i)?.[1] || ''
    obj[name] = value
    form2.append(name, value)
  }
  const res2 = await fetch(`https://ezgif.com/${type}/${obj.file}`, { method: 'POST', body: form2 })
  const html2 = await res2.text()
  const src = selector.includes('video')
    ? html2.match(/<source\b[^>]*src=["']([^"']+)["']/i)?.[1]
    : html2.match(/<img\b[^>]*src=["']([^"']+)["']/i)?.[1]
  if (!src) throw new Error('No se encontró el archivo convertido en ezgif')
  return new URL(src, res2.url).toString()
}

const webp2mp4 = source => ezgifConvert(source, 'webp-to-mp4', 'div#output > p.outfile > video > source')
const webp2png = source => ezgifConvert(source, 'webp-to-png', 'div#output > p.outfile > img')

export { toAudio, toPTT, toVideo, ffmpeg, resizeImage, generateProfilePicture, webp2mp4, webp2png }
