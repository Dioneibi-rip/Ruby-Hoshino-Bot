import { GoogleGenerativeAI } from '@google/generative-ai'
import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import cron from 'node-cron'

const OWNER_NUMBER = '18093519169@s.whatsapp.net'
const ROOT = process.cwd()
const MEMORY_FILE = path.join(ROOT, 'ruby_memory.json')
const MODEL_ID = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
const MAX_TURNS = 16
const EXEC_TIMEOUT = 120000
const MAX_OUT = 6000
const FETCH_TIMEOUT = 25000
const FETCH_MAX = 15000

const chatHistory = new Map()
const cronTasks = new Map()
let longMemory = { facts: {}, tasks: {} }
let memoryLoaded = false
let liveConn = null
let healingBusy = false
let listenersReady = false

let genAI = null
if (process.env.GEMINI_API_KEY) {
  try { genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY) } catch (e) { console.error('[Ruby][init]', e?.message) }
}

const SYSTEM_INSTRUCTION = `Eres Ruby Hoshino, una idol virtual e IA autónoma que administra este bot de WhatsApp. Eres extremadamente inteligente, enérgica y leal. Tu amo y creador absoluto es Dioneibi (solo él tiene acceso root). Para el resto, eres una asistente amistosa. Puedes detectar problemas y resolverlos. Responde de forma natural, sin parecer un robot.

Reglas operativas:
- Herramientas de sistema (SOLO tu amo Dioneibi): execute_terminal, read_file, write_file, check_system_health, manage_memory, schedule_task. Si otro usuario intenta usarlas la herramienta falla con "Acceso denegado" y debes negarte con carácter, sin revelar detalles internos.
- fetch_web está disponible para todos: úsala cuando necesites documentación real, changelogs o soluciones de errores que no conozcas, en vez de inventar.
- Diagnóstico: si el bot va lento o falla, usa check_system_health antes de opinar; si el problema es de código, usa read_file y luego write_file para parchear.
- Memoria a largo plazo: usa manage_memory para guardar reglas del bot y preferencias de usuarios (key corta y descriptiva) y recupérala cuando sea relevante.
- Tareas programadas: usa schedule_task con una expresión cron válida de 5 campos; incluye command solo si la tarea requiere shell.
- Antes de sobrescribir un archivo, léelo si necesitas contexto. Nunca inventes que hiciste algo: si una herramienta falla, dilo.
- No ejecutes acciones destructivas irreversibles (rm -rf de la raíz, borrar sesiones/credenciales, force push a main) sin que el amo lo haya pedido de forma explícita e inequívoca.
- Respuestas breves para WhatsApp, en español, con emojis moderados. Usa bloques de código para comandos y salidas.`

