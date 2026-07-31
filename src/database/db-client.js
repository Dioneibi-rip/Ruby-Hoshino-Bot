import { Worker } from 'worker_threads'
import { EventEmitter } from 'events'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workerFile = path.join(__dirname, 'db-worker.js')

class DbWorkerClient extends EventEmitter {
constructor({ filename = process.env.RUBY_DB_WORKER_FILE || './src/database/database.sqlite' } = {}) {
super()
this.filename = filename
this.seq = 0
this.pending = new Map()
this.closing = false
this.worker = new Worker(workerFile, { workerData: { filename } })
this.worker.on('message', message => this.handleMessage(message))
this.worker.on('error', error => this.rejectAll(error))
this.worker.on('exit', code => { if (!this.closing && code !== 0) this.rejectAll(new Error(`db-worker exited ${code}`)) })
}
handleMessage(message = {}) {
const pending = this.pending.get(message.id)
if (!pending) return
this.pending.delete(message.id)
if (message.ok) pending.resolve(message.result)
else pending.reject(new Error(message.error || 'db-worker error'))
}
request(op, sql, params = [], payload = null) {
const id = ++this.seq
return new Promise((resolve, reject) => {
this.pending.set(id, { resolve, reject })
this.worker.postMessage({ id, op, sql, params, payload })
})
}
get(sql, params = []) { return this.request('get', sql, params) }
all(sql, params = []) { return this.request('all', sql, params) }
run(sql, params = []) { return this.request('run', sql, params) }
exec(sql) { return this.request('exec', sql) }
incrementChatActivity(payload) { return this.request('incrementChatActivity', '', [], payload) }
fire(op, payload) { this.request(op, '', [], payload).catch(error => this.emit('error', error)) }
rejectAll(error) {
for (const pending of this.pending.values()) pending.reject(error)
this.pending.clear()
this.emit('error', error)
}
close() { this.closing = true; return this.worker.terminate() }
}

export function createDbWorkerClient(options = {}) {
return new DbWorkerClient(options)
}

export function getDbWorkerClient(options = {}) {
if (!global.__rubyDbWorkerClient) {
global.__rubyDbWorkerClient = createDbWorkerClient(options)
global.__rubyDbWorkerClient.on('error', error => console.error('[db-worker]', error?.message || error))
}
return global.__rubyDbWorkerClient
}

export default getDbWorkerClient
