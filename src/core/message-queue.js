const DEFAULT_OPTIONS = {
maxGlobalConcurrency: Number(global.messageQueueMaxConcurrency || 8),
maxUserQueue: Number(global.messageQueueMaxUserQueue || 100),
taskTimeoutMs: Number(global.messageQueueTaskTimeoutMs || 120000),
entryMaxAgeMs: Number(global.messageQueueEntryMaxAgeMs || 60000),
}

function defer(fn) {
if (typeof setImmediate === 'function') return setImmediate(fn)
return setTimeout(fn, 0)
}

export class MessageQueue {
constructor(options = {}) {
this.options = { ...DEFAULT_OPTIONS, ...options }
this.queues = new Map()
this.activeUsers = new Set()
this.activeCount = 0
this.cursor = 0
this.scheduled = false
this.accepted = 0
this.completed = 0
this.failed = 0
this.dropped = 0
this.timeouts = 0
this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
this.cleanupInterval.unref?.()
}

enqueue(key, task, options = {}) {
if (!key || typeof task !== 'function') return false
const queue = this.queues.get(key) || []
if (queue.length >= this.options.maxUserQueue) {
this.dropped++
return false
}
queue.push({ key, task, priority: options.priority || 0, createdAt: Date.now() })
if (queue.length > 1 && options.priority) queue.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt)
this.queues.set(key, queue)
this.accepted++
this.schedule()
return true
}

schedule() {
if (this.scheduled) return
this.scheduled = true
defer(() => {
this.scheduled = false
this.drain()
})
}

drain() {
while (this.activeCount < this.options.maxGlobalConcurrency) {
const entry = this.next()
if (!entry) break
this.run(entry)
}
if (this.size > 0 && this.activeCount < this.options.maxGlobalConcurrency) this.schedule()
}

next() {
const keys = [...this.queues.keys()]
if (!keys.length) return null
for (let i = 0; i < keys.length; i++) {
const key = keys[(this.cursor + i) % keys.length]
if (this.activeUsers.has(key)) continue
const queue = this.queues.get(key)
if (!queue?.length) {
this.queues.delete(key)
continue
}
this.cursor = (this.cursor + i + 1) % keys.length
const entry = queue.shift()
if (!queue.length) this.queues.delete(key)
return entry
}
return null
}

run(entry) {
this.activeCount++
this.activeUsers.add(entry.key)
let finished = false
let timeout
const done = (ok) => {
if (finished) return
finished = true
if (timeout) clearTimeout(timeout)
this.activeCount--
this.activeUsers.delete(entry.key)
if (ok) this.completed++
else this.failed++
this.schedule()
}
timeout = setTimeout(() => {
this.timeouts++
done(false)
}, this.options.taskTimeoutMs)
timeout.unref?.()
Promise.resolve().then(entry.task).then(() => done(true)).catch((error) => {
console.error('[message-queue]', error)
done(false)
})
}

cleanup() {
const now = Date.now()
for (const [key, queue] of this.queues) {
const fresh = queue.filter((entry) => {
const keep = now - entry.createdAt <= this.options.entryMaxAgeMs
if (!keep) this.dropped++
return keep
})
if (fresh.length) this.queues.set(key, fresh)
else this.queues.delete(key)
}
}

get size() {
let total = 0
for (const queue of this.queues.values()) total += queue.length
return total
}

stats() {
return { activeCount: this.activeCount, totalQueued: this.size, usersWithQueue: this.queues.size, accepted: this.accepted, completed: this.completed, failed: this.failed, dropped: this.dropped, timeouts: this.timeouts }
}

destroy() {
clearInterval(this.cleanupInterval)
this.queues.clear()
this.activeUsers.clear()
}
}

export const messageQueue = global.__rubyMessageQueue || new MessageQueue()
global.__rubyMessageQueue = messageQueue
global.getQueueStats = () => messageQueue.stats()
export default messageQueue
