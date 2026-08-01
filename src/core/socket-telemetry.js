const DEFAULT_FIREFOX_VERSION = '120.0.0'
const DEFAULT_UA = `Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:${DEFAULT_FIREFOX_VERSION}) Gecko/20100101 Firefox/${DEFAULT_FIREFOX_VERSION}`

export function getStandardBrowserProfile() {
return ['Ubuntu', 'Firefox', DEFAULT_FIREFOX_VERSION]
}

export function getStandardWebSocketHeaders(overrides = {}) {
return {
'User-Agent': DEFAULT_UA,
'sec-fetch-site': 'none',
'Accept-Language': 'en-US,en;q=0.9',
'Cache-Control': 'no-cache',
Pragma: 'no-cache',
'Origin': 'https://web.whatsapp.com',
...overrides,
}
}

export function alignSocketTelemetry(connectionOptions = {}, overrides = {}) {
const options = connectionOptions.options || {}
const headers = getStandardWebSocketHeaders({ ...(options.headers || {}), ...(overrides.headers || {}) })
return {
...connectionOptions,
browser: overrides.browser || connectionOptions.browser || getStandardBrowserProfile(),
version: overrides.version || connectionOptions.version,
options: {
...options,
headers,
},
}
}
