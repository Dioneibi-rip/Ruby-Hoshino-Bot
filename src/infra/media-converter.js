import { promises } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'
import { JSDOM } from 'jsdom'
import { bufferToBlob } from './http.js'

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    try {
      const tmpDir = join(process.cwd(), 'tmp')
      await promises.mkdir(tmpDir, { recursive: true })
      const tmp = join(tmpDir, `${Date.now()}.${ext}`)
      const out = `${tmp}.${ext2}`
      await promises.writeFile(tmp, buffer)
      spawn('ffmpeg', ['-y', '-i', tmp, ...args, out])
        .on('error', reject)
        .on('close', async (code) => {
          try {
            await promises.unlink(tmp)
            if (code !== 0) return reject(code)
            resolve({ data: await promises.readFile(out), filename: out, delete: () => promises.unlink(out) })
          } catch (e) { reject(e) }
        })
    } catch (e) { reject(e) }
  })
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
  const { document } = new JSDOM(await res.text()).window
  const form2 = new FormData()
  const obj = {}
  for (const input of document.querySelectorAll('form input[name]')) {
    obj[input.name] = input.value
    form2.append(input.name, input.value)
  }
  const res2 = await fetch(`https://ezgif.com/${type}/${obj.file}`, { method: 'POST', body: form2 })
  const { document: document2 } = new JSDOM(await res2.text()).window
  return new URL(document2.querySelector(selector).src, res2.url).toString()
}

const webp2mp4 = source => ezgifConvert(source, 'webp-to-mp4', 'div#output > p.outfile > video > source')
const webp2png = source => ezgifConvert(source, 'webp-to-png', 'div#output > p.outfile > img')

export { toAudio, toPTT, toVideo, ffmpeg, webp2mp4, webp2png }
