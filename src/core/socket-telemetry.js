const DEFAULT_CHROME_VERSION = '138.0.0.0'
const DEFAULT_PLATFORM_VERSION = '24.04.2'
const DEFAULT_UA = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${DEFAULT_CHROME_VERSION} Safari/537.36`

export function getStandardBrowserProfile() {
return ['Ubuntu', 'Chrome', DEFAULT_PLATFORM_VERSION]
}

export function getStandardWebSocketHeaders(overrides = {}) {
return {
'User-Agent': DEFAULT_UA,
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
