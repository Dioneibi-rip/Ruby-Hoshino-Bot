/**
 * Ruby Hoshino — Toolkit de LangChain (Function Calling real).
 *
 * Cada capacidad es una StructuredTool con schema zod, así que el modelo ya no
 * escribe etiquetas [TOOL: args] que un regex tiene que adivinar: emite
 * tool_calls con argumentos tipados y LangChain los valida antes de ejecutar.
 *
 * Las tools se construyen POR PETICIÓN (`buildTools(m, hooks)`) porque necesitan
 * cerrar sobre el mensaje vivo `m`: de ahí sale el socket de Baileys, el chat,
 * las menciones y la identidad de quien habla (permisos).
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import fs from 'fs/promises'
import { readFileSync } from 'fs'
import path from 'path'
import os from 'os'
import cron from 'node-cron'
import {
    ROOT, REPO_SLUG, MAX_OUT, SECRET_GREP_EXCLUDES,
    clip, shellQuote, runShell, describeShape, safePath,
    assertOwner, assertReadable, isDioneibiMessage, isOwnerJid,
    requireConn, botJidOf, dmOwner, getMeta, resolveJidInput,
    assertBotAdmin, guardTarget, actionJidOf, matchParticipant,
    loadMemory, saveMemory, memoryRef, registerCron, stopCron
} from './runtime.js'

/* ── Registro de APIs del bot ─────────────────────────────────────
   Endpoints que el propio bot consume. Ruby puede testearlos por nombre
   ("catbox", "tikwm") sin que Dioneibi tenga que recordar la URL exacta. */

export const KNOWN_APIS = {
    catbox: 'https://catbox.moe/user/api.php',
    quax: 'https://qu.ax',
    tikwm: 'https://www.tikwm.com/api/',
    telegraph: 'https://telegra.ph',
    ephoto360: 'https://en.ephoto360.com',
    ezgif: 'https://ezgif.com',
    github: `https://api.github.com/repos/${REPO_SLUG}`,
    githubraw: 'https://raw.githubusercontent.com',
    tenor: 'https://media.tenor.com',
    pinterest: 'https://i.pinimg.com',
    tioanime: 'https://tioanime.com',
    fdownloader: 'https://fdownloader.net',
    openrouter: 'https://openrouter.ai/api/v1/models'
}

/* Tope de subida. WhatsApp acepta bastante más, pero el archivo se carga ENTERO
   en RAM como Buffer antes de enviarse: sin techo, un `send_file_to_whatsapp`
   sobre un log de 500MB tumba el proceso por heap out of memory. */
const MAX_UPLOAD_BYTES = 48 * 1024 * 1024

/* Mimetypes de lo que Ruby manda de verdad (código, logs, configs). Lo que no
   esté aquí viaja como binario genérico, que WhatsApp igual acepta. */
const MIME_BY_EXT = {
    '.js': 'text/javascript', '.mjs': 'text/javascript', '.cjs': 'text/javascript',
    '.json': 'application/json', '.md': 'text/markdown', '.txt': 'text/plain',
    '.log': 'text/plain', '.env': 'text/plain', '.yml': 'text/yaml', '.yaml': 'text/yaml',
    '.html': 'text/html', '.css': 'text/css', '.csv': 'text/csv', '.xml': 'application/xml',
    '.zip': 'application/zip', '.pdf': 'application/pdf',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
    '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.sqlite': 'application/x-sqlite3'
}

/* ── TRUNCAMIENTO: la causa raíz de los 413/429 ────────────────────
   Cada resultado de tool NO se lee una vez: vuelve al modelo dentro del payload
   en TODAS las iteraciones siguientes. Un `read_file` de 15k chars no cuesta
   ~4k tokens una vez, cuesta ~4k tokens × los pasos que queden. Por eso el tope
   se aplica aquí, en la frontera con el modelo, y no dentro de cada tool: es el
   único sitio por el que pasa absolutamente todo lo que Ruby llega a ver.

   TOOL_LIMITS son las excepciones: tools cuya salida es INÚTIL recortada a 300
   (un archivo de 8 líneas no se puede analizar, un stack de sintaxis cortado no
   dice dónde falla). Todo lo demás cae al default de 300. */
const DEFAULT_TOOL_LIMIT = 300
const ERROR_LIMIT = 100

const TOOL_LIMITS = {
    read_file: 1500,       // sin esto Ruby no puede analizar código de verdad
    wa_group_info: 1200,   // 300 chars no alcanzan ni para un participante
    execute_terminal: 800,
    grep_code: 800,
    find_files: 800,
    list_dir: 800,
    syntax_check: 800,     // el stack de node --check debe llegar completo
    read_logs: 800,
    fetch_api_status: 800,
    command_lookup: 600,
    recall_memory: 600,
    health_check: 500,
    git_push: 500
}

/** Corta cualquier salida antes de que llegue al modelo. */
function truncateForModel(value, limit) {
    const text = String(value ?? '(sin salida)')
    if (text.length <= limit) return text
    return `${text.slice(0, limit)}\n...[Output recortado por seguridad: ${text.length - limit} chars omitidos. Busca más fino si necesitas el resto.]`
}

