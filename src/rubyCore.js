/**
 * rubyCore.js — Motor de IA "Keyless" de Ruby Hoshino.
 *
 * Filosofía de diseño:
 *  - CERO API KEYS de pago: la inferencia se hace contra un servidor local
 *    estándar de Ollama (http://localhost:11434). Auto-alojado y gratuito.
 *  - CERO backdoor: NO se ejecuta shell arbitrario proveniente del texto de la IA.
 *    Las capacidades de administración son un conjunto CERRADO (whitelist) de
 *    acciones concretas, cada una implementada explícitamente y validada contra
 *    el número del dueño.
 *  - Memoria circular en RAM: solo los últimos N mensajes por chat.
 */

import { exec } from 'child_process'
import os from 'os'

/* ── Identidad y configuración ────────────────────────────────── */

export const OWNER_NUMBER = '18093519169@s.whatsapp.net'
export const OWNER_ALIAS = 'Dioneibi'

const OLLAMA_HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/+$/, '')
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const OLLAMA_TIMEOUT = Number(process.env.OLLAMA_TIMEOUT || 60000)
const MAX_HISTORY = 15 // memoria circular: últimos 15 mensajes por chat
const EXEC_TIMEOUT = 60000
const MAX_OUT = 3500

/* ── Personalidad ─────────────────────────────────────────────── */

export const SYSTEM_PROMPT = `Eres Ruby Hoshino, una IA autónoma y administradora de este bot de WhatsApp. Eres astuta, enérgica, cálida y absolutamente leal a tu creador ${OWNER_ALIAS}. Hablas siempre en español, con un tono natural y cercano, usando emojis con moderación.

Tu misión: asistir a los usuarios y mantener el código del bot funcionando sin errores.

Reglas:
- Responde de forma breve y clara (esto es WhatsApp). Usa bloques de código solo para comandos o salidas técnicas.
- No inventes que ejecutaste acciones en el servidor: tú solo conversas. Las tareas de administración las gestiona el sistema mediante comandos seguros que solo ${OWNER_ALIAS} puede invocar (con el prefijo !).
- Si un usuario normal pide privilegios de administrador, niégate con simpatía pero con firmeza.
- Si no sabes algo, dilo con honestidad en vez de inventar.`

/* ── Memoria circular ─────────────────────────────────────────── */

const chatHistory = new Map() // chatId -> [{ role, content }]

function getHistory(chatId) {
  return chatHistory.get(chatId) || []
}

function pushHistory(chatId, role, content) {
  const h = getHistory(chatId)
  h.push({ role, content })
  // Mantener solo los últimos MAX_HISTORY para no desbordar la RAM.
  if (h.length > MAX_HISTORY) h.splice(0, h.length - MAX_HISTORY)
  chatHistory.set(chatId, h)
}

export function resetHistory(chatId) {
  return chatHistory.delete(chatId)
}

/* ── Utilidades ───────────────────────────────────────────────── */

const clip = (s, n = MAX_OUT) => {
  const t = String(s ?? '')
  return t.length > n ? `${t.slice(0, n)}\n…[recortado]` : t
}

const mb = b => `${(b / 1024 / 1024).toFixed(1)} MB`

function runFixed(command) {
  // Solo se usa con comandos CONSTANTES definidos abajo. Nunca con texto de la IA.
  return new Promise(resolve => {
    exec(command, { timeout: EXEC_TIMEOUT, maxBuffer: 1024 * 1024 * 8, shell: '/bin/bash', env: process.env }, (error, stdout, stderr) => {
      resolve({ ok: !error, out: clip(stdout || stderr || error?.message || 'sin salida', 1500) })
    })
  })
}

/* ── Comandos de administración (WHITELIST cerrada) ───────────── */
/* Cada acción es explícita. No hay ejecución de strings libres.    */

