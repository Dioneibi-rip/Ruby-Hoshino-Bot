function headersToObject(headers) {
  return Object.fromEntries(headers.entries())
}

function encodeBody(data, headers = {}) {
  if (data == null) return undefined
  if (data instanceof URLSearchParams || data instanceof FormData || data instanceof Blob || data instanceof ArrayBuffer || ArrayBuffer.isView(data)) return data
  if (Buffer.isBuffer(data)) return data
  if (typeof data === 'string') return data
  headers['content-type'] ||= 'application/json'
  return JSON.stringify(data)
}

export async function request(url, options = {}) {
  const headers = { ...(options.headers || {}) }
  if ((options.body ?? options.data) instanceof FormData) {
    for (const key of Object.keys(headers)) if (key.toLowerCase() === 'content-type') delete headers[key]
  }
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: encodeBody(options.body ?? options.data, headers),
    signal: options.signal,
    redirect: options.redirect
  })
  const responseHeaders = headersToObject(res.headers)
  let data
  if (options.responseType === 'arraybuffer') data = Buffer.from(await res.arrayBuffer())
  else if (options.responseType === 'text') data = await res.text()
  else {
    const text = await res.text()
    try { data = text ? JSON.parse(text) : null } catch { data = text }
  }
  if (!res.ok && options.validateStatus?.(res.status) !== true) {
    const error = new Error(`Request failed with status ${res.status}`)
    error.response = { status: res.status, data, headers: responseHeaders }
    throw error
  }
  return { data, status: res.status, statusText: res.statusText, headers: responseHeaders, url: res.url, request: { res: { responseUrl: res.url } } }
}

export function bufferToBlob(buffer, type = 'application/octet-stream') {
  return new Blob([buffer], { type })
}

export async function fetchBuffer(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function axios(configOrUrl, config = {}) {
  if (typeof configOrUrl === 'string') return request(configOrUrl, config)
  return request(configOrUrl.url, configOrUrl)
}
axios.get = (url, config = {}) => request(url, { ...config, method: 'GET' })
axios.post = (url, data, config = {}) => request(url, { ...config, method: 'POST', data })
axios.put = (url, data, config = {}) => request(url, { ...config, method: 'PUT', data })
axios.delete = (url, config = {}) => request(url, { ...config, method: 'DELETE' })

export default axios
