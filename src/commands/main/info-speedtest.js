import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import moment from '../../library/momentCompat.js';

const execFileAsync = promisify(execFile)
const NETWORK_TIMEOUT_MS = 10_000

function formatBytes(bytes = 0) {
const units = ['B', 'KB', 'MB', 'GB', 'TB']
let value = Number(bytes) || 0
let unit = 0
while (value >= 1024 && unit < units.length - 1) {
value /= 1024
unit += 1
}
return `${value.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`
}

function formatUptime(seconds = 0) {
const total = Math.max(0, Math.floor(Number(seconds) || 0))
const days = Math.floor(total / 86400)
const hours = Math.floor((total % 86400) / 3600)
const minutes = Math.floor((total % 3600) / 60)
const secs = total % 60
return `${days}d ${hours}h ${minutes}m ${secs}s`
}

function getWhatsAppLatency(m) {
const timestamp = Number(m?.messageTimestamp || 0)
if (!timestamp) return 0
return Math.max(0, moment().diff(moment(timestamp * 1000), 'milliseconds'))
}

function getServerMetrics(m) {
const totalMem = os.totalmem()
const freeMem = os.freemem()
const usedMem = totalMem - freeMem
const load = os.loadavg().map((value) => value.toFixed(2)).join(' / ')
return {
latency: getWhatsAppLatency(m),
uptime: formatUptime(os.uptime()),
ram: `${formatBytes(usedMem)} / ${formatBytes(totalMem)}`,
freeRam: formatBytes(freeMem),
load,
platform: `${os.type()} ${os.release()}`,
}
}

async function runNetworkSpeedtest() {
const speedtest = execFileAsync('python3', ['./src/library/ookla-speedtest.py', '--secure'], {
timeout: NETWORK_TIMEOUT_MS,
maxBuffer: 1024 * 1024,
})
const timeout = new Promise((resolve) => {
setTimeout(() => resolve(null), NETWORK_TIMEOUT_MS).unref?.()
})
try {
const result = await Promise.race([speedtest, timeout])
if (!result) return null
const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim()
const ping = output.match(/Ping:\s*([^\n]+)/i)?.[1]?.trim()
const download = output.match(/Download:\s*([^\n]+)/i)?.[1]?.trim()
const upload = output.match(/Upload:\s*([^\n]+)/i)?.[1]?.trim()
if (!ping && !download && !upload) return { raw: output }
return { ping, download, upload }
} catch {
return null
}
}

function buildCaption(metrics, network) {
const lines = [
'🪻 Speed Test',
'',
`Ping WhatsApp: ${metrics.latency}ms`,
`Uptime: ${metrics.uptime}`,
`RAM: ${metrics.ram}`,
`RAM libre: ${metrics.freeRam}`,
`CPU Load: ${metrics.load}`,
`Servidor: ${metrics.platform}`,
]
if (network?.download || network?.upload || network?.ping) {
lines.push('', `Ping Red: ${network.ping || 'N/A'}`, `Descarga: ${network.download || 'N/A'}`, `Subida: ${network.upload || 'N/A'}`)
} else {
lines.push('', 'Prueba de red: omitida por timeout o error del contenedor.')
}
return lines.join('\n')
}

const handler = async (m, { conn }) => {
await conn.reply(m.chat, '🪻 Speed Test....', m)
const metrics = getServerMetrics(m)
const network = await runNetworkSpeedtest()
await conn.reply(m.chat, buildCaption(metrics, network), m)
}
handler.help = ['speedtest']
handler.tags = ['info']
handler.command = ['speedtest', 'stest', 'test']
handler.register = true
handler.rowner = true

export default handler