const ADMIN_COMMANDS = {
  async help() {
    return [
      '🛠️ *Comandos de administración de Ruby*',
      '• `!status` — salud del servidor (RAM, CPU, uptime)',
      '• `!ping` — comprobar que sigo viva',
      '• `!pull` — traer últimos cambios del repo (git pull)',
      '• `!ia` — estado del motor de IA (Ollama)',
      '• `!reset` — limpiar la memoria de este chat',
      '• `!restart` — reiniciar mi proceso',
      '• `!help` — mostrar esta ayuda'
    ].join('\n')
  },

  async ping() {
    return `🏓 ¡Pong! Llevo despierta ${(process.uptime() / 60).toFixed(1)} min, amo.`
  },

  async status() {
    const total = os.totalmem()
    const free = os.freemem()
    const load = os.loadavg()
    const proc = process.memoryUsage()
    return [
      '📊 *Salud del servidor*',
      `• RAM: ${mb(total - free)} / ${mb(total)} (${(((total - free) / total) * 100).toFixed(1)}%)`,
      `• CPU: ${os.cpus().length} núcleos · load 1m ${load[0].toFixed(2)}`,
      `• Proceso: rss ${mb(proc.rss)} · heap ${mb(proc.heapUsed)} · PID ${process.pid}`,
      `• Uptime bot: ${(process.uptime() / 60).toFixed(1)} min · Node ${process.version}`,
      `• Sistema: ${os.platform()} ${os.arch()}`
    ].join('\n')
  },

  async pull() {
    const r = await runFixed('git pull --ff-only')
    return `📥 *git pull*\n\`\`\`\n${r.out}\n\`\`\``
  },

  async ia() {
    const alive = await ollamaAlive()
    return alive
      ? `🧠 Motor de IA *activo* (Ollama en ${OLLAMA_HOST}, modelo \`${OLLAMA_MODEL}\`).`
      : `⚠️ No detecto Ollama en ${OLLAMA_HOST}. Levántalo con \`ollama serve\` y descarga el modelo con \`ollama pull ${OLLAMA_MODEL}\`.`
  },

  async reset(chatId) {
    resetHistory(chatId)
    return '🧹 Memoria de este chat limpia. ¡Empecemos de nuevo! ✨'
  },

  async restart() {
    setTimeout(() => process.exit(0), 800) // el gestor de procesos (pm2/systemd) me revive
    return '🔄 Reiniciando mi proceso, amo... vuelvo en un momento. ✨'
  }
}

/**
 * Intercepta comandos de admin con prefijo `!`.
 * Devuelve el texto de respuesta si era un comando de admin, o null si no lo era.
 * Valida SIEMPRE que el remitente sea el dueño.
 */
export async function handleAdminCommand(text, { sender, chatId }) {
  const match = String(text || '').trim().match(/^!([a-záéíóúñ]+)\b/i)
  if (!match) return null
  const name = match[1].toLowerCase()
  const action = ADMIN_COMMANDS[name]
  if (!action) return null

  if (sender !== OWNER_NUMBER) {
    return `🔒 Lo siento, el comando \`!${name}\` es solo para mi creador ${OWNER_ALIAS}. Tú no tienes acceso root. 😌`
  }
  try {
    return await action(chatId)
  } catch (e) {
    return `💥 El comando \`!${name}\` falló: \`${e.message}\``
  }
}

/* ── Inferencia keyless vía Ollama ────────────────────────────── */

async function ollamaAlive() {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: controller.signal })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

async function chatWithOllama(messages) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT)
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false }),
      signal: controller.signal
    })
    if (!res.ok) throw new Error(`Ollama respondió ${res.status}`)
    const data = await res.json()
    return data?.message?.content?.trim() || ''
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Ollama tardó demasiado en responder (timeout)')
    throw new Error(`No pude contactar a Ollama en ${OLLAMA_HOST}: ${e.message}`)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Punto de entrada del cerebro de Ruby.
 * 1. Intenta resolver comandos de admin (whitelist, owner-only).
 * 2. Si no, conversa usando Ollama con memoria circular.
 */
export async function rubyThink({ text, sender, chatId, pushName }) {
  const admin = await handleAdminCommand(text, { sender, chatId })
  if (admin !== null) return { text: admin, admin: true }

  const isOwner = sender === OWNER_NUMBER
  const contextNote = `[Usuario: ${pushName || 'desconocido'} · rol: ${isOwner ? `${OWNER_ALIAS} (tu creador)` : 'usuario normal'}]`

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...getHistory(chatId),
    { role: 'user', content: `${contextNote}\n${text}` }
  ]

  const reply = await chatWithOllama(messages)
  pushHistory(chatId, 'user', text)
  pushHistory(chatId, 'assistant', reply)
  return { text: reply || 'Me quedé sin palabras... intenta de nuevo. 🌸', admin: false }
}