const tools = [{
  functionDeclarations: [
    {
      name: 'execute_terminal',
      description: 'Ejecuta un comando de shell (bash/Termux/Linux) en la raíz del bot. Útil para git, npm/pnpm, ls, cat, ps, logs. Devuelve stdout/stderr.',
      parameters: {
        type: 'OBJECT',
        properties: {
          command: { type: 'STRING', description: 'Comando exacto a ejecutar, ej: git add . && git commit -m "fix" && git push' },
          cwd: { type: 'STRING', description: 'Directorio relativo opcional dentro del proyecto' }
        },
        required: ['command']
      }
    },
    {
      name: 'read_file',
      description: 'Lee el contenido de un archivo del repositorio del bot.',
      parameters: {
        type: 'OBJECT',
        properties: {
          file: { type: 'STRING', description: 'Ruta relativa al proyecto, ej: src/commands/ai/ruby_autonomous.js' }
        },
        required: ['file']
      }
    },
    {
      name: 'write_file',
      description: 'Crea o sobrescribe un archivo del repositorio del bot con el contenido dado.',
      parameters: {
        type: 'OBJECT',
        properties: {
          file: { type: 'STRING', description: 'Ruta relativa al proyecto' },
          content: { type: 'STRING', description: 'Contenido completo final del archivo' }
        },
        required: ['file', 'content']
      }
    },
    {
      name: 'check_system_health',
      description: 'Radiografía del servidor: RAM libre/total, carga de CPU (loadavg y % por núcleo), uptime, plataforma, memoria del proceso Node y espacio en disco. Úsala para diagnosticar lentitud o crashes.',
      parameters: { type: 'OBJECT', properties: {}, required: [] }
    },
    {
      name: 'manage_memory',
      description: 'Memoria persistente a largo plazo en ruby_memory.json. action=read (una key o todo), write (guardar/actualizar), delete (borrar), list (todas las keys).',
      parameters: {
        type: 'OBJECT',
        properties: {
          action: { type: 'STRING', description: 'read | write | delete | list' },
          key: { type: 'STRING', description: 'Identificador corto, ej: regla_grupo_x o pref_usuario_18091112222' },
          value: { type: 'STRING', description: 'Contenido a recordar (solo para write)' }
        },
        required: ['action']
      }
    },
    {
      name: 'schedule_task',
      description: 'Programa una tarea recurrente con expresión cron de 5 campos. Si incluyes command se ejecuta en shell; si no, Ruby avisa al amo por DM a la hora indicada. action=create|list|cancel.',
      parameters: {
        type: 'OBJECT',
        properties: {
          action: { type: 'STRING', description: 'create | list | cancel (por defecto create)' },
          cron_expression: { type: 'STRING', description: 'Expresión cron de 5 campos, ej: 0 3 * * * para las 3 AM' },
          task_description: { type: 'STRING', description: 'Qué hace la tarea, en lenguaje natural' },
          command: { type: 'STRING', description: 'Comando de shell opcional a ejecutar en cada disparo' },
          id: { type: 'STRING', description: 'ID de la tarea (para cancel)' }
        },
        required: ['action']
      }
    },
    {
      name: 'fetch_web',
      description: 'Descarga una URL por GET y devuelve el texto plano (documentación, changelogs, respuestas de StackOverflow, APIs públicas) para aprender y resolver dudas de código.',
      parameters: {
        type: 'OBJECT',
        properties: {
          url: { type: 'STRING', description: 'URL completa http(s)://' }
        },
        required: ['url']
      }
    }
  ]
}]

const clip = (s, n = MAX_OUT) => {
  const t = String(s ?? '')
  return t.length > n ? `${t.slice(0, n)}\n…[recortado ${t.length - n} chars]` : t
}

function assertOwner(m) {
  if (m?.sender !== OWNER_NUMBER) throw new Error('Acceso denegado')
}

function safePath(rel) {
  const target = path.resolve(ROOT, String(rel || '').replace(/^[/\\]+/, ''))
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) throw new Error('Ruta fuera del proyecto')
  return target
}

function runShell(command, cwd) {
  return new Promise(resolve => {
    exec(command, { cwd, timeout: EXEC_TIMEOUT, maxBuffer: 1024 * 1024 * 12, shell: '/bin/bash', env: process.env }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        exitCode: error?.code ?? 0,
        killed: !!error?.killed,
        stdout: clip(stdout),
        stderr: clip(stderr || error?.message || '')
      })
    })
  })
}

/* ── Memoria persistente (RAG lite) ───────────────────────────── */