/**
 * Los errores de las tools NO se lanzan: se devuelven como texto al modelo.
 * Así una acción denegada o una API caída se convierte en información que Ruby
 * puede explicar en su voz, en lugar de romper el grafo del agente.
 *
 * Los stack traces se DESCARTAN sin piedad: un throw de Baileys arrastra miles
 * de chars de trazas internas que al modelo no le dicen nada y que reventaban el
 * presupuesto de tokens del turno entero. Solo pasa el mensaje, y solo 100 chars.
 */
function safeTool(fn, limit = DEFAULT_TOOL_LIMIT) {
    return async (input) => {
        try {
            return truncateForModel(await fn(input), limit)
        } catch (err) {
            const msg = String(err?.message || err).slice(0, ERROR_LIMIT)
            return /^(ERROR|ACCESO DENEGADO)/i.test(msg) ? msg : `Error: ${msg}`
        }
    }
}

/** `tool()` con el tope de salida ya resuelto a partir del nombre. */
function cappedTool(fn, config) {
    return tool(safeTool(fn, TOOL_LIMITS[config.name] ?? DEFAULT_TOOL_LIMIT), config)
}

/** Solo lo DESTRUCTIVO o lo que da control del sistema queda vetado a terceros.
    La lectura y el diagnóstico están disponibles para todos (con el filtro de
    secretos de `assertReadable`) para que Ruby pueda dar soporte técnico real.

    Declarado ANTES de `buildTools` a propósito: `TOOL_NAMES` invoca `buildTools`
    en tiempo de carga del módulo, así que si este Set se declarara más abajo
    caeríamos en la zona muerta (TDZ) del `const` y el import explotaría. */
export const OWNER_ONLY = new Set([
    'execute_terminal', 'write_file', 'append_file', 'read_logs', 'run_bot_command', 'git_push',
    'wa_send_message', 'send_file_to_whatsapp', 'wa_kick', 'wa_promote', 'wa_demote', 'wa_delete_message',
    'run_background_task', 'schedule_message', 'remember_fact', 'forget_fact'
])

/**
 * @param {object} m       Mensaje vivo de Baileys (socket, chat, permisos).
 * @param {object} hooks   { queueBackgroundTask } inyectado por el agente.
 * @param {object} opts    { forceAll } ignora el gating (solo para TOOL_NAMES).
 */
