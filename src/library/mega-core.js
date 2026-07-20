import crypto from 'crypto'

const MEGA_API = 'https://g.api.mega.co.nz/cs'
const MAX_BUFFER_SIZE = 300 * 1024 * 1024
let requestId = Math.floor(Math.random() * 1e10)

function decodeMegaBase64(value = '') {
const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/')
return Buffer.from(normalized + '==='.slice((normalized.length + 3) % 4), 'base64')
}

function unmergeKeyMac(key) {
const next = Buffer.alloc(32)
key.copy(next)
for (let i = 0; i < 16; i++) next[i] = next[i] ^ next[16 + i]
return next
}

function decryptAesCbcZero(buffer, key) {
const decipher = crypto.createDecipheriv('aes-128-cbc', key, Buffer.alloc(16))
decipher.setAutoPadding(false)
return Buffer.concat([decipher.update(buffer), decipher.final()])
}

function parseAttributes(buffer) {
let end = 0
while (end < buffer.length && buffer[end]) end++
const text = buffer.slice(0, end).toString()
if (!text.startsWith('MEGA{')) throw new Error('No se pudieron descifrar los metadatos de MEGA')
return JSON.parse(text.slice(4))
}

function parseMegaUrl(input) {
const url = new URL(input)
if (!['mega.nz', 'mega.co.nz'].includes(url.hostname)) throw new Error('El enlace no pertenece a MEGA')
if (url.pathname.includes('/folder/')) throw new Error('Solo se soportan enlaces directos a archivos de MEGA')
if (url.pathname.includes('/file/')) {
const id = url.pathname.split('/file/')[1]?.split('/')[0]
const key = url.hash.slice(1).split('/')[0]
if (!id || !key) throw new Error('El enlace de MEGA no contiene id o llave')
return { id, key }
}
const hash = url.hash.split('!')
if (hash[0] !== '#' || !hash[1] || !hash[2]) throw new Error('Formato de enlace MEGA no reconocido')
return { id: hash[1], key: hash[2] }
}

async function megaRequest(payload) {
requestId++
const res = await fetch(`${MEGA_API}?id=${requestId}`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify([payload])
})
if (!res.ok) throw new Error(`MEGA respondió HTTP ${res.status}`)
const data = await res.json()
const body = Array.isArray(data) ? data[0] : data
if (typeof body === 'number' && body < 0) throw new Error(`MEGA API error ${body}`)
return body
}

export async function getMegaFileInfo(link) {
const { id, key } = parseMegaUrl(link)
const fileKey = decodeMegaBase64(key)
if (fileKey.length !== 32) throw new Error('La llave del archivo MEGA no tiene el formato esperado')
const response = await megaRequest({ a: 'g', p: id })
const aesKey = unmergeKeyMac(fileKey).slice(0, 16)
const attributes = parseAttributes(decryptAesCbcZero(decodeMegaBase64(response.at), aesKey))
return { id, key: fileKey, aesKey, nonce: fileKey.slice(16, 24), name: attributes.n || 'mega-file', size: response.s || 0 }
}

export async function downloadMegaFile(link, options = {}) {
const info = await getMegaFileInfo(link)
const maxSize = options.maxSize || MAX_BUFFER_SIZE
if (info.size > maxSize) throw new Error(`El archivo es demasiado pesado (${formatBytes(info.size)}). Máximo: ${formatBytes(maxSize)}`)
const response = await megaRequest({ a: 'g', g: 1, ssl: 2, p: info.id })
if (!response?.g || !String(response.g).startsWith('http')) throw new Error('MEGA no entregó una URL de descarga válida')
const res = await fetch(response.g)
if (!res.ok) throw new Error(`MEGA CDN respondió HTTP ${res.status}`)
const encrypted = Buffer.from(await res.arrayBuffer())
const iv = Buffer.alloc(16)
info.nonce.copy(iv, 0)
const decipher = crypto.createDecipheriv('aes-128-ctr', info.aesKey, iv)
const buffer = Buffer.concat([decipher.update(encrypted), decipher.final()])
return { ...info, buffer }
}

export function formatBytes(bytes = 0) {
if (!bytes) return '0 Bytes'
const k = 1024
const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
