import crypto from 'crypto'
const LOGIN_SALT = '8IAcbWyCsVhYv82S2eofRqK1DF3nNDAv'
const OAUTH_SALT = '8IAcbWyCsVhYv82S2eofRqK1DF3nNDAv&'
const API_BASE = 'https://api.mydramawave.com/dm-api'
const DEFAULT_DEVICE_ID = '8fe204ad-da20-4abb-9933-17260808b57f'
const MAX_LIST_ITEMS = 10

function md5(text) {
return crypto.createHash('md5').update(text, 'utf8').digest('hex')
}

function generateLoginSign(deviceId) {
return md5(LOGIN_SALT + deviceId)
}

function generateSignature(authSecret = '') {
return md5(OAUTH_SALT + authSecret)
}

function generateAuthHeader(authKey = '', authSecret = '', timestamp = Date.now()) {
const signature = generateSignature(authSecret)
return `oauth_signature=${signature},oauth_token=${authKey},ts=${timestamp}`
}

function formatMaybeList(value) {
if (Array.isArray(value)) return value.filter(Boolean).join(', ')
return value || ''
}

function getDramaId(item = {}) {
return item.id || item.key || item.series_id || item.drama_id
}

function getDramaTitle(item = {}) {
return item.title || item.name || item.series_name || item.drama_name || 'Sin título'
}

class DramaWaveClient {
constructor(deviceId = DEFAULT_DEVICE_ID) {
this.deviceId = deviceId
this.authKey = null
this.authSecret = null
}

async init() {
if (this.authKey && this.authSecret) return

const payload = {
device_id: this.deviceId,
device_name: 'Infinix Infinix X6833B',
sign: generateLoginSign(this.deviceId),
}

const result = await this.request('/anonymous/login', {
method: 'POST',
skipAuth: true,
body: payload,
})

if (result.code !== 200 || !result.data?.success || !result.data?.auth_key || !result.data?.auth_secret) {
throw new Error('No se pudo iniciar sesión anónima en DramaWave.')
}

this.authKey = result.data.auth_key
this.authSecret = result.data.auth_secret
}

getHeaders(skipAuth = false) {
const headers = {
country: 'ID',
'device-country': 'ID',
language: 'id-ID',
'device-language': 'in-ID',
'device-id': this.deviceId,
device: 'android',
'app-name': 'com.dramawave.app',
'app-version': '1.8.91',
'content-type': 'application/json',
accept: 'application/json',
'user-agent': 'okhttp/4.12.0',
}

if (!skipAuth && this.authKey && this.authSecret) {
headers.authorization = generateAuthHeader(this.authKey, this.authSecret)
}

return headers
}

async request(path, { method = 'GET', body, skipAuth = false } = {}) {
const response = await fetch(`${API_BASE}${path}`, {
method,
headers: this.getHeaders(skipAuth),
body: body ? JSON.stringify(body) : undefined,
})

if (!response.ok) throw new Error(`DramaWave respondió con estado ${response.status}.`)
return response.json()
}

async authedRequest(path, options = {}) {
await this.init()
return this.request(path, options)
}

async homepage() {
return this.authedRequest('/homepage/v2/tab/index?tab_key=126&position_index=15')
}

async search(query) {
if (!query) throw new Error('Debes escribir el título a buscar.')
return this.authedRequest('/search/drama', {
method: 'POST',
body: {
next: '',
keyword: query,
timestamp: Date.now().toString(),
},
})
}

async detail(id) {
if (!id) throw new Error('Debes escribir el ID del drama.')
return this.authedRequest(`/drama/info_v2?series_id=${encodeURIComponent(id)}&clip_content=`)
}

async stream(dramaId, episodeId) {
if (!dramaId || !episodeId) throw new Error('Debes escribir el ID del drama y el ID del episodio.')

const detail = await this.detail(dramaId)
const episodes = detail?.data?.info?.episode_list || []
const episode = episodes.find(ep => String(ep.id) === String(episodeId))
if (!episode) throw new Error('No se encontró ese episodio en el drama indicado.')

const url = episode.external_audio_h264_m3u8 || episode.m3u8_url || episode.video_url
if (!url) throw new Error('No se encontró un enlace de stream para ese episodio.')

return {
url,
subtitles: episode.subtitle_list || [],
episode,
}
}

async getPopular() {
const home = await this.homepage()
const modules = home.data?.items || []
return modules.flatMap(module => (module.items || []).map(item => ({
id: getDramaId(item),
title: getDramaTitle(item),
type: module.module_name || module.name || 'Recomendado',
poster: item.poster || item.cover || item.image,
}))).filter(item => item.id && item.title)
}

async searchDramas(query) {
const result = await this.search(query)
return result.data?.items || []
}

async getEpisodes(dramaId) {
const detail = await this.detail(dramaId)
return detail?.data?.info?.episode_list || []
}
}