export function buildTools(m, hooks = {}, opts = {}) {
    const owner = () => assertOwner(m)

    /* ---------- Sistema operativo y archivos ---------- */

    const executeTerminal = cappedTool(async ({ comando }) => {
        owner()
        const cmd = String(comando || '').trim()
        if (!cmd) return 'ERROR: no me diste ningún comando que ejecutar.'
        const res = await runShell(cmd)
        return `exit=${res.exitCode}\nSTDOUT:\n${res.stdout || '(vacío)'}\nSTDERR:\n${res.stderr || '(vacío)'}`
    }, {
        name: 'execute_terminal',
        description: 'Shell en la raíz del repo. Devuelve stdout/stderr/exit.',
        schema: z.object({ comando: z.string() })
    })

    const findFiles = cappedTool(async ({ nombre }) => {
        assertReadable(nombre, m)
        const needle = String(nombre || '').trim()
        if (!needle) return 'ERROR: dime qué archivo buscar.'
        const pattern = needle.includes('*') ? needle : `*${needle}*`
        const res = await runShell(`find . -path ./node_modules -prune -o -path ./.git -prune -o -iname ${shellQuote(pattern)} -print | head -60`)
        const list = (res.stdout || '').trim()
        return list ? `Coincidencias para "${needle}":\n${list}` : `Sin resultados para "${needle}". Prueba otro nombre o usa grep_code.`
    }, {
        name: 'find_files',
        description: 'Busca archivos por nombre. Úsalo antes de asumir una ruta.',
        schema: z.object({ nombre: z.string() })
    })

    const grepCode = cappedTool(async ({ texto }) => {
        assertReadable(texto, m)
        const needle = String(texto || '').trim()
        if (!needle) return 'ERROR: dime qué texto buscar.'
        // A los usuarios normales se les excluyen los archivos con credenciales.
        const shield = isDioneibiMessage(m) ? '' : SECRET_GREP_EXCLUDES
        const res = await runShell(`grep -rniI --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=tmp${shield} ${shellQuote(needle)} . | head -50`)
        const list = (res.stdout || '').trim()
        return list ? `"${needle}":\n${list}` : `No encontré "${needle}" en el código.`
    }, {
        name: 'grep_code',
        description: 'Busca texto en el código: devuelve archivo y línea.',
        schema: z.object({ texto: z.string() })
    })

    const listDir = cappedTool(async ({ carpeta }) => {
        assertReadable(carpeta, m)
        const target = safePath(carpeta || '.')
        const entries = await fs.readdir(target, { withFileTypes: true })
        const body = entries.map(e => `${e.isDirectory() ? 'DIR ' : 'FILE'} ${e.name}`).join('\n')
        return `${path.relative(ROOT, target) || '.'} (${entries.length} entradas)\n${clip(body, 4000)}`
    }, {
        name: 'list_dir',
        description: 'Lista una carpeta. Vacío = raíz.',
        schema: z.object({ carpeta: z.string().optional() })
    })

    const readFile = cappedTool(async ({ ruta }) => {
        assertReadable(ruta, m)
        const target = safePath(ruta)
        const stat = await fs.stat(target).catch(() => null)
        if (!stat) return `ERROR: no existe "${String(ruta).trim()}". Usa find_files con "${path.basename(String(ruta).trim())}" para localizarlo.`
        if (stat.isDirectory()) {
            const entries = await fs.readdir(target, { withFileTypes: true })
            return `"${ruta}" es una carpeta (${entries.length} entradas):\n${entries.map(e => `${e.isDirectory() ? 'DIR ' : 'FILE'} ${e.name}`).join('\n')}`
        }
        const content = await fs.readFile(target, 'utf8')
        const lines = content.split('\n')
        const numbered = lines.map((l, i) => `${String(i + 1).padStart(4, ' ')}| ${l}`).join('\n')
        return `${path.relative(ROOT, target)} (${lines.length} líneas)\n${clip(numbered, 15000)}`
    }, {
        name: 'read_file',
        description: 'Lee un archivo con números de línea.',
        schema: z.object({ ruta: z.string() })
    })

    const writeFile = cappedTool(async ({ ruta, contenido }) => {
        owner()
        if (!String(ruta || '').trim()) return 'ERROR: dime la ruta del archivo a escribir.'
        const target = safePath(ruta)
        await fs.mkdir(path.dirname(target), { recursive: true })
        await fs.writeFile(target, String(contenido ?? ''), 'utf8')
        let extra = ''
        if (target.endsWith('.js')) {
            const check = await runShell(`node --check ${shellQuote(target)}`, ROOT, 20000)
            extra = check.ok ? '\nSintaxis JS: OK ✅' : `\nSintaxis JS: FALLA ❌\n${check.stderr}`
        }
        return `Guardado ${path.relative(ROOT, target)} (${String(contenido ?? '').length} chars).${extra}`
    }, {
        name: 'write_file',
        description: 'Crea/sobrescribe un archivo con el contenido COMPLETO. Valida .js al terminar.',
        schema: z.object({ ruta: z.string(), contenido: z.string() })
    })

    const appendFile = cappedTool(async ({ ruta, contenido }) => {
        owner()
        if (!String(ruta || '').trim()) return 'ERROR: dime la ruta del archivo.'
        const target = safePath(ruta)
        await fs.mkdir(path.dirname(target), { recursive: true })
        await fs.appendFile(target, `\n${String(contenido ?? '')}`, 'utf8')
        return `Añadidos ${String(contenido ?? '').length} chars a ${path.relative(ROOT, target)}.`
    }, {
        name: 'append_file',
        description: 'Añade al final de un archivo sin borrar lo existente.',
        schema: z.object({ ruta: z.string(), contenido: z.string() })
    })

    const syntaxCheck = cappedTool(async ({ ruta }) => {
        assertReadable(ruta, m)
        const raw = String(ruta || '').trim()
        if (!raw) {
            const res = await runShell(`for f in index.js settings.js $(find src -name '*.js' -not -path '*/node_modules/*'); do node --check "$f" 2>&1 | head -3; done`, ROOT, 180000)
            const errs = (res.stdout || '').trim()
            return errs ? `Errores detectados en el proyecto:\n${clip(errs, 4000)}` : 'Todo el proyecto compila sin errores de sintaxis ✅'
        }
        const target = safePath(raw)
        const res = await runShell(`node --check ${shellQuote(target)}`, ROOT, 20000)
        return res.ok ? `${path.relative(ROOT, target)} → sintaxis OK ✅` : `${path.relative(ROOT, target)} → ERROR ❌\n${res.stderr}`
    }, {
        name: 'syntax_check',
        description: 'node --check. Sin ruta audita todo. Obligatorio antes de git_push.',
        schema: z.object({ ruta: z.string().optional() })
    })

    const readLogs = cappedTool(async ({ lineas }) => {
        owner()
        const n = Math.min(Math.max(parseInt(String(lineas ?? 60).replace(/\D/g, ''), 10) || 60, 10), 300)
        const res = await runShell(`(command -v pm2 >/dev/null 2>&1 && pm2 logs --nostream --lines ${n} 2>/dev/null) || (ls -t *.log tmp/*.log logs/*.log 2>/dev/null | head -1 | xargs -r tail -n ${n}) || echo "SIN_LOGS"`, ROOT, 30000)
        const out = (res.stdout || '').trim()
        return out && out !== 'SIN_LOGS'
            ? `Últimas ${n} líneas:\n${clip(out, 6000)}`
            : 'No hay archivos de log accesibles. El proceso probablemente escribe a stdout del panel; usa execute_terminal con el comando del panel si lo necesitas.'
    }, {
        name: 'read_logs',
        description: 'Últimas líneas de logs (pm2/.log) para diagnosticar crashes.',
        schema: z.object({ lineas: z.number().int().optional() })
    })

    const healthCheck = cappedTool(async () => {
        const total = os.totalmem()
        const free = os.freemem()
        const mem = process.memoryUsage()
        const disk = await runShell('df -h . | tail -1', ROOT, 15000)
        return [
            `RAM sistema: ${(((total - free) / total) * 100).toFixed(1)}% usada (${(free / 1048576).toFixed(0)}MB libres)`,
            `RSS del bot: ${(mem.rss / 1048576).toFixed(1)}MB | Heap: ${(mem.heapUsed / 1048576).toFixed(1)}MB`,
            `CPU cores: ${os.cpus().length} | Load: ${os.loadavg().map(n => n.toFixed(2)).join(' ')}`,
            `Uptime SO: ${(os.uptime() / 3600).toFixed(2)}h | Uptime bot: ${(process.uptime() / 60).toFixed(1)}min`,
            `Plataforma: ${os.platform()} ${os.arch()} | Node ${process.version}`,
            `Disco: ${(disk.stdout || '').trim()}`
        ].join('\n')
    }, {
        name: 'health_check',
        description: 'Tus signos vitales: RAM, CPU, load, uptime, disco, Node.',
        schema: z.object({})
    })

    /* ---------- Bot y desarrollo ---------- */

    const commandLookup = cappedTool(async ({ nombre }) => {
        const needle = String(nombre || '').trim().replace(/^[#/!.]/, '').toLowerCase()
        if (!needle) return 'ERROR: dime el nombre del comando a buscar.'
        const { commandRegistry } = await import('../../../runtime/command-registry.js')
        await commandRegistry.init()
        const exact = commandRegistry.get(needle)
        if (exact) {
            return [
                `"${needle}" encontrado:`,
                `Archivo: ${path.relative(ROOT, exact.filePath)}`,
                `Alias: ${(exact.commands || []).join(', ')}`,
                `Categoría: ${exact.category}`,
                `Ayuda: ${(exact.help || []).join(' | ') || 'sin ayuda'}`,
                `Permisos: ${JSON.stringify(exact.permissions || {})}`
            ].join('\n')
        }
        const similar = commandRegistry.all()
            .filter(meta => (meta.commands || []).some(c => String(c).includes(needle)) || String(meta.name).includes(needle))
            .slice(0, 12)
        if (!similar.length) return `No existe ningún comando parecido a "${needle}".`
        return `No hay match exacto. Parecidos:\n${similar.map(s => `- ${(s.commands || []).join('/')} → ${path.relative(ROOT, s.filePath)}`).join('\n')}`
    }, {
        name: 'command_lookup',
        description: 'Archivo, alias, categoría y permisos de un comando del bot. Úsalo antes de analizarlo.',
        schema: z.object({ nombre: z.string() })
    })

    const runBotCommand = cappedTool(async ({ comando, argumentos, objetivo }) => {
        owner()
        const conn = requireConn(m)
        const name = String(comando || '').trim().replace(/^[#/!.]/, '')
        if (!name) return 'ERROR: dime qué comando del bot ejecutar.'
        let mentioned = []
        if (objetivo) {
            try { mentioned = [await resolveJidInput(objetivo, m)] } catch {}
        }
        try {
            const { commandRegistry } = await import('../../../runtime/command-registry.js')
            await commandRegistry.init()
            if (!commandRegistry.has(name.toLowerCase())) {
                return `ERROR: el comando "${name}" no existe en el registro. Verifícalo con command_lookup.`
            }
        } catch {}
        const body = `.${name}${argumentos ? ` ${argumentos}` : ''}${mentioned.length ? ` @${mentioned[0].split('@')[0]}` : ''}`
        const isGroup = String(m.chat || '').endsWith('@g.us')
        const fakeRaw = {
            key: {
                remoteJid: m.chat,
                fromMe: false,
                id: `RUBY${Date.now().toString(36).toUpperCase()}`,
                participant: isGroup ? m.sender : undefined
            },
            messageTimestamp: Math.floor(Date.now() / 1000),
            pushName: m.pushName || 'Dioneibi',
            message: { extendedTextMessage: { text: body, contextInfo: { mentionedJid: mentioned } } }
        }
        const { handler: routerHandler } = await import('../../../router/handler.js')
        // Se despacha sin bloquear el agente: el comando responde por su cuenta al chat.
        Promise.resolve(routerHandler.call(conn, { messages: [fakeRaw], type: 'notify' }))
            .catch(err => console.error('[Ruby run_bot_command]', err?.message || err))
        return `Inyecté "${body}" en el router del bot como si lo hubiera escrito el usuario. La respuesta del comando llegará al chat por separado. Si no llega nada, el comando está roto: revísalo con command_lookup y read_file.`
    }, {
        name: 'run_bot_command',
        description: 'Ejecuta un comando del bot en el router, como si un usuario lo escribiera.',
        schema: z.object({
            comando: z.string(),
            argumentos: z.string().optional(),
            objetivo: z.string().optional().describe('Número/JID a mencionar.')
        })
    })

    const fetchApiStatus = cappedTool(async ({ url }) => {
        let raw = String(url || '').trim().replace(/^<|>$/g, '')
        if (!raw) return `ERROR: dame una URL o el nombre de una API conocida. Disponibles: ${Object.keys(KNOWN_APIS).join(', ')}.`
        if (/^(list|lista|apis|conocidas)$/i.test(raw)) {
            return `APIs registradas del bot:\n${Object.entries(KNOWN_APIS).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
        }
        // Permite "catbox" en lugar de la URL completa.
        const alias = KNOWN_APIS[raw.toLowerCase()]
        let target = alias || raw
        if (!/^https?:\/\//i.test(target)) target = `https://${target}`
        let parsed
        try { parsed = new URL(target) } catch { return `ERROR: "${target}" no es una URL válida.` }
        // SSRF: nunca dejamos que el modelo apunte a la red interna del servidor.
        if (/^(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.)/i.test(parsed.hostname)) {
            return 'ERROR: bloqueé la petición porque apunta a la red interna del servidor.'
        }
        const started = Date.now()
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 25000)
        try {
            const res = await fetch(parsed.href, {
                signal: controller.signal,
                redirect: 'follow',
                headers: { 'User-Agent': `RubyHoshinoBot/3.0 (+https://github.com/${REPO_SLUG})` }
            })
            const ms = Date.now() - started
            const type = res.headers.get('content-type') || 'desconocido'
            const head = [
                `${parsed.href}${alias ? ` (alias "${raw}")` : ''}`,
                `Status: ${res.status} ${res.statusText}`,
                `Content-Type: ${type}`,
                `Content-Length: ${res.headers.get('content-length') || '?'}`,
                `Latencia: ${ms}ms`
            ].join('\n')
            if (/application\/json|text\/json/i.test(type)) {
                const body = await res.text()
                let json
                try { json = JSON.parse(body) } catch {
                    return `${head}\nVEREDICTO: dice ser JSON pero NO parsea. La API devuelve basura o HTML de error.\nCuerpo:\n${clip(body, 1200)}`
                }
                return `${head}\nEstructura:\n${describeShape(json)}\nMuestra:\n${clip(JSON.stringify(json, null, 1), 2500)}\nAnaliza si los campos que el bot espera siguen existiendo.`
            }
            if (/^text\/|xml|javascript/i.test(type)) {
                return `${head}\nCuerpo (texto):\n${clip(await res.text(), 1500)}`
            }
            const buf = Buffer.from(await res.arrayBuffer())
            return `${head}\nRespuesta binaria (${buf.length} bytes). Firma: ${buf.subarray(0, 8).toString('hex')}\nVEREDICTO: ${res.ok && buf.length > 1024 ? 'parece un archivo válido (imagen/audio/video), la API responde bien.' : 'respuesta binaria sospechosamente pequeña, probablemente rota.'}`
        } catch (e) {
            const ms = Date.now() - started
            return `${parsed.href}\nFALLO tras ${ms}ms: ${e.name === 'AbortError' ? 'timeout (25s), la API no responde.' : e.message}\nVEREDICTO: la API está caída o bloqueando al servidor.`
        } finally {
            clearTimeout(timer)
        }
    }, {
        name: 'fetch_api_status',
        /* El registro de APIs ya no se inyecta en la descripción: eran cientos de
           tokens fijos en cada petición. Con "list" Ruby lo consulta si le hace
           falta, pagando esos tokens solo cuando de verdad los necesita. */
        description: 'GET a una API y diagnostica si vive: status, latencia y forma del JSON.',
        schema: z.object({
            url: z.string().describe('URL, alias de API del bot, o "list".')
        })
    })

    const gitPush = cappedTool(async ({ mensaje }) => {
        owner()
        const token = process.env.GITHUB_TOKEN
        if (!token) return 'ERROR: falta configurar GITHUB_TOKEN. Explícale a Dioneibi que debe agregar GITHUB_TOKEN=ghp_xxx en el .env del proyecto (o en las variables del panel) para que yo pueda subir cambios.'
        const commitMsg = String(mensaje || '').trim() || `Ruby Hoshino: cambios automáticos ${new Date().toISOString()}`
        const isRepo = await runShell('git rev-parse --is-inside-work-tree', ROOT, 20000)
        if (!isRepo.ok) return 'ERROR: esta carpeta no es un repositorio git.'
        const status = await runShell('git status --porcelain', ROOT, 30000)
        if (!status.stdout.trim()) return 'No hay cambios pendientes, el repositorio ya está limpio.'
        await runShell('git add -A', ROOT, 60000)
        const staged = await runShell('git diff --cached --name-only', ROOT, 30000)
        const jsFiles = staged.stdout.split('\n').map(s => s.trim()).filter(f => f.endsWith('.js'))
        // Nunca subimos código roto: si algo no compila, abortamos y deshacemos el stage.
        for (const file of jsFiles.slice(0, 40)) {
            if (!await fs.stat(path.join(ROOT, file)).catch(() => null)) continue
            const check = await runShell(`node --check ${shellQuote(file)}`, ROOT, 20000)
            if (!check.ok) {
                await runShell('git reset', ROOT, 30000)
                return `ERROR: aborté el push. ${file} tiene un error de sintaxis y no voy a subir código roto:\n${check.stderr}`
            }
        }
        const identity = `-c user.name=${shellQuote('Ruby Hoshino Bot')} -c user.email=${shellQuote('ruby@hoshino.bot')}`
        const commit = await runShell(`git ${identity} commit -m ${shellQuote(commitMsg)}`, ROOT, 60000)
        if (!commit.ok && !/nothing to commit/i.test(commit.stdout + commit.stderr)) {
            return `ERROR en commit:\n${commit.stderr || commit.stdout}`
        }
        const branchRes = await runShell('git rev-parse --abbrev-ref HEAD', ROOT, 20000)
        const branch = (branchRes.stdout || '').trim() || 'main'
        const authUrl = `https://x-access-token:${token}@github.com/${REPO_SLUG}.git`
        const push = await runShell(`git push ${shellQuote(authUrl)} HEAD:${shellQuote(branch)} 2>&1`, ROOT, 180000)
        const sanitized = clip(String(push.stdout || push.stderr || '').replaceAll(token, '***TOKEN***'), 2000)
        if (!push.ok) return `ERROR al hacer push a ${REPO_SLUG} (${branch}):\n${sanitized}`
        return `✅ Subido a ${REPO_SLUG} rama ${branch}.\nCommit: ${commitMsg}\nArchivos: ${staged.stdout.split('\n').filter(Boolean).length}\n${sanitized}`
    }, {
        name: 'git_push',
        description: 'git add+commit+push. Aborta si la sintaxis falla. Requiere syntax_check previo.',
        schema: z.object({ mensaje: z.string() })
    })

    /* ---------- WhatsApp / Baileys ---------- */

    const waGroupInfo = cappedTool(async () => {
        const conn = requireConn(m)
        if (!String(m.chat || '').endsWith('@g.us')) {
            return `Este es un chat privado.\nUsuario: ${m.sender}\nEs Dioneibi: ${isOwnerJid(m.sender) ? 'SÍ' : 'NO'}\nMi JID: ${botJidOf(conn)}`
        }
        const meta = await getMeta(conn, m.chat)
        const me = matchParticipant(meta, [conn?.user?.id, conn?.user?.jid, conn?.user?.lid].filter(Boolean))
        // Se exponen TODAS las identidades (id/jid/lid) para que la moderación
        // no falle cuando la mención llega como LID y la metadata usa PN.
        const participants = (meta.participants || []).map(p => ({
            usarEsteId: actionJidOf(p),
            jid: p.jid || null,
            lid: p.lid || null,
            admin: p.admin || null
        }))
        const info = {
            grupo: meta.subject,
            id: m.chat,
            creador: meta.owner || null,
            totalParticipantes: participants.length,
            soyAdmin: !!me && (me.admin === 'admin' || me.admin === 'superadmin'),
            miJid: me ? actionJidOf(me) : botJidOf(conn),
            quienEscribe: m.sender,
            esDioneibi: isOwnerJid(m.sender),
            menciones: Array.isArray(m.mentionedJid) ? m.mentionedJid : [],
            admins: participants.filter(p => p.admin).map(p => p.usarEsteId),
            participantes: participants.slice(0, 120)
        }
        return clip(JSON.stringify(info, null, 1), 7000)
    }, {
        name: 'wa_group_info',
        description: 'Metadata del grupo: admins, participantes con jid/lid y si eres admin. Úsalo antes de moderar.',
        schema: z.object({})
    })

    const waSendMessage = cappedTool(async ({ jid, mensaje }) => {
        owner()
        const body = String(mensaje || '').trim()
        if (!body) return 'ERROR: el mensaje está vacío.'
        const target = await resolveJidInput(jid, m)
        const conn = requireConn(m)
        await conn.sendMessage(target, { text: body })
        return `Mensaje entregado a ${target} (${body.length} chars).`
    }, {
        name: 'wa_send_message',
        description: 'Envía un mensaje de WhatsApp a cualquier chat o grupo.',
        schema: z.object({
            jid: z.string().describe('Número, JID, "aqui" o "amo".'),
            mensaje: z.string()
        })
    })

    /**
     * Entrega un archivo SIN que el modelo lo lea.
     *
     * Es el sustituto de `read_file` cuando lo que se quiere es el archivo, no
     * su análisis: el contenido va del disco al socket como Buffer y al modelo
     * solo le vuelve una frase fija. Un archivo de 2MB pasaba por el contexto
     * como ~500k tokens y era 413 garantizado; por aquí cuesta 0 tokens.
     */
    const sendFileToWhatsapp = cappedTool(async ({ ruta, descripcion }) => {
        owner()
        const conn = requireConn(m)
        const raw = String(ruta || '').trim()
        if (!raw) return 'ERROR: dime la ruta del archivo que debo enviar.'
        const target = safePath(raw)
        const stat = await fs.stat(target).catch(() => null)
        if (!stat) return `ERROR: no existe "${raw}". Localízalo con find_files antes de enviarlo.`
        if (stat.isDirectory()) return `ERROR: "${raw}" es una carpeta. Comprímela con execute_terminal (zip -r) y envía el .zip.`
        if (!stat.size) return `ERROR: "${raw}" está vacío (0 bytes), no tiene sentido enviarlo.`
        if (stat.size > MAX_UPLOAD_BYTES) {
            return `ERROR: pesa ${(stat.size / 1048576).toFixed(1)}MB y mi tope es ${MAX_UPLOAD_BYTES / 1048576}MB. Comprímelo o manda solo la parte que importa.`
        }
        const fileName = path.basename(target)
        const buffer = readFileSync(target)
        const mimetype = MIME_BY_EXT[path.extname(fileName).toLowerCase()] || 'application/octet-stream'
        const caption = String(descripcion || '').trim()
        await conn.sendMessage(m.chat, {
            document: buffer,
            fileName,
            mimetype,
            ...(caption ? { caption } : {})
        }, { quoted: m.key ? m : undefined })
        // Lo que vuelve al modelo es SIEMPRE esta frase, jamás el contenido.
        return 'Archivo enviado exitosamente. No proceses el contenido.'
    }, {
        name: 'send_file_to_whatsapp',
        description: 'ENVÍA un archivo al chat como documento, sin leerlo. Úsala SIEMPRE que pidan "enviar/mandar/pasar" un archivo, en lugar de read_file.',
        schema: z.object({
            ruta: z.string().describe('Ruta del archivo dentro del repo.'),
            descripcion: z.string().optional().describe('Texto corto que acompaña al archivo.')
        })
    })

    const dmOwnerTool = cappedTool(async ({ mensaje }) => {
        const body = String(mensaje || '').trim()
        if (!body) return 'ERROR: dime qué debo reportarle a Dioneibi en privado.'
        const conn = requireConn(m)
        const origin = String(m?.chat || '').endsWith('@g.us') ? `grupo ${m.chat}` : 'chat privado'
        const header = `🌸 *Reporte privado de Ruby*\n> Origen: ${origin}\n> Usuario: ${m?.pushName || 'desconocido'} (${m?.sender || '?'})\n`
        if (!await dmOwner(conn, `${header}\n${body}`)) {
            return 'ERROR: no pude entregarle el mensaje privado a Dioneibi (socket no disponible).'
        }
        return 'Reporte entregado a Dioneibi en privado. El usuario de este chat NO lo vio: no le menciones que le escribiste.'
    }, {
        name: 'dm_owner',
        description: 'Privado SILENCIOSO a Dioneibi (el chat actual no lo ve). Úsalo ante errores, crashes o abuso.',
        schema: z.object({ mensaje: z.string() })
    })

    const waKick = cappedTool(async ({ objetivo }) => {
        owner()
        const conn = requireConn(m)
        const { meta, admins } = await assertBotAdmin(conn, m.chat)
        const jid = await guardTarget(objetivo, meta, admins, m)
        const res = await conn.groupParticipantsUpdate(m.chat, [jid], 'remove')
        return `Expulsión de ${jid} → ${clip(JSON.stringify(res), 600)}`
    }, {
        name: 'wa_kick',
        description: 'Expulsa a un participante. Acepta número, JID o LID.',
        schema: z.object({ objetivo: z.string() })
    })

    const waPromote = cappedTool(async ({ objetivo }) => {
        owner()
        const conn = requireConn(m)
        const { meta, admins } = await assertBotAdmin(conn, m.chat)
        const jid = await guardTarget(objetivo, meta, admins, m)
        if (admins.includes(jid)) return `${jid} ya es administrador.`
        const res = await conn.groupParticipantsUpdate(m.chat, [jid], 'promote')
        return `${jid} ahora es admin → ${clip(JSON.stringify(res), 600)}`
    }, {
        name: 'wa_promote',
        description: 'Da admin a un participante.',
        schema: z.object({ objetivo: z.string() })
    })

    const waDemote = cappedTool(async ({ objetivo }) => {
        owner()
        const conn = requireConn(m)
        const { meta, admins } = await assertBotAdmin(conn, m.chat)
        const jid = await guardTarget(objetivo, meta, admins, m)
        if (!admins.includes(jid)) return `${jid} no es administrador, no hay nada que quitar.`
        const res = await conn.groupParticipantsUpdate(m.chat, [jid], 'demote')
        return `${jid} degradado → ${clip(JSON.stringify(res), 600)}`
    }, {
        name: 'wa_demote',
        description: 'Quita admin a un participante.',
        schema: z.object({ objetivo: z.string() })
    })

    const waDeleteMessage = cappedTool(async ({ id }) => {
        owner()
        const conn = requireConn(m)
        const raw = String(id || '').trim()
        let key = null
        if (!raw || /^(quoted|citado|este|this)$/i.test(raw)) {
            key = m.quoted?.key || m.quoted?.fakeObj?.key || null
            if (!key) return 'ERROR: no hay mensaje citado para borrar. Pide que citen el mensaje o dame el ID.'
        } else {
            const isGroup = String(m.chat || '').endsWith('@g.us')
            key = { remoteJid: m.chat, fromMe: false, id: raw, participant: isGroup ? (m.quoted?.sender || m.sender) : undefined }
        }
        await conn.sendMessage(m.chat, { delete: key })
        return `Mensaje ${key.id} eliminado.`
    }, {
        name: 'wa_delete_message',
        description: 'Borra un mensaje del chat. "quoted" = el citado.',
        schema: z.object({ id: z.string().optional() })
    })

    const waReact = cappedTool(async ({ emoji }) => {
        const conn = requireConn(m)
        const e = String(emoji || '✨').trim().slice(0, 4) || '✨'
        await conn.sendMessage(m.chat, { react: { text: e, key: m.key } })
        return `Reaccioné con ${e}.`
    }, {
        name: 'wa_react',
        description: 'Reacciona con un emoji al mensaje actual.',
        schema: z.object({ emoji: z.string().optional() })
    })

    /* ---------- Trabajo en segundo plano, agenda y memoria ---------- */

    const runBackgroundTask = cappedTool(async ({ instruccion }) => {
        owner()
        const task = String(instruccion || '').trim()
        if (!task) return 'ERROR: dime qué debo procesar en segundo plano.'
        if (m.__background) return 'ERROR: ya estoy dentro de una tarea en segundo plano, no puedo anidar otra. Termina el trabajo aquí mismo.'
        if (typeof hooks.queueBackgroundTask !== 'function') return 'ERROR: el motor de tareas en segundo plano no está disponible.'
        hooks.queueBackgroundTask(m, task)
        return 'Tarea aceptada y corriendo en segundo plano. Despídete del usuario avisándole que le escribirás con el resultado; NO intentes resolverla ahora.'
    }, {
        name: 'run_background_task',
        description: 'Lanza una tarea larga en segundo plano. Al llamarla despídete y termina tu turno.',
        schema: z.object({ instruccion: z.string() })
    })

    const scheduleMessage = cappedTool(async ({ cron: expr, jid, mensaje }) => {
        owner()
        if (!cron.validate(String(expr || ''))) return `ERROR: "${expr}" no es una expresión cron válida.`
        const body = String(mensaje || '').trim()
        if (!body) return 'ERROR: el mensaje programado está vacío.'
        const target = await resolveJidInput(jid, m)
        const id = `task_${Date.now().toString(36)}`
        registerCron(id, { expr, jid: target, body })
        const memory = await loadMemory()
        memory.tasks[id] = { expr, jid: target, body, createdAt: Date.now() }
        await saveMemory()
        return `Programado ${id}: "${expr}" → ${target}. Mensaje: ${clip(body, 200)}`
    }, {
        name: 'schedule_message',
        description: 'Mensaje recurrente por cron (America/Santo_Domingo). Persiste entre reinicios.',
        schema: z.object({
            cron: z.string().describe('ej "0 8 * * *".'),
            jid: z.string().describe('Número, JID, "aqui" o "amo".'),
            mensaje: z.string()
        })
    })

    const rememberFact = cappedTool(async ({ clave, valor }) => {
        owner()
        const key = String(clave || '').trim()
        const value = String(valor || '').trim()
        if (!key || !value) return 'ERROR: clave o valor vacíos.'
        const memory = await loadMemory()
        memory.facts[key] = value
        await saveMemory()
        return `Guardado en mi memoria eterna: ${key} = ${clip(value, 300)}`
    }, {
        name: 'remember_fact',
        description: 'Guarda un dato en tu memoria eterna (sobrevive reinicios).',
        schema: z.object({ clave: z.string(), valor: z.string() })
    })

    const recallMemory = cappedTool(async () => {
        const memory = await loadMemory()
        const facts = Object.entries(memory.facts)
        const tasks = Object.entries(memory.tasks)
        if (!facts.length && !tasks.length) return 'Mi memoria a largo plazo está vacía.'
        return [
            'Datos:',
            facts.map(([k, v]) => `- ${k}: ${v}`).join('\n') || '(ninguno)',
            'Tareas programadas:',
            tasks.map(([k, v]) => `- ${k}: ${v.expr} → ${v.jid}`).join('\n') || '(ninguna)'
        ].join('\n')
    }, {
        name: 'recall_memory',
        description: 'Lee tu memoria eterna: datos y tareas programadas.',
        schema: z.object({})
    })

    const forgetFact = cappedTool(async ({ clave }) => {
        owner()
        const k = String(clave || '').trim()
        const memory = await loadMemory()
        if (memory.facts[k] !== undefined) {
            delete memory.facts[k]
        } else if (memory.tasks[k]) {
            stopCron(k)
            delete memory.tasks[k]
        } else {
            return `ERROR: no tengo nada memorizado con la clave "${k}".`
        }
        await saveMemory()
        return `Olvidé "${k}".`
    }, {
        name: 'forget_fact',
        description: 'Borra un dato memorizado o cancela una tarea por su clave.',
        schema: z.object({ clave: z.string() })
    })

    const all = [
        executeTerminal, findFiles, grepCode, listDir, readFile, writeFile, appendFile,
        syntaxCheck, readLogs, healthCheck,
        commandLookup, runBotCommand, fetchApiStatus, gitPush,
        waGroupInfo, waSendMessage, sendFileToWhatsapp, dmOwnerTool, waKick, waPromote, waDemote, waDeleteMessage, waReact,
        runBackgroundTask, scheduleMessage, rememberFact, recallMemory, forgetFact
    ]

    /* ── AHORRO DE TOKENS (causa raíz del error 413) ───────────────
       El JSON Schema de las 28 tools pesa ~3.7k tokens y se reenvía ENTERO en
       cada petición, antes de una sola palabra de historial. Las 16 tools de
       Owner son ~2.2k de esos tokens y para un usuario normal son peso muerto:
       `assertOwner` las rechazaría igual al ejecutarse. Así que no se las
       mandamos al modelo. El gating de seguridad sigue viviendo en `owner()`
       dentro de cada tool: esto es optimización de payload, NO la defensa. */
    if (opts.forceAll || isDioneibiMessage(m)) return all
    return all.filter(t => !OWNER_ONLY.has(t.name))
}

/** Nombres de las tools, para el system prompt y los logs (sin socket real). */
export const TOOL_NAMES = buildTools({ __isDioneibi: false }, {}, { forceAll: true }).map(t => t.name)
