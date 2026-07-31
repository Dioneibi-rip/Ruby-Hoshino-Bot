import { fork } from 'child_process'
import { cpus } from 'os'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const maxSubBotsPerWorker = Math.max(1, Number(process.env.SUBBOT_WORKER_CAPACITY || 15))
const configuredWorkers = Number(process.env.SUBBOT_WORKERS || 0)
const workerCount = Math.max(1, configuredWorkers || Math.min(Math.max(1, cpus().length - 1), Math.ceil(Number(process.env.SUBBOT_EXPECTED_TOTAL || 80) / maxSubBotsPerWorker)))
const workers = new Map()
const workerEntry = path.join(__dirname, 'src', 'cluster', 'subbot-worker.js')

function startWorker(index, restart = 0) {
const env = {
...process.env,
RUBY_CLUSTER_WORKER: 'true',
RUBY_WORKER_ID: String(index),
SUBBOT_SHARD_INDEX: String(index),
SUBBOT_SHARD_COUNT: String(workerCount),
SUBBOT_WORKER_CAPACITY: String(maxSubBotsPerWorker),
RUBY_LOAD_SUBBOTS: process.env.RUBY_LOAD_SUBBOTS || 'true'
}
const child = fork(workerEntry, [], { cwd: __dirname, env, stdio: ['inherit', 'inherit', 'inherit', 'ipc'] })
workers.set(index, { child, restart })
child.on('exit', (code, signal) => {
workers.delete(index)
const delay = Math.min(30000, 1000 * 2 ** Math.min(restart, 5))
console.error(`[master] worker ${index} exited`, { code, signal, restartIn: delay })
setTimeout(() => startWorker(index, restart + 1), delay).unref?.()
})
child.on('message', message => {
if (!message || typeof message !== 'object') return
if (message.type === 'ready') console.log(`[master] worker ${index} ready`)
if (message.type === 'metric') console.log(`[worker:${index}]`, message.payload)
})
}

function shutdown(signal) {
console.log(`[master] ${signal}`)
for (const { child } of workers.values()) child.send?.({ type: 'shutdown' })
setTimeout(() => {
for (const { child } of workers.values()) child.kill('SIGTERM')
process.exit(0)
}, 5000).unref?.()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

for (let index = 0; index < workerCount; index++) startWorker(index)
console.log(`[master] started ${workerCount} workers with capacity ${maxSubBotsPerWorker}`)
