const DEFAULT_CHROME_VERSION = '131.0.0.0'
const DEFAULT_PLATFORM_VERSION = '14.4.1'
const DEFAULT_UA = `Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${DEFAULT_CHROME_VERSION} Safari/537.36`

export function getStandardBrowserProfile() {
return ['Mac OS', 'Chrome', DEFAULT_PLATFORM_VERSION]
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
