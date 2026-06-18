import { Worker } from 'worker_threads'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class SubBotDbWorkerManager {
  constructor({ dbPath = './src/database/database.sqlite', workerPath = path.join(__dirname, 'subbot-db-worker.js') } = {}) {
    this.dbPath = dbPath
    this.workerPath = workerPath
    this.seq = 0
    this.pending = new Map()
    this.start()
  }

  start() {
    this.worker = new Worker(this.workerPath, { workerData: { dbPath: this.dbPath } })
    this.worker.on('message', (message) => {
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.ok) pending.resolve(message.result)
      else {
        const error = new Error(message.error?.message || 'Error desconocido en worker SQLite')
        error.code = message.error?.code
        error.stack = message.error?.stack || error.stack
        pending.reject(error)
      }
    })
    this.worker.on('error', (error) => this.rejectAll(error))
    this.worker.on('exit', (code) => {
      if (code !== 0) this.rejectAll(new Error(`Worker SQLite de Sub-Bots finalizó con código ${code}`))
    })
  }

  call(method, ...args) {
    const id = ++this.seq
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.worker.postMessage({ id, method, args })
    })
  }

  rejectAll(error) {
    for (const { reject } of this.pending.values()) reject(error)
    this.pending.clear()
  }

  async close() {
    this.rejectAll(new Error('Worker SQLite de Sub-Bots cerrado'))
    await this.worker.terminate()
  }
}

export function getSubBotDbWorker(options = {}) {
  if (!global.subBotDbWorker) global.subBotDbWorker = new SubBotDbWorkerManager(options)
  return global.subBotDbWorker
}
