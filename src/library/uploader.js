import { fileTypeFromBuffer } from './fileType.js'
import { bufferToBlob } from './http.js'

const CAUSAS_API_KEY = '0a31ae3baab4648871cead65f902b56234e02b500ea03f382941a68d15ba4385'

async function detectFile(buffer, mime) {
return await fileTypeFromBuffer(buffer) || { ext: String(mime || '').split('/')[1] || 'bin', mime: mime || 'application/octet-stream' }
}

function pickUrl(data) {
if (!data) return ''
if (typeof data === 'string') return /^https?:\/\//i.test(data) ? data : ''
return data.url || data.link || data.file || data.result?.url || data.result?.link || data.data?.url || data.data?.link || data.files?.[0]?.url || data.files?.[0]?.link || data.result?.files?.[0]?.url || ''
}

async function postForm(url, form, headers = {}) {
const res = await fetch(url, { method: 'POST', headers, body: form })
if (!res.ok) throw new Error(`HTTP ${res.status}`)
const text = await res.text()
try { return JSON.parse(text) } catch { return text }
}

function uploadResult(link, server) {
return { link, server, url: link, toString() { return link }, valueOf() { return link }, [Symbol.toPrimitive]() { return link } }
}

export function resolveUploadLink(result) {
return typeof result === 'string' ? result : result?.link || result?.url || ''
}

export async function uploadCausas(buffer, mime) {
const file = await detectFile(buffer, mime)
const form = new FormData()
const safeExt = String(file.ext || 'bin').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin'
form.append('file', bufferToBlob(buffer, file.mime), `ruby-${Date.now()}.${safeExt}`)
form.append('expiration', '30d')
const json = await postForm('https://cdn.apicausas.xyz/api/upload', form, { 'x-api-key': CAUSAS_API_KEY })
const url = json?.data?.url || pickUrl(json)
if (!url) throw new Error('causas upload failed')
return uploadResult(url, 'causas')
}

async function adofiles(buffer, mime) {
const file = await detectFile(buffer, mime)
const form = new FormData()
form.append('file', bufferToBlob(buffer, file.mime), `ruby.${file.ext}`)
const json = await postForm('https://cdn.adoolab.xyz/api/upload', form)
const url = pickUrl(json)
if (!url) throw new Error('adofiles upload failed')
return uploadResult(url, 'adofiles')
}

async function fare(buffer, mime) {
const file = await detectFile(buffer, mime)
const form = new FormData()
form.append('file', bufferToBlob(buffer, file.mime), `ruby.${file.ext}`)
const json = await postForm('https://u.fare.ink/api/upload', form)
const url = pickUrl(json)
if (!url) throw new Error('fare upload failed')
return uploadResult(url, 'fare')
}

async function uguu(buffer, mime) {
const file = await detectFile(buffer, mime)
const form = new FormData()
form.append('files[]', bufferToBlob(buffer, file.mime), `ruby.${file.ext}`)
const json = await postForm('https://uguu.se/upload.php', form)
const url = pickUrl(json) || json?.files?.[0]?.url
if (!url) throw new Error('uguu upload failed')
return uploadResult(url, 'uguu')
}

export async function uploadAuto(buffer, mime) {
let lastError
for (const upload of [uploadCausas, adofiles, fare, uguu]) {
try { return await upload(buffer, mime) } catch (error) { lastError = error }
}
throw lastError || new Error('upload failed')
}

export async function uploadImage(buffer, mime) {
return uploadAuto(buffer, mime)
}

export async function uploadFile(buffer, mime) {
return uploadAuto(buffer, mime)
}

export default uploadAuto
