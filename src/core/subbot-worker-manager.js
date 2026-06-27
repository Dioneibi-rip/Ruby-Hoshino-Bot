import { Worker } from 'worker_threads'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'fs'
import path, { join } from 'path'
import { fileURLToPath } from 'url'
import qrcode from 'qrcode'
const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = (await import('@whiskeysockets/baileys')).default

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workerFile = join(__dirname, 'subbot-worker.js')
const workers = global.subBotWorkers || (global.subBotWorkers = new Map())

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function normalizeJid(jid = '') {
  return String(jid).split(':')[0].trim().toLowerCase()
}

function sessionId(jid = '') {
  const normalized = normalizeJid(jid)
  return encodeURIComponent(normalized || `subbot-${Date.now()}`)
}

export function isSubBotWorkerOnline(subBotId) {
  const record = workers.get(subBotId)
  return record?.status === 'online'
}

function hasValidSession(folderPath) {
  try {
    if (!statSync(folderPath).isDirectory()) return false
    const files = new Set(readdirSync(folderPath))
    return files.has('creds.json') || files.has('auth.db')
  } catch {
    return false
  }
}

async function sendManagerMessage(conn, request, payload) {
  if (!conn || !request?.chat) return
  const quoted = request?.key ? { key: request.key, message: request.message || {} } : undefined
  if (payload.type === 'qr') {
    const image = await qrcode.toBuffer(payload.qr, { scale: 8 })
    const sent = await conn.sendMessage(request.chat, { image, caption: payload.caption }, { quoted }).catch(() => null)
    if (sent?.key) setTimeout(() => conn.sendMessage(request.chat, { delete: sent.key }).catch(() => {}), payload.ttlMs || 45000).unref?.()
    return sent
  }
  if (payload.type === 'pairing-code') {
    const rawCode = payload.rawCode || payload.code || ''
    const formattedCode = payload.formattedCode || rawCode.match(/.{1,4}/g)?.join('-') || rawCode
    const image = readFileSync(path.join(process.cwd(), 'src', 'jadibot-code.jpeg'))
    const mediaMessage = await prepareWAMessageMedia({
      image
    }, { upload: conn.waUploadToServer })
    const interactivePayload = generateWAMessageFromContent(request.chat, {
      viewOnceMessage: {
        message: {
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.create({
              text: `*✨ ¡Tu código de vinculación está listo! ✨*

Usa el siguiente código para conectarte como Sub-Bot:

*Código:* ${formattedCode}

> Haz clic en el botón de abajo para copiarlo fácilmente.`
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: 'Este código expirará en 45 segundos.'
            }),
            header: proto.Message.InteractiveMessage.Header.create({
              hasMediaAttachment: true,
              imageMessage: mediaMessage.imageMessage
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
              buttons: [{
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                  display_text: 'Copiar Código',
                  copy_code: rawCode
                })
              }]
            })
          })
        }
      }
    }, { quoted })
    await conn.relayMessage(request.chat, interactivePayload.message, { messageId: interactivePayload.key.id }).catch(() => {})
    setTimeout(() => conn.sendMessage(request.chat, { delete: interactivePayload.key }).catch(() => {}), payload.ttlMs || 45000).unref?.()
    return interactivePayload
  }
  if (payload.type === 'text') {
    return conn.sendMessage(request.chat, { text: payload.text }, { quoted }).catch(() => {})
  }
}

export function startSubBotWorker({ folderPath, subBotId, subBotJid, conn, request, command = 'serbot', args = [], fromStartup = false } = {}) {
  if (!folderPath) throw new Error('folderPath es requerido para iniciar un subbot worker')
  subBotId ||= path.basename(folderPath)
  if (workers.has(subBotId)) return workers.get(subBotId).worker

  const worker = new Worker(workerFile, {
    workerData: {
      folderPath,
      subBotId,
      subBotJid,
      command,
      args,
      fromStartup,
      globals: {
        jadi: global.jadi,
        Rubysessions: global.Rubysessions,
        baileysSocketConfig: global.baileysSocketConfig || {},
        ch: global.ch || {}
      },
      request
    }
  })

  const record = { worker, folderPath, subBotId, subBotJid, restarts: 0, conn, request }
  workers.set(subBotId, record)

  worker.on('message', async (message = {}) => {
    if (message.type === 'status') {
      record.status = message.status
      record.reason = message.reason
      record.jid = message.jid || record.jid
      record.name = message.name || record.name
      if (message.status === 'online') {
        record.restarts = 0
        record.connectedAt = Date.now()
      }
      console.log(`[SubBot:${subBotId}] ${message.status}${message.reason ? ` (${message.reason})` : ''}`)
      if (message.status === 'online') await sendManagerMessage(conn, request, { type: 'text', text: `✅ Sub-Bot conectado correctamente: ${message.jid || subBotId}` })
      return
    }
    if (message.type === 'qr' || message.type === 'pairing-code' || message.type === 'text') {
      await sendManagerMessage(conn, request, message)
      return
    }
    if (message.type === 'logged-out') {
      workers.delete(subBotId)
      try { rmSync(folderPath, { recursive: true, force: true }) } catch {}
      await sendManagerMessage(conn, request, { type: 'text', text: '⚠️ La sesión del Sub-Bot fue cerrada desde WhatsApp. Carpeta eliminada.' })
      worker.terminate().catch(() => {})
      return
    }
    if (message.type === 'fatal') {
      workers.delete(subBotId)
      await sendManagerMessage(conn, request, { type: 'text', text: `❌ Sub-Bot detenido: ${message.error || 'error fatal'}` })
    }
  })

  worker.on('exit', (code) => {
    workers.delete(subBotId)
    if (code !== 0 && record.restarts < 3) {
      record.restarts += 1
      setTimeout(() => startSubBotWorker({ folderPath, subBotId, subBotJid, conn, request, command, args, fromStartup }), 2000 * record.restarts).unref?.()
    }
  })

  worker.on('error', (error) => {
    console.error(`[SubBot:${subBotId}] worker error:`, error)
  })

  return worker
}

export async function restoreSubBotWorkers({ baseDir, conn, delayMs = 1500 } = {}) {
  if (!baseDir) return []
  if (!existsSync(baseDir)) mkdirSync(baseDir, { recursive: true })
  const sessions = readdirSync(baseDir)
    .map(name => join(baseDir, name))
    .filter(hasValidSession)

  const started = []
  for (const folderPath of sessions) {
    started.push(startSubBotWorker({ folderPath, subBotId: path.basename(folderPath), conn, fromStartup: true }))
    await sleep(delayMs)
  }
  return started
}

export function stopSubBotWorker(subBotId) {
  const record = workers.get(subBotId)
  if (!record) return false
  record.worker.postMessage({ type: 'shutdown' })
  record.worker.terminate().catch(() => {})
  workers.delete(subBotId)
  return true
}

export function getSubBotWorkerRecords({ statuses } = {}) {
  const records = [...workers.values()]
  return Array.isArray(statuses) ? records.filter(record => statuses.includes(record.status)) : records
}

export function purgeStaleSubBotSession(subBotId, folderPath) {
  const record = workers.get(subBotId)
  if (record?.status === 'online') return false
  if (record) {
    try { record.worker.postMessage({ type: 'shutdown' }) } catch {}
    try { record.worker.terminate().catch(() => {}) } catch {}
    workers.delete(subBotId)
  }
  try { rmSync(folderPath, { recursive: true, force: true }) } catch {}
  return true
}

export { normalizeJid as normalizeSubBotJid, sessionId as subBotSessionId, hasValidSession }