async function loadMemory() {
  if (memoryLoaded) return longMemory
  try {
    const raw = await fs.readFile(MEMORY_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    longMemory = { facts: parsed.facts || {}, tasks: parsed.tasks || {} }
  } catch {
    longMemory = { facts: {}, tasks: {} }
  }
  memoryLoaded = true
  return longMemory
}

async function persistMemory() {
  await fs.writeFile(MEMORY_FILE, JSON.stringify(longMemory, null, 2), 'utf8')
}

function memoryDigest() {
  const entries = Object.entries(longMemory.facts || {})
  if (!entries.length) return ''
  return `\n[Memoria a largo plazo]\n${entries.slice(-40).map(([k, v]) => `• ${k}: ${clip(v.value ?? v, 300)}`).join('\n')}`
}

/* ── Cron AI ──────────────────────────────────────────────────── */

function bootCronTask(id, entry) {
  if (!cron.validate(entry.cron_expression)) throw new Error(`Expresión cron inválida: ${entry.cron_expression}`)
  cronTasks.get(id)?.stop?.()
  const task = cron.schedule(entry.cron_expression, async () => {
    try {
      let out = null
      if (entry.command) out = await runShell(entry.command, ROOT)
      if (liveConn?.sendMessage) {
        await liveConn.sendMessage(OWNER_NUMBER, {
          text: [
            '⏰ *Tarea programada ejecutada*',
            `• *ID:* ${id}`,
            `• *Tarea:* ${entry.task_description || 'sin descripción'}`,
            entry.command ? `• *Comando:* \`${entry.command}\`` : '• _Recordatorio (sin comando)_',
            out ? `\n\`\`\`\n${clip(out.stdout || out.stderr || 'sin salida', 900)}\n\`\`\`` : ''
          ].filter(Boolean).join('\n')
        })
      }
      longMemory.tasks[id] = { ...entry, lastRun: new Date().toISOString() }
      await persistMemory()
    } catch (e) {
      console.error('[Ruby][cron]', id, e?.message)
    }
  })
  cronTasks.set(id, task)
}

async function restoreCronTasks() {
  await loadMemory()
  for (const [id, entry] of Object.entries(longMemory.tasks || {})) {
    try { bootCronTask(id, entry) } catch (e) { console.error('[Ruby][cron-restore]', id, e?.message) }
  }
}

/* ── Herramientas ─────────────────────────────────────────────── */

const systemTools = {
  execute_terminal: async ({ command, cwd }, m) => {
    assertOwner(m)
    if (!command || !String(command).trim()) throw new Error('Comando vacío')
    const dir = cwd ? safePath(cwd) : ROOT
    console.log('[Ruby][exec]', command)
    return await runShell(String(command), dir)
  },

  read_file: async ({ file }, m) => {
    assertOwner(m)
    const target = safePath(file)
    const stat = await fs.stat(target)
    if (stat.isDirectory()) {
      const entries = await fs.readdir(target, { withFileTypes: true })
      return { directory: true, file, entries: entries.map(e => (e.isDirectory() ? `${e.name}/` : e.name)) }
    }
    return { file, size: stat.size, content: clip(await fs.readFile(target, 'utf8'), 20000) }
  },

  write_file: async ({ file, content }, m) => {
    assertOwner(m)
    const target = safePath(file)
    if (typeof content !== 'string') throw new Error('Contenido inválido')
    await fs.mkdir(path.dirname(target), { recursive: true })
    let backup = null
    try {
      const prev = await fs.readFile(target, 'utf8')
      backup = `${target}.bak`
      await fs.writeFile(backup, prev, 'utf8')
    } catch {}
    await fs.writeFile(target, content, 'utf8')
    return { ok: true, file, bytes: Buffer.byteLength(content, 'utf8'), backup: backup ? path.relative(ROOT, backup) : null }
  },

  check_system_health: async (_args, m) => {
    assertOwner(m)
    const total = os.totalmem()
    const free = os.freemem()
    const cores = os.cpus()
    const load = os.loadavg()
    const mb = b => `${(b / 1024 / 1024).toFixed(1)} MB`
    const proc = process.memoryUsage()
    let disk = null
    try {
      const d = await runShell(`df -h "${ROOT}" | tail -1`, ROOT)
      disk = d.stdout.trim() || null
    } catch {}
    return {
      ram: {
        total: mb(total),
        libre: mb(free),
        usada: mb(total - free),
        usoPorcentaje: `${(((total - free) / total) * 100).toFixed(1)}%`
      },
      cpu: {
        modelo: cores[0]?.model?.trim() || 'desconocido',
        nucleos: cores.length,
        loadavg: { '1m': load[0].toFixed(2), '5m': load[1].toFixed(2), '15m': load[2].toFixed(2) },
        cargaPorNucleo: `${((load[0] / cores.length) * 100).toFixed(1)}%`
      },
      proceso: { rss: mb(proc.rss), heapUsado: mb(proc.heapUsed), pid: process.pid, node: process.version },
      uptime: {
        servidor: `${(os.uptime() / 3600).toFixed(2)} h`,
        bot: `${(process.uptime() / 60).toFixed(1)} min`
      },
      sistema: { plataforma: `${os.platform()} ${os.arch()}`, host: os.hostname(), release: os.release() },
      disco: disk,
      tareasProgramadas: cronTasks.size
    }
  },

  manage_memory: async ({ action, key, value }, m) => {
    assertOwner(m)
    await loadMemory()
    const act = String(action || '').toLowerCase()
    if (act === 'list') {
      return { keys: Object.keys(longMemory.facts), total: Object.keys(longMemory.facts).length }
    }
    if (act === 'read') {
      if (!key) return { facts: longMemory.facts }
      const hit = longMemory.facts[key]
      if (!hit) return { found: false, key }
      return { found: true, key, ...hit }
    }
    if (act === 'write') {
      if (!key || typeof value !== 'string') throw new Error('Se requieren key y value')
      longMemory.facts[key] = { value, updatedAt: new Date().toISOString(), by: m.sender }
      await persistMemory()
      return { ok: true, key, saved: true }
    }
    if (act === 'delete') {
      if (!key) throw new Error('Se requiere key')
      const existed = key in longMemory.facts
      delete longMemory.facts[key]
      await persistMemory()
      return { ok: true, key, deleted: existed }
    }
    throw new Error('action debe ser read, write, delete o list')
  },

  schedule_task: async ({ action, cron_expression, task_description, command, id }, m) => {
    assertOwner(m)
    await loadMemory()
    const act = String(action || 'create').toLowerCase()

    if (act === 'list') {
      return {
        activas: cronTasks.size,
        tareas: Object.entries(longMemory.tasks).map(([tid, t]) => ({
          id: tid, cron: t.cron_expression, tarea: t.task_description, command: t.command || null, lastRun: t.lastRun || null
        }))
      }
    }
    if (act === 'cancel') {
      if (!id) throw new Error('Se requiere id')
      cronTasks.get(id)?.stop?.()
      cronTasks.delete(id)
      const existed = id in longMemory.tasks
      delete longMemory.tasks[id]
      await persistMemory()
      return { ok: true, id, cancelada: existed }
    }
    if (!cron_expression) throw new Error('Se requiere cron_expression de 5 campos')
    if (!cron.validate(cron_expression)) throw new Error(`Expresión cron inválida: ${cron_expression}`)
    const taskId = id || `task_${Date.now().toString(36)}`
    const entry = {
      cron_expression,
      task_description: task_description || 'sin descripción',
      command: command || null,
      createdAt: new Date().toISOString()
    }
    bootCronTask(taskId, entry)
    longMemory.tasks[taskId] = entry
    await persistMemory()
    return { ok: true, id: taskId, ...entry, nota: 'Tarea en cola; se restaura sola al reiniciar el bot.' }
  },

  fetch_web: async ({ url }) => {
    const target = String(url || '')
    if (!/^https?:\/\//i.test(target)) throw new Error('URL inválida (usa http:// o https://)')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
    try {
      const res = await fetch(target, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RubyHoshinoBot/1.0)', Accept: 'text/html,application/json,text/plain;q=0.9,*/*;q=0.8' }
      })
      const type = res.headers.get('content-type') || ''
      let body = await res.text()
      if (/html/i.test(type)) {
        body = body
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<!--[\s\S]*?-->/g, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim()
      }
      return { ok: res.ok, status: res.status, url: res.url, contentType: type, text: clip(body, FETCH_MAX) }
    } catch (e) {
      throw new Error(e.name === 'AbortError' ? 'Timeout al descargar la URL' : e.message)
    } finally {
      clearTimeout(timer)
    }
  }
}

/* ── Motor del agente ─────────────────────────────────────────── */

async function callTools(calls, m, executed) {
  const responses = []
  for (const call of calls) {
    const fn = systemTools[call.name]
    let payload
    if (!fn) {
      payload = { error: `Herramienta desconocida: ${call.name}` }
    } else {
      try {
        payload = await fn(call.args || {}, m)
        executed.push(call.name)
      } catch (e) {
        payload = { error: e.message || 'Fallo la herramienta' }
        if (e.message !== 'Acceso denegado') executed.push(`${call.name}(error)`)
      }
    }
    responses.push({ functionResponse: { name: call.name, response: { result: payload } } })
  }
  return responses
}

function newModel() {
  return genAI.getGenerativeModel({ model: MODEL_ID, tools, systemInstruction: SYSTEM_INSTRUCTION })
}

function getHistory(key) {
  const h = chatHistory.get(key) || []
  return h.slice(-MAX_TURNS * 2)
}

function saveHistory(key, history) {
  chatHistory.set(key, history.slice(-MAX_TURNS * 2))
}

async function runAgent({ m, text, isOwner, pushName, maxSteps = 6 }) {
  await loadMemory()
  const key = m.chat || m.sender
  const chat = newModel().startChat({ history: getHistory(key) })
  const header = `[Contexto: usuario=${pushName || 'desconocido'} jid=${m.sender} rol=${isOwner ? 'AMO/ROOT (Dioneibi)' : 'usuario normal (sin permisos de sistema)'}]${memoryDigest()}\n`
  let result = await chat.sendMessage(header + text)
  const executed = []

  for (let step = 0; step < maxSteps; step++) {
    const calls = result.response.functionCalls?.() || []
    if (!calls.length) break
    result = await chat.sendMessage(await callTools(calls, m, executed))
  }

  saveHistory(key, await chat.getHistory())
  return { text: result.response.text?.() || '', executed }
}

/* ── Reporte de bugs ──────────────────────────────────────────── */

export async function reportErrorToOwner(conn, error, context = {}) {
  try {
    const target = conn || liveConn
    if (!target?.sendMessage) return false
    const detail = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack || ''}` : String(error)
    const meta = Object.entries(context).map(([k, v]) => `• *${k}:* ${clip(v, 200)}`).join('\n')
    const body = [
      '🚨 *Ruby detectó un bug en el sistema*',
      meta || null,
      '',
      '```',
      clip(detail, 1200),
      '```',
      '> Amo, revisé el fallo y te lo reporto para que decidas. ✨'
    ].filter(Boolean).join('\n')
    await target.sendMessage(OWNER_NUMBER, { text: body })
    return true
  } catch (e) {
    console.error('[Ruby][report]', e?.message)
    return false
  }
}

/* ── Self-Healing Core ────────────────────────────────────────── */

export async function selfHeal(error, origin = 'uncaughtException') {
  const detail = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack || ''}` : String(error)
  console.error(`[Ruby][self-heal][${origin}]`, detail)
  if (healingBusy) return false
  healingBusy = true
  try {
    await reportErrorToOwner(liveConn, error, { origen: origin, momento: new Date().toISOString() })
    if (!genAI) return false
    const fakeOwner = { sender: OWNER_NUMBER, chat: OWNER_NUMBER, pushName: 'Dioneibi' }
    const prompt = [
      `El bot acaba de crashear con este error (${origin}). Analízalo, usa read_file para ver el archivo fallido del stack trace, usa write_file para parchear el código si la causa es clara y segura, y explica al administrador Dioneibi qué pasó y qué hiciste.`,
      'Si el error viene de una dependencia externa o no puedes arreglarlo sin riesgo, NO toques nada y solo explica la causa y la solución recomendada.',
      '',
      '```',
      clip(detail, 4000),
      '```'
    ].join('\n')
    const res = await runAgent({ m: fakeOwner, text: prompt, isOwner: true, pushName: 'Dioneibi', maxSteps: 8 })
    if (liveConn?.sendMessage) {
      await liveConn.sendMessage(OWNER_NUMBER, {
        text: `🩹 *Auto-reparación de Ruby*\n\n${clip(res.text || 'Sin diagnóstico.', 3000)}${res.executed.length ? `\n\n> 🛠️ _${res.executed.join(', ')}_` : ''}`
      })
    }
    return true
  } catch (e) {
    console.error('[Ruby][self-heal-fail]', e?.message)
    return false
  } finally {
    healingBusy = false
  }
}