function usage(usedPrefix, command) {
return `📺 *DramaWave*\n\n` +
`Uso:\n` +
`• ${usedPrefix + command} popular\n` +
`• ${usedPrefix + command} search <título>\n` +
`• ${usedPrefix + command} detail <id>\n` +
`• ${usedPrefix + command} episodes <id>\n` +
`• ${usedPrefix + command} stream <dramaId> <episodeId>`
}

function formatPopular(items, usedPrefix, command) {
if (!items.length) return '📺 No se encontraron dramas populares.'
let text = '📺 *Dramas populares en DramaWave*\n\n'
items.slice(0, MAX_LIST_ITEMS).forEach((item, index) => {
text += `${index + 1}. *${item.title}*\n`
text += `   ID: ${item.id}\n`
text += `   Tipo: ${item.type}\n\n`
})
text += `Usa *${usedPrefix + command} detail <id>* para ver detalles.`
return text
}

function formatSearch(items, usedPrefix, command) {
if (!items.length) return '🔍 No se encontraron resultados.'
let text = '🔍 *Resultados de búsqueda en DramaWave*\n\n'
items.slice(0, MAX_LIST_ITEMS).forEach((item, index) => {
text += `${index + 1}. *${getDramaTitle(item)}*\n`
text += `   ID: ${getDramaId(item) || 'N/A'}\n`
if (item.year) text += `   Año: ${item.year}\n`
text += '\n'
})
text += `Usa *${usedPrefix + command} detail <id>* para ver detalles.`
return text
}

function formatEpisodes(episodes, dramaId, usedPrefix, command) {
if (!episodes.length) return '📺 No se encontraron episodios.'
let text = '📺 *Episodios disponibles*\n\n'
episodes.slice(0, 20).forEach((episode, index) => {
text += `${episode.index || index + 1}. ${episode.name || episode.title || `Episodio ${index + 1}`}\n`
text += `   ID: ${episode.id}\n\n`
})
text += `Usa *${usedPrefix + command} stream ${dramaId} <episodeId>* para obtener el enlace.`
return text
}

function formatDetail(detail, dramaId, usedPrefix, command) {
const info = detail?.data?.info || detail?.info
if (!info) return '❌ No se encontraron detalles para ese drama.'
let text = `📺 *${info.name || info.title || 'Sin título'}*\n\n`
if (info.year) text += `📅 Año: ${info.year}\n`
if (info.genre) text += `🎭 Género: ${formatMaybeList(info.genre)}\n`
if (info.rating) text += `⭐ Rating: ${info.rating}\n`
if (info.episode_count || info.total_episode) text += `📺 Episodios: ${info.episode_count || info.total_episode}\n`
if (info.status) text += `📌 Estado: ${info.status}\n`
if (info.description || info.desc) text += `\n📝 ${(info.description || info.desc).slice(0, 500)}\n`
text += `\nUsa *${usedPrefix + command} episodes ${detail?.data?.series_id || dramaId}* para ver episodios.`
return text
}

function formatStream(stream) {
let text = `🎬 *Enlace de stream*\n\n📹 URL: ${stream.url}\n`
if (stream.subtitles?.length) {
text += '\n📝 *Subtítulos disponibles:*\n'
stream.subtitles.forEach(sub => {
text += `• ${sub.display_name || sub.language || 'Subtítulo'}: ${sub.vtt || sub.subtitle || sub.url || 'N/A'}\n`
})
}
return text
}

let handler = async (m, { conn, args, command, usedPrefix }) => {
const action = (args[0] || '').toLowerCase()
if (!action) return conn.reply(m.chat, usage(usedPrefix, command), m)

await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

try {
const client = new DramaWaveClient()
let responseText = ''

switch (action) {
case 'popular':
responseText = formatPopular(await client.getPopular(), usedPrefix, command)
break
case 'search':
responseText = formatSearch(await client.searchDramas(args.slice(1).join(' ')), usedPrefix, command)
break
case 'episodes':
responseText = formatEpisodes(await client.getEpisodes(args[1]), args[1], usedPrefix, command)
break
case 'stream':
responseText = formatStream(await client.stream(args[1], args[2]))
break
case 'detail':
responseText = formatDetail(await client.detail(args[1]), args[1], usedPrefix, command)
break
default:
responseText = `❌ Acción no soportada.\n\n${usage(usedPrefix, command)}`
}

await conn.reply(m.chat, responseText, m)
await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
} catch (error) {
console.error('DRAMAWAVE_ERROR:', error)
await conn.sendMessage(m.chat, { react: { text: '✖️', key: m.key } })
throw m.reply(`${emoji} Error en DramaWave: ${error.message}`)
}
}

handler.help = ['dramawave']
handler.tags = ['descargas']
handler.command = ['dramawave', 'dramaweave']
handler.register = true
handler.group = true

export default handler
