import { Queue, Worker, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'
import axios from 'axios'
import fetch from 'node-fetch'
import { igdl } from 'ruhend-scraper'
import yts from 'yt-search'
import fs from 'fs'
import { exec } from 'child_process'
import { join } from 'path'
import { ytmp3, ytmp4 } from './youtubedl.js'
import { redisUrl } from './redis.js'
const QUEUE_NAME = 'mediaQueue'
const SEND_DELAY_MS = 1500

let activeConn = null
let worker = null
let queueEvents = null

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

function createQueueConnection() {
const isTls = /^rediss:\/\//i.test(redisUrl) || String(process.env.REDIS_TLS || '').toLowerCase() === 'true'
return new IORedis(redisUrl, {
lazyConnect: false,
enableOfflineQueue: false,
maxRetriesPerRequest: null,
connectTimeout: 10000,
commandTimeout: 30000,
retryStrategy(times) {
return Math.min(times * 250, 5000)
},
...(isTls ? { tls: { rejectUnauthorized: false } } : {})
})
}

export const mediaQueue = new Queue(QUEUE_NAME, {
connection: createQueueConnection(),
defaultJobOptions: {
attempts: 2,
backoff: { type: 'exponential', delay: 3000 },
removeOnComplete: { count: 100 },
removeOnFail: { count: 50 }
}
})

export function setMediaQueueConnection(conn) {
if (conn?.sendMessage) activeConn = conn
global.mediaQueueConn = activeConn
return activeConn
}

export function getMediaQueueConnection() {
return activeConn || global.mediaQueueConn || global.conn
}

export async function enqueueMediaJob(name, data = {}, options = {}) {
return mediaQueue.add(name, data, {
jobId: options.jobId,
priority: options.priority,
removeOnComplete: options.removeOnComplete ?? { count: 100 },
removeOnFail: options.removeOnFail ?? { count: 50 }
})
}

async function pinterestScraper(query, limit = 10) {
const url = 'https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D' + encodeURIComponent(query) + '%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22query%22%3A%22' + encodeURIComponent(query) + '%22%2C%22scope%22%3A%22pins%22%2C%22rs%22%3A%22typed%22%7D%2C%22context%22%3A%7B%7D%7D'
const headers = { accept: 'application/json, text/javascript, */*; q=0.01', referer: 'https://id.pinterest.com/', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'x-requested-with': 'XMLHttpRequest' }
const response = await axios.get(url, { headers })
if (!response.data?.resource_response?.data?.results) return []
const results = response.data.resource_response.data.results.map(item => {
if (!item.images) return null
return item.images.orig?.url || item.images['736x']?.url || item.images['400x300']?.url || null
}).filter(Boolean)
return results.sort(() => 0.5 - Math.random()).slice(0, limit)
}

async function tiktokdl(url) {
const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`
const res = await fetch(api)
return res.json()
}

function formatTikTokDate(timestamp) {
const date = new Date(Number(timestamp || 0) * 1000)
return date.toLocaleString('es-ES', { timeZone: 'America/Mexico_City' })
}

async function pathExists(file) {
try { await fs.promises.access(file); return true } catch { return false }
}

function execFile(command) {
return new Promise((resolve, reject) => {
exec(command, (err) => err ? reject(err) : resolve())
})
}

async function sendPinterest(conn, data) {
const imageUrls = await pinterestScraper(data.text, 10)
if (!imageUrls.length) return
const caption = '✧ ─ ⋆⋅ ୨ 📌 ୧ ⋅⋆ ─ ✧\n\n🎀 ⋆ ࣪. *Bᴜ́sǫᴜᴇᴅᴀ:* `' + data.text + '`\n✨ ⋆ ࣪. *Rᴇsᴜʟᴛᴀᴅᴏs:* `' + imageUrls.length + ' ɪᴍᴀ́ɢᴇɴᴇs ᴇɴᴄᴏɴᴛʀᴀᴅᴀs`\n\n*⏤͟͞ू⃪  ̸̷͢𝐑𝐮𝐛y͟ 𝐇𝐨𝐬𝐡𝐢n͟ᴏ 𝐁𝐨t͟˚₊·—̳͟͞͞♡̥*'
if (imageUrls.length < 2) return conn.sendMessage(data.chat, { image: { url: imageUrls[0] }, caption })
return conn.sendMessage(data.chat, { album: imageUrls.map(url => ({ image: { url } })), caption })
}

async function sendTikTok(conn, data) {
const tiktokData = await tiktokdl(data.url)
const result = tiktokData?.data
if (!result?.play) throw new Error('No se pudo obtener el video de TikTok')
const caption = `_💌  ᩭ✎Tiktok sin marca de agua descargado con éxito_

「${result.title || '✧ 𝑺𝒊𝒏 𝒕𝒊𝒕𝒖𝒍𝒐 ✧'}」

❀ 𝘼𝙐𝙏𝙊𝙍: ${result.author?.nickname || 'Desconocido'}
❀ 𝘿𝙐𝙍𝘼𝘾𝙄𝙊𝙉: ${result.duration || 0}s
❀ 𝙑𝙄𝙎𝙏𝘼𝙎: ${result.play_count || 0}
❀ 𝙇𝙄𝙆𝙀𝙎: ${result.digg_count || 0}
❀ 𝘾𝙊𝙈𝙀𝙉𝙏𝘼𝙍𝙄𝙊𝙎: ${result.comment_count || 0}
❀ 𝘾𝙊𝙈𝙋𝘼𝙍𝙏𝙄𝘿𝙊𝙎: ${result.share_count || 0}
❀ 𝙁𝙀𝘾𝙃𝘼: ${formatTikTokDate(result.create_time)}`.trim()
return conn.sendFile(data.chat, result.play, 'tiktok.mp4', caption)
}

async function sendInstagram(conn, data) {
const res = await igdl(data.url)
const list = Array.isArray(res.data || res) ? (res.data || res) : [res.data || res]
for (const media of list.filter(Boolean)) {
const mediaUrl = media.url || media
const isVideo = /(\.mp4|video)/i.test(mediaUrl)
await conn.sendFile(data.chat, mediaUrl, `instagram.${isVideo ? 'mp4' : 'jpg'}`, '🌹̫ᩙ᮫〫𝆬  𝙘𝙤𝙣𝙩𝙚𝙣𝙞𝙙𝙤 𝙙𝙚 𝙞𝙣𝙨𝙩𝙖𝙜𝙧𝙖𝙢 𝙡𝙞𝙨𝙩𝙤`')
await sleep(800)
}
}

