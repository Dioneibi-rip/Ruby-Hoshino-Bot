import { Queue, Worker, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'
import { redisUrl } from './redis.js'

const QUEUE_NAME = 'mediaQueue'

let activeConn = null
let worker = null
let queueEvents = null

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
  if (options.conn) setMediaQueueConnection(options.conn)
  return mediaQueue.add(name, data, {
    jobId: options.jobId,
    priority: options.priority,
    removeOnComplete: options.removeOnComplete ?? { count: 100 },
    removeOnFail: options.removeOnFail ?? { count: 50 }
  })
}

async function processMediaJob(job) {
  const handler = global.queueHandlers?.get(job.name)
  if (handler) await handler(job.data)
}

export function startMediaWorker(conn) {
  setMediaQueueConnection(conn)
  if (worker) return worker
  global.queueHandlers ||= new Map()
  queueEvents ||= new QueueEvents(QUEUE_NAME, { connection: createQueueConnection() })
  queueEvents.on('failed', ({ jobId, failedReason }) => console.error('[mediaQueue] failed', jobId, failedReason))
  worker = new Worker(QUEUE_NAME, processMediaJob, {
    connection: createQueueConnection(),
    concurrency: 1
  })
  worker.on('failed', (job, error) => console.error('[mediaQueue] worker failed', job?.id, error?.message || error))
  return worker
}

export async function closeMediaQueue() {
  await Promise.allSettled([worker?.close(), queueEvents?.close(), mediaQueue?.close()])
  worker = null
  queueEvents = null
}
