const queue = []

let activeConn = null
let isProcessing = false
let jobCounter = 0
let closed = false

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const PRIORITY_VALUES = { high: 100, normal: 0, low: -100 }

function normalizePriority(priority = 0) {
if (typeof priority === 'string') return PRIORITY_VALUES[priority] ?? 0
const value = Number(priority)
return Number.isFinite(value) ? value : 0
}

export const mediaQueue = {
add(name, data = {}, options = {}) {
return enqueueMediaJob(name, data, options)
},
async close() {
await closeMediaQueue()
},
get length() {
return queue.length
}
}

export function setMediaQueueConnection(conn) {
if (conn?.sendMessage) activeConn = conn
global.mediaQueueConn = activeConn
return activeConn
}

export function getMediaQueueConnection() {
return activeConn || global.mediaQueueConn || global.conn
}

export async function enqueueMediaJob(name, data = {}, options = {}) {
if (options.conn) setMediaQueueConnection(options.conn)
closed = false
const job = {
id: options.jobId || String(++jobCounter),
name,
data,
options,
priority: normalizePriority(options.priority || data.priority)
}
queue.push(job)
if (queue.length > 1) queue.sort((a, b) => b.priority - a.priority || Number(a.id) - Number(b.id))
processQueue()
return job
}

async function processQueue() {
if (isProcessing || closed) return
isProcessing = true
while (queue.length && !closed) {
const job = queue.shift()
try {
const handler = global.queueHandlers?.get(job.name)
if (handler) await handler(job.data)
} catch (error) {
console.error('[mediaQueue] worker failed', job?.id, error?.message || error)
}
if (queue.length && !closed) await delay(1500)
}
isProcessing = false
}

export function startMediaWorker(conn) {
setMediaQueueConnection(conn)
global.queueHandlers ||= new Map()
closed = false
processQueue()
return mediaQueue
}

export async function closeMediaQueue() {
closed = true
queue.length = 0
isProcessing = false
}
