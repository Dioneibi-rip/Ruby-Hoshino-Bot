function sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms))
}
function numericEnv(name, fallback) {
const value = Number.parseInt(process.env[name] || '', 10)
return Number.isFinite(value) && value > 0 ? value : fallback
}
export class StaggeredBootQueue {
constructor(options = {}) {
this.minDelayMs = Number(options.minDelayMs) || numericEnv('RUBY_SUBBOT_BOOT_MIN_DELAY_MS', 3500)
this.maxDelayMs = Number(options.maxDelayMs) || numericEnv('RUBY_SUBBOT_BOOT_MAX_DELAY_MS', 45000)
this.concurrency = Number(options.concurrency) || numericEnv('RUBY_SUBBOT_BOOT_CONCURRENCY', 2)
this.running = 0
this.queue = []
this.closed = false
}
get size() {
return this.queue.length + this.running
}
enqueue(task, options = {}) {
if (this.closed) return Promise.reject(new Error('cola de arranque cerrada'))
return new Promise((resolve, reject) => {
this.queue.push({ task, options, resolve, reject, enqueuedAt: Date.now() })
this.drain()
})
}
dynamicDelay(position = this.queue.length) {
const pressure = Math.min(position, 60)
const base = this.minDelayMs + pressure * 650
const jitter = Math.floor(Math.random() * Math.max(this.minDelayMs, 1000))
return Math.min(this.maxDelayMs, base + jitter)
}
drain() {
while (!this.closed && this.running < this.concurrency && this.queue.length) this.runNext()
}
async runNext() {
const item = this.queue.shift()
if (!item) return
this.running++
const delayMs = Number(item.options.delayMs) || this.dynamicDelay(this.queue.length)
try {
await sleep(delayMs)
const result = await item.task()
item.resolve(result)
} catch (error) {
item.reject(error)
} finally {
this.running--
setImmediate(() => this.drain())
}
}
close() {
this.closed = true
const error = new Error('cola de arranque cerrada')
while (this.queue.length) this.queue.shift().reject(error)
}
}
export const subbotBootQueue = new StaggeredBootQueue()
