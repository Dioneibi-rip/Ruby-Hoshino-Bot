const DEFAULT_MAX_BYTES = 500 * 1024 * 1024
const DEFAULT_TIMEOUT_MS = 12_000

export class MediaSizeLimitError extends Error {
  constructor({ url, size, limit }) {
    super(`MEDIA_TOO_LARGE: ${formatBytes(size)} > ${formatBytes(limit)}`)
    this.name = 'MediaSizeLimitError'
    this.url = url
    this.size = size
    this.limit = limit
  }
}

export function formatBytes(bytes = 0) {
  const value = Number(bytes) || 0
  if (value >= 1024 ** 3) return `${(value / (1024 ** 3)).toFixed(2)} GB`
  if (value >= 1024 ** 2) return `${(value / (1024 ** 2)).toFixed(2)} MB`
  if (value >= 1024) return `${(value / 1024).toFixed(2)} KB`
  return `${value} B`
}

export function buildMediaLimitMessage({ size, limit = DEFAULT_MAX_BYTES, label = 'archivo' } = {}) {
  const sizeLine = Number.isFinite(Number(size)) && Number(size) > 0
    ? `📦 Tamaño detectado: *${formatBytes(size)}*\n`
    : ''
  return `╭─「 ✦ Límite de descarga ✦ 」\n│ No puedo descargar este ${label} porque supera el límite permitido.\n│ ${sizeLine}│ Límite actual: *${formatBytes(limit)}*\n╰─ Prueba con un video/audio más corto o de menor calidad.`
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function readContentLength(headers) {
  const raw = headers?.get?.('content-length') || headers?.get?.('Content-Length')
  const size = Number(raw)
  return Number.isFinite(size) && size >= 0 ? size : null
}

export async function getRemoteContentLength(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!url || typeof url !== 'string') return null
  let response = await fetchWithTimeout(url, { method: 'HEAD', redirect: 'follow', timeoutMs }).catch(() => null)
  let size = readContentLength(response?.headers)
  if (size != null) return size

  response = await fetchWithTimeout(url, {
    method: 'GET',
    redirect: 'follow',
    timeoutMs,
    headers: { Range: 'bytes=0-0' }
  }).catch(() => null)
  size = readContentLength(response?.headers)
  if (size != null) return size

  const range = response?.headers?.get?.('content-range') || ''
  const total = Number(range.match(/\/(\d+)\s*$/)?.[1])
  return Number.isFinite(total) && total >= 0 ? total : null
}

export async function assertRemoteFileSize(url, { limit = DEFAULT_MAX_BYTES, label = 'archivo', timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const size = await getRemoteContentLength(url, { timeoutMs })
  if (size != null && size > limit) throw new MediaSizeLimitError({ url, size, limit, label })
  return { size, limit, label }
}

export async function replyIfMediaTooLarge(conn, chat, error, quoted, { label = 'archivo' } = {}) {
  if (!(error instanceof MediaSizeLimitError)) return false
  await conn.reply(chat, buildMediaLimitMessage({ size: error.size, limit: error.limit, label }), quoted)
  return true
}

export const MAX_MEDIA_DOWNLOAD_BYTES = DEFAULT_MAX_BYTES
