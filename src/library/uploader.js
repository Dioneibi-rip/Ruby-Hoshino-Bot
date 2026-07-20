import { fileTypeFromBuffer } from 'file-type'
import { bufferToBlob } from './http.js'

async function detectFile(buffer) {
  return await fileTypeFromBuffer(buffer) || { ext: 'bin', mime: 'application/octet-stream' }
}

export async function uploadImage(buffer) {
  const { ext, mime } = await detectFile(buffer)
  const form = new FormData()
  form.append('files[]', bufferToBlob(buffer, mime), `tmp.${ext}`)
  const res = await fetch('https://qu.ax/upload.php', { method: 'POST', body: form })
  const result = await res.json()
  if (result?.success && result.files?.[0]?.url) return result.files[0].url
  throw new Error('Failed to upload the file to qu.ax')
}

async function fileIO(buffer) {
  const { ext, mime } = await detectFile(buffer)
  const form = new FormData()
  form.append('file', bufferToBlob(buffer, mime), `tmp.${ext}`)
  const res = await fetch('https://file.io/?expires=1d', { method: 'POST', body: form })
  const json = await res.json()
  if (!json.success) throw json
  return json.link
}

async function RESTfulAPI(input) {
  const form = new FormData()
  const buffers = Array.isArray(input) ? input : [input]
  for (const buffer of buffers) form.append('file', bufferToBlob(buffer))
  const res = await fetch('https://storage.restfulapi.my.id/upload', { method: 'POST', body: form })
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return Array.isArray(input) ? json.files.map(file => file.url) : json.files[0].url
  } catch {
    throw text
  }
}

export async function uploadFile(input) {
  let err = false
  for (const upload of [RESTfulAPI, fileIO]) {
    try { return await upload(input) } catch (error) { err = error }
  }
  if (err) throw err
}

export default uploadFile