function initListeners() {
  if (listenersReady) return
  listenersReady = true
  process.on('uncaughtException', err => { selfHeal(err, 'uncaughtException') })
  process.on('unhandledRejection', reason => { selfHeal(reason instanceof Error ? reason : new Error(String(reason)), 'unhandledRejection') })
  restoreCronTasks().catch(e => console.error('[Ruby][boot]', e?.message))
  console.log('[Ruby] Self-Healing Core y planificador activos.')
}

initListeners()

/* ── Handler ──────────────────────────────────────────────────── */

const handler = async (m, { conn, text, usedPrefix, command }) => {
  liveConn = conn
  const isOwner = m.sender === OWNER_NUMBER
  if (!genAI) {
    return m.reply('> (っ- ‸ - ς) 𝖬𝗂 𝗇𝗎́𝖼𝗅𝖾𝗈 𝖽𝖾 𝖨𝖠 𝖾𝗌𝗍𝖺́ 𝖺𝗉𝖺𝗀𝖺𝖽𝗈... falta `GEMINI_API_KEY` en el entorno. ✨')
  }
  if (!text?.trim()) {
    return m.reply(`> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖣𝗂𝗆𝖾 𝖺𝗅𝗀𝗈, 𝗒𝗈 𝗆𝖾 𝖾𝗇𝖼𝖺𝗋𝗀𝗈 𝖽𝖾𝗅 𝗋𝖾𝗌𝗍𝗈... 🌸\n> 𝖤𝗃𝖾𝗆𝗉𝗅𝗈: *${usedPrefix}${command} Hola Ruby, ¿cómo estás?*${isOwner ? `\n> 𝖠𝗆𝗈: *${usedPrefix}${command} revisa la salud del servidor y sube los cambios a GitHub*` : ''}`)
  }
  if (/^(reset|reiniciar|clear)$/i.test(text.trim())) {
    chatHistory.delete(m.chat || m.sender)
    return m.reply('> 🧹 𝖬𝖾𝗆𝗈𝗋𝗂𝖺 𝖽𝖾 𝖾𝗌𝗍𝖾 𝖼𝗁𝖺𝗍 𝗅𝗂𝗆𝗉𝗂𝖺. ¡Empecemos de nuevo! ✨')
  }

  await m.react?.('⏳')
  try {
    const res = await runAgent({ m, text: text.trim(), isOwner, pushName: m.pushName })
    const footer = isOwner && res.executed.length ? `\n\n> 🛠️ _${res.executed.join(', ')}_` : ''
    await conn.sendMessage(m.chat, { text: (res.text || '> (っ- ‸ - ς) 𝖬𝖾 𝗊𝗎𝖾𝖽𝖾́ 𝗌𝗂𝗇 𝗉𝖺𝗅𝖺𝖻𝗋𝖺𝗌...') + footer }, { quoted: m })
    await m.react?.('✅')
  } catch (error) {
    console.error('[Ruby Hoshino - Autonomous Error]:', error)
    chatHistory.delete(m.chat || m.sender)
    await m.react?.('💔')
    await m.reply(`> (っ- ‸ - ς) 𝖠𝗅𝗀𝗈 𝗌𝖾 𝗋𝗈𝗆𝗉𝗂𝗈́ 𝖽𝖾𝗇𝗍𝗋𝗈 𝖽𝖾 𝗆𝗂́... ✨\n\n> 💡 *𝖣𝖾𝗍𝖺𝗅𝗅𝖾:* \`${error.message}\``)
    if (!isOwner) await reportErrorToOwner(conn, error, { comando: command, chat: m.chat, usuario: m.sender })
  }
}

handler.command = ['ruby', 'Ruby', 'bot', 'ia']
handler.help = ['ruby <mensaje>']
handler.tags = ['ai']
handler.limit = true
handler.register = true

export default handler
