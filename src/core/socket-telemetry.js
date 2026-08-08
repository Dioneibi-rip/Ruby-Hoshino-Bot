/**
 * Perfil de navegador y cabeceras WebSocket compartidos por el bot principal y los Sub-Bots.
 *
 * IMPORTANTE (notificacion push del pairing code):
 * El servidor de Meta solo emite la notificacion push "Vincular dispositivo" cuando el
 * `browser` anunciado en el handshake corresponde a un navegador de ESCRITORIO conocido.
 * Con `['Ubuntu', 'Firefox', ...]` el pairing code se genera y vincula igual, pero el push
 * NUNCA llega al telefono y el usuario se ve obligado a entrar a mano en
 * "Dispositivos vinculados". Con un perfil Chrome/Desktop el push si se dispara.
 *
 * El triplete es `[plataforma, navegador, version]` y DEBE ser coherente con el
 * `User-Agent` que se envia en las cabeceras del WebSocket: si la plataforma anunciada
 * y el UA no coinciden, el servidor degrada la sesion y vuelve a omitir el push.
 */
const DEFAULT_CHROME_VERSION = '120.0.6099.216'
const DEFAULT_PLATFORM = 'Ubuntu'
const DEFAULT_BROWSER = 'Chrome'
const DEFAULT_UA = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${DEFAULT_CHROME_VERSION} Safari/537.36`

export function getStandardBrowserProfile() {
  return [DEFAULT_PLATFORM, DEFAULT_BROWSER, DEFAULT_CHROME_VERSION]
}

/**
 * Perfil especifico para sesiones que estan en proceso de vinculacion por codigo.
 * Se mantiene como funcion aparte para poder divergir del perfil normal sin tocar
 * las sesiones ya registradas.
 */
export function getPairingBrowserProfile() {
  return getStandardBrowserProfile()
}

export function getStandardWebSocketHeaders(overrides = {}) {
  return {
    'User-Agent': DEFAULT_UA,
    'sec-fetch-site': 'none',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Origin: 'https://web.whatsapp.com',
    ...overrides,
  }
}

export function alignSocketTelemetry(connectionOptions = {}, overrides = {}) {
  const options = connectionOptions.options || {}
  const headers = getStandardWebSocketHeaders({ ...(options.headers || {}), ...(overrides.headers || {}) })
  // Una sesion que va a pedir pairing code SIEMPRE usa el perfil que dispara el push,
  // ignorando cualquier `browser` heredado de la configuracion del usuario.
  const browser = overrides.pairing
    ? getPairingBrowserProfile()
    : overrides.browser || connectionOptions.browser || getStandardBrowserProfile()
  return {
    ...connectionOptions,
    browser,
    version: overrides.version || connectionOptions.version,
    options: {
      ...options,
      headers,
    },
  }
}
