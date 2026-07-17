import EventEmitter from 'events'
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
if (handler) await handler(job.data, { conn: job.options?.conn || activeConn || global.mediaQueueConn || global.conn, job })
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

export class Queque extends EventEmitter {
  _queque = new Set()
  add(item) { this._queque.add(item) }
  has(item) { return this._queque.has(item) }
  delete(item) { this._queque.delete(item) }
  first() { return [...this._queque].shift() }
  isFirst(item) { return this.first() === item }
  last() { return [...this._queque].pop() }
  isLast(item) { return this.last() === item }
  getIndex(item) { return [...this._queque].indexOf(item) }
  getSize() { return this._queque.size }
  isEmpty() { return this.getSize() === 0 }
  unqueue(item) {
    let queque
    if (item) {
      if (this.has(item)) {
        queque = item
        if (!this.isFirst(item)) throw new Error('Item is not first in queue')
      }
    } else queque = this.first()
    if (queque) {
      this.delete(queque)
      this.emit(queque)
    }
  }
  waitQueue(item) {
    return new Promise((resolve, reject) => {
      if (!this.has(item)) return reject(new Error('item not found'))
      const solve = async (removeQueque = false) => {
        await delay(5000)
        if (removeQueque) this.unqueue(item)
        if (!this.isEmpty()) this.unqueue()
        resolve()
      }
      if (this.isFirst(item)) solve(true)
      else this.once(item, solve)
    })
  }
}