async function resolveYoutube(text) {
const youtubeRegexID = /(?:http:\/\/googleusercontent\.com\/youtube\.com\/0)([a-zA-Z0-9_-]{11})/
const match = text.match(youtubeRegexID)
if (match) {
try { return yts({ videoId: match[1] }) } catch { }
}
const s = await yts(text)
return s.all.find(v => v.type === 'video') || s.all[0]
}

async function sendYoutube(conn, data) {
const result = await resolveYoutube(data.text)
if (!result) return
const { title, url } = result
if (data.mode === 'audio') {
const r = await ytmp3(url, title)
if (!r?.download?.url) throw new Error('Link de audio caído')
return conn.sendMessage(data.chat, { audio: { url: r.download.url }, fileName: `${r.metadata.title}.mp3`, mimetype: 'audio/mpeg', ptt: false })
}
const r = await ytmp4(url, title)
if (!r?.download?.url) throw new Error('Link de video caído')
const tmpDir = join(process.cwd(), 'tmp')
if (!await pathExists(tmpDir)) await fs.promises.mkdir(tmpDir, { recursive: true })
const fileName = join(tmpDir, `${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`)
try {
await execFile(`ffmpeg -i "${r.download.url}" -c:v copy -c:a aac -movflags +faststart "${fileName}"`)
if (!await pathExists(fileName)) throw new Error('Error en FFmpeg')
await conn.sendMessage(data.chat, { video: await fs.promises.readFile(fileName), fileName: `${title}.mp4`, caption: title, mimetype: 'video/mp4' })
} finally {
fs.promises.unlink(fileName).catch(() => {})
}
}

async function processMediaJob(job) {
const conn = getMediaQueueConnection()
if (!conn?.sendMessage) throw new Error('Socket de WhatsApp no disponible para mediaQueue')
try {
if (job.name === 'pinterest') return await sendPinterest(conn, job.data)
if (job.name === 'tiktok') return await sendTikTok(conn, job.data)
if (job.name === 'instagram') return await sendInstagram(conn, job.data)
if (job.name === 'youtube') return await sendYoutube(conn, job.data)
throw new Error(`Tipo de job no soportado: ${job.name}`)
} finally {
await sleep(SEND_DELAY_MS)
}
}

export function startMediaWorker(conn) {
setMediaQueueConnection(conn)
if (worker) return worker
queueEvents ||= new QueueEvents(QUEUE_NAME, { connection: createQueueConnection() })
queueEvents.on('failed', ({ jobId, failedReason }) => console.error('[mediaQueue] failed', jobId, failedReason))
worker = new Worker(QUEUE_NAME, processMediaJob, {
connection: createQueueConnection(),
concurrency: 1,
limiter: { max: 1, duration: SEND_DELAY_MS }
})
worker.on('failed', (job, error) => console.error('[mediaQueue] worker failed', job?.id, error?.message || error))
return worker
}

export async function closeMediaQueue() {
await Promise.allSettled([worker?.close(), queueEvents?.close(), mediaQueue?.close()])
worker = null
queueEvents = null
}
