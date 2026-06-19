import { parentPort, workerData } from 'worker_threads'
import { DbManager } from './database.js'

const db = new DbManager(workerData?.dbPath || './src/database/database.sqlite')
const ALLOWED = new Set([
  'getUser', 'updateUser', 'addMoney', 'addEconomy', 'getEconomy', 'setEconomy',
  'getChat', 'updateChat', 'getSettings', 'updateSettings', 'getHarem', 'getGroupHarem',
  'findHaremClaim', 'addHarem', 'upsertHaremClaim', 'removeHarem', 'getGacha', 'updateGacha', 'getRecord', 'updateRecord', 'setRecord',
  'deleteRecord', 'listRecords'
])

parentPort.on('message', async (message) => {
  const { id, method, args = [] } = message || {}
  try {
    if (!ALLOWED.has(method) || typeof db[method] !== 'function') throw new Error(`Método DB no permitido en worker: ${method}`)
    const result = await db[method](...args)
    parentPort.postMessage({ id, ok: true, result })
  } catch (error) {
    parentPort.postMessage({ id, ok: false, error: { message: error.message, code: error.code, stack: error.stack } })
  }
})

process.once('beforeExit', () => db.close())
