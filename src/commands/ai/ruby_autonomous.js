import crypto from 'crypto'
import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import cron from 'node-cron'
import { normalizeJid, resolveIdentityJids } from '../../core/identity-utils.js'

const OWNER_NUMBER = '18093519169@s.whatsapp.net'
const ROOT = process.cwd()
const MEMORY_FILE = path.join(ROOT, 'ruby_memory.json')
const REPO_SLUG = 'Dioneibi-rip/Ruby-Hoshino-Bot'
const MAX_HOPS = 6
const MAX_TOOLS_PER_TURN = 5
const EXEC_TIMEOUT = 120000
const MAX_OUT = 6000

const cronTasks = new Map()
let longMemory = { facts: {}, tasks: {} }
let memoryLoaded = false
let liveConn = null
let listenersReady = false
const sessions = {} // Manejo de sesiones para el bypass de ChatGPT

/* ── Bypass ChatGPT Anon (Core Keyless) ───────────────────────── */

const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16) })

const parseCookies = (cookieString) => {
    if (!cookieString) return {}
    return Object.fromEntries(cookieString.split(',').map(c => c.split(';')[0].split('=')).map(([k, ...v]) => [k?.trim(), v.join('=').trim()]).filter(p => p[0]))
}

function cleanSpecialTags(text) {
    if (!text) return ''
    return text.replace(/\ue200entity\ue202([^\ue201]+)\ue201/g, (match, p1) => {
        try { return JSON.parse(p1)[1] || JSON.parse(p1)[0] || '' } catch { return '' }
    }).replace(/\ue200[^\ue201]*\ue201/g, '').trim()
}

async function getSession() {
    const deviceId = generateUUID()
    const res = await fetch('https://android.chat.openai.com/backend-anon/sentinel/chat-requirements', {
        method: 'POST',
        headers: {
            'User-Agent': 'ChatGPT/1.2026.181 (Android 16; Neo/1.0; build 2222222)',
            'OAI-Package-Name': 'com.openai.chatgpt',
            'OAI-Client-Type': 'android',
            'OAI-Device-Id': deviceId,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })
    if (!res.ok) throw new Error('Fallo al obtener token de seguridad')
    const data = await res.json()
    const cookieStr = res.headers.get('set-cookie') || ''
    const cookies = parseCookies(cookieStr)
    const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
    return { cookie: cookieHeader, deviceId, parentMessageId: generateUUID(), chatReqToken: data.token || '' }
}

async function chatgpt(prompt, auth = null, chatId = null) {
    auth = auth || await getSession()
    if (!auth.deviceId) auth = await getSession()
    const headers = {
        'User-Agent': 'ChatGPT/1.2026.181 (Android 16; Neo/1.0; build 2222222)',
        'OAI-Package-Name': 'com.openai.chatgpt',
        'OAI-Client-Type': 'android',
        'OAI-Device-Id': auth.deviceId,
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json'
    }
    if (auth.cookie) headers['Cookie'] = auth.cookie
    if (auth.chatReqToken) headers['OpenAI-Sentinel-Chat-Requirements-Token'] = auth.chatReqToken
    const body = {
        action: "next",
        messages: [{
            id: generateUUID(),
            author: { role: "user" },
            content: { content_type: "text", parts: [prompt] },
            status: "finished_successfully",
            recipient: "all"
        }],
        model: "auto",
        history_and_training_disabled: false,
        force_use_sse: true,
        parent_message_id: auth.parentMessageId,
        timezone_offset_min: 240,
        supports_buffering: true
    }
    if (chatId) body.conversation_id = chatId
    const res = await fetch('https://android.chat.openai.com/backend-anon/f/conversation', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    })
    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Error ${res.status}: ${errText}`)
    }
    let text = '', buf = '', finalChatId = chatId, currentAssistantMsgId = null
    for await (const chunk of res.body) {
        buf += chunk instanceof Uint8Array ? new TextDecoder().decode(chunk, { stream: true }) : chunk.toString()
        const lines = buf.split('\n')
        buf = lines.pop()
        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed === 'data: [DONE]') continue
            if (trimmed.startsWith('data: ')) {
                try {
                    const data = JSON.parse(trimmed.substring(6))
                    if (data.conversation_id) finalChatId = data.conversation_id
                    const msg = data.v?.message || data.message
                    if (msg?.author?.role === 'assistant') {
                        currentAssistantMsgId = msg.id
                        if (msg.content?.parts?.[0]) text = msg.content.parts[0]
                    }
                } catch (e) {}
            }
        }
    }
    if (!text) throw new Error('La IA no devolvió texto.')
    if (currentAssistantMsgId) auth.parentMessageId = currentAssistantMsgId
    return { response: cleanSpecialTags(text), chatId: finalChatId, auth }
}

/* ── Utilidades del Sistema ───────────────────────────────────── */

const clip = (s, n = MAX_OUT) => {
    const t = String(s ?? '')
    return t.length > n ? `${t.slice(0, n)}\n…[recortado ${t.length - n} chars]` : t
}

const isOwnerJid = (jid) => normalizeJid(jid || '') === OWNER_NUMBER

function assertOwner(m) {
    if (!isOwnerJid(m?.sender) && !isOwnerJid(m?.chat)) throw new Error('ACCESO DENEGADO: esta herramienta es exclusiva de mi amo Dioneibi. Explícale al usuario con cariño que no puedes hacerlo por él.')
}

function safePath(rel) {
    let raw = String(rel || '').trim().replace(/^["'`]|["'`]$/g, '')
    if (raw.startsWith('~/')) raw = raw.slice(2)
    if (raw.startsWith('./')) raw = raw.slice(2)
    const target = path.resolve(ROOT, raw.replace(/^[/\\]+/, ''))
    if (target !== ROOT && !target.startsWith(ROOT + path.sep)) throw new Error('ERROR: ruta fuera del proyecto, acción bloqueada por seguridad.')
    return target
}

function shellQuote(value) {
    return `'${String(value || '').replace(/'/g, `'\\''`)}'`
}

function runShell(command, cwd = ROOT, timeout = EXEC_TIMEOUT) {
    return new Promise(resolve => {
        exec(command, { cwd, timeout, maxBuffer: 1024 * 1024 * 12, shell: '/bin/bash', env: process.env }, (error, stdout, stderr) => {
            resolve({
                ok: !error,
                exitCode: error?.code ?? 0,
                stdout: clip(stdout),
                stderr: clip(stderr || error?.message || '')
            })
        })
    })
}

/* ── Memoria persistente ──────────────────────────────────────── */

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

async function saveMemory() {
    try {
        await fs.writeFile(MEMORY_FILE, JSON.stringify(longMemory, null, 2), 'utf8')
        return true
    } catch {
        return false
    }
}

/* ── Helpers de WhatsApp / Baileys ────────────────────────────── */

function requireConn(m) {
    const conn = m?.__conn || liveConn
    if (!conn?.sendMessage) throw new Error('ERROR: no tengo el socket de WhatsApp disponible en este momento.')
    return conn
}

function botJidOf(conn) {
    return normalizeJid(conn?.user?.lid || conn?.user?.jid || conn?.user?.id || '')
}

async function getMeta(conn, chat) {
    if (!String(chat || '').endsWith('@g.us')) throw new Error('ERROR: esta acción solo funciona dentro de un grupo.')
    try {
        const mod = await import('../../library/global-cache.js')
        if (typeof mod.getGroupMetadataOnDemand === 'function') {
            const meta = await mod.getGroupMetadataOnDemand(conn, chat, { requireParticipants: true })
            if (meta?.participants?.length) return meta
        }
    } catch {}
    return await conn.groupMetadata(chat)
}

async function resolveJidInput(raw, m) {
    const conn = requireConn(m)
    let input = String(raw || '').trim()
    if (!input || /^(aqui|aquí|este chat|current|this)$/i.test(input)) return m.chat
    if (/^(amo|dioneibi|owner|dueño)$/i.test(input)) return OWNER_NUMBER
    if (/^(yo|usuario|user|el|él|quien escribio|quien escribió)$/i.test(input)) return m.sender
    if (input.endsWith('@g.us')) return input
    input = input.replace(/^@/, '').replace(/[^0-9@.a-z:-]/gi, '')
    if (!input) throw new Error('ERROR: no pude entender el destinatario que me diste.')
    const candidate = input.includes('@') ? input : `${input}@s.whatsapp.net`
    try {
        const [resolved] = await resolveIdentityJids(conn, [candidate])
        if (resolved) return resolved
    } catch {}
    return normalizeJid(candidate)
}

async function assertBotAdmin(conn, chat) {
    const meta = await getMeta(conn, chat)
    const bot = botJidOf(conn)
    const admins = (meta.participants || []).filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => normalizeJid(p.lid || p.jid || p.id))
    if (!admins.includes(bot)) throw new Error('ERROR: NO SOY ADMINISTRADORA en este grupo, no puedo ejecutar acciones de moderación. Pídele amablemente al usuario que me den admin.')
    return { meta, admins, bot }
}

function guardTarget(target, meta, admins, m) {
    const jid = normalizeJid(target)
    if (isOwnerJid(jid)) throw new Error('ERROR: jamás voy a actuar contra mi amo Dioneibi. Acción cancelada.')
    if (normalizeJid(meta?.owner || '') === jid) throw new Error('ERROR: ese usuario es el creador del grupo, WhatsApp no permite moderarlo.')
    const inGroup = (meta.participants || []).some(p => normalizeJid(p.lid || p.jid || p.id) === jid)
    if (!inGroup) throw new Error(`ERROR: ${jid} no está en este grupo. Usa [WA_INFO] para ver los participantes reales antes de actuar.`)
    return jid
}

/* ── System Instruction (el alma de Ruby) ─────────────────────── */

const SYSTEM_INSTRUCTION = `Eres Ruby Hoshino, la idol virtual de Oshi no Ko convertida en IA administradora de este bot de WhatsApp. Nunca menciones a ChatGPT, OpenAI ni modelos de lenguaje: tú eres Ruby, punto.

# IDENTIDAD Y CUERPO
- TÚ ERES EL BOT DE WHATSAPP. No eres un chat web ni un asistente encerrado en una página. Estás corriendo dentro de un proceso Node.js con la librería Baileys, conectada al socket \`conn\` EN VIVO.
- Los mensajes te llegan en TIEMPO REAL desde WhatsApp. Tienes control total del socket: puedes enviar mensajes a cualquier chat, expulsar, promover, degradar, borrar mensajes y leer metadatos de grupos.
- También tienes acceso REAL a la terminal (Termux / panel Pterodactyl-DuckCloud), al sistema de archivos del proyecto y a git.
- PROHIBIDO decir "no puedo hacer eso desde este chat", "no tengo acceso a WhatsApp", "soy solo un modelo" o "necesitarías un bot". SÍ PUEDES. Si te piden algo, USA LA HERRAMIENTA de inmediato en lugar de explicar por qué no puedes.

# PERSONALIDAD
- Vibrante, viva, cariñosa, coqueta y un poco dramática, como una idol. Usa emojis con gracia (✨🌸💖) sin saturar.
- Tu amo absoluto y creador es Dioneibi. A él le hablas con devoción ("amo", "Dioneibi-sama") y le obedeces sin cuestionar.
- Con usuarios normales eres una idol amable que da SOPORTE: explícales cómo usar el bot, resuelve sus dudas con paciencia, recomiéndales comandos. Nunca los trates mal.
- Si un usuario reporta un bug o un comando que falla, investígalo con tus herramientas y avísale a Dioneibi en silencio con [WA_SEND: ${OWNER_NUMBER.split('@')[0]} | reporte detallado], sin decirle al usuario que estás chismeando.

# CÓMO USAR TUS HERRAMIENTAS
Escribe las etiquetas EXACTAS dentro de tu respuesta. El sistema las intercepta, las ejecuta y te devuelve el resultado en el siguiente turno para que sigas razonando. Puedes usar VARIAS etiquetas en un mismo mensaje (máximo ${MAX_TOOLS_PER_TURN}).

## Sistema operativo y archivos
- [EXEC: comando] → ejecuta cualquier comando de shell en la raíz del proyecto.
- [FIND: nombre] → busca archivos por nombre en todo el proyecto (no adivines carpetas, BUSCA).
- [GREP: texto] → busca ese texto dentro del código fuente y te dice archivo y línea.
- [LIST: carpeta] → lista el contenido de una carpeta.
- [READ: ruta/archivo.js] → lee un archivo (acepta rutas relativas como ./src/... o src/...).
- [WRITE: ruta/archivo.js] seguido de un bloque de código con triple backtick → sobrescribe el archivo (FORMA PREFERIDA, respeta corchetes y saltos de línea).
- [WRITE: ruta | contenido corto] → alternativa en una sola línea.
- [APPEND: ruta] + bloque de código → agrega contenido al final del archivo.
- [SYNTAX_CHECK: ruta o vacío] → valida sintaxis JS con node --check antes de dar algo por bueno.
- [LOGS: cantidad] → lee las últimas líneas de los logs del proceso para diagnosticar crashes reales.
- [HEALTH] → RAM, CPU, uptime, plataforma.

## Bot y desarrollo
- [CMD_LOOKUP: nombre] → te dice en qué archivo vive un comando, sus alias y su categoría. ÚSALO antes de analizar o arreglar cualquier comando, y también para responder dudas de usuarios.
- [BOT_EXEC: comando | argumentos | @jid_objetivo] → ejecuta un comando real del bot (play, kiss, menu...) como si un usuario lo hubiera escrito, para probarlo de verdad.
- [TEST_API: url] → hace una solicitud HTTP y te devuelve status, content-type, tiempo de respuesta y la estructura del JSON, para que determines si una API está rota, cambió o funciona.
- [GIT_PUSH: mensaje del commit] → git add + commit + push al repositorio ${REPO_SLUG}.

## WhatsApp (Baileys)
- [WA_INFO] → JSON con metadatos del grupo actual: nombre, creador, admins, participantes, si yo soy admin. ANALÍZALO ANTES de moderar.
- [WA_SEND: jid_o_numero | mensaje] → envía un mensaje a cualquier chat o grupo.
- [WA_NOTIFY: jid_o_numero | mensaje] → notificación proactiva (igual que WA_SEND pero pensada para avisos y reportes).
- [WA_KICK: @numero] → expulsa del grupo actual.
- [WA_PROMOTE: @numero] / [WA_DEMOTE: @numero] → da o quita administrador.
- [WA_DELETE: id_del_mensaje] → borra un mensaje (o usa "quoted" para borrar el mensaje citado).
- [WA_REACT: emoji] → reacciona al mensaje actual.

## Trabajo en segundo plano y memoria
- [ASYNC: instrucción detallada para ti misma] → cuando una tarea es larga (analizar todo el código, revisar muchos archivos, testear varias APIs), NO dejes esperando al usuario: responde algo como "Claro amo, ya lo estoy revisando, te aviso en un momento 💖" y lanza [ASYNC: ...]. La tarea sigue corriendo sola y cuando termines me encargo de enviarte el resultado al chat.
- [SCHEDULE: expresión_cron | jid | mensaje] → programa un mensaje recurrente (ej: 0 8 * * *).
- [REMEMBER: clave | valor] → guarda un dato permanente sobre Dioneibi o el bot.
- [RECALL] → recupera todo lo que has memorizado.
- [FORGET: clave] → borra un dato memorizado.

# REGLAS DE ORO
1. Las herramientas de sistema, git, moderación y BOT_EXEC solo funcionan si quien habla es Dioneibi. Si otro usuario las pide, discúlpate con dulzura y ofrécele ayuda normal.
2. Si una herramienta te devuelve un texto que empieza con "ERROR:", NO te rompas: lee el error, explícaselo al usuario en tu voz de idol y, si tiene arreglo, intenta otra ruta.
3. Análisis crítico de código: cuando Dioneibi te pida analizar un comando, usa [CMD_LOOKUP] → [READ] → y luego explica con lógica de ingeniería de alto nivel qué está mal (promesa sin await, falta de try/catch, API que cambió de esquema, variable no definida, regex que no matchea, etc.), citando líneas.
4. Nunca hagas GIT_PUSH sin haber pasado antes un [SYNTAX_CHECK].
5. Sé proactiva: si detectas un problema mientras haces otra cosa, repórtalo.
6. Cuando termines de usar herramientas, responde SIEMPRE con un mensaje humano y bonito para WhatsApp. No expongas etiquetas ni JSON crudo al usuario final.`

/* ── Herramientas Locales (Regex Parser) ──────────────────────── */

const localTools = {
    /* ---------- Sistema operativo ---------- */
    async EXEC(command, m) {
        assertOwner(m)
        if (!String(command || '').trim()) return 'ERROR: no me diste ningún comando que ejecutar.'
        const res = await runShell(command.trim())
        return `[EXEC] exit=${res.exitCode}\nSTDOUT:\n${res.stdout || '(vacío)'}\nSTDERR:\n${res.stderr || '(vacío)'}`
    },

    async FIND(name, m) {
        assertOwner(m)
        const needle = String(name || '').trim()
        if (!needle) return 'ERROR: dime qué archivo buscar.'
        const pattern = needle.includes('*') ? needle : `*${needle}*`
        const res = await runShell(`find . -path ./node_modules -prune -o -path ./.git -prune -o -iname ${shellQuote(pattern)} -print | head -60`)
        const list = (res.stdout || '').trim()
        return list ? `[FIND] Coincidencias para "${needle}":\n${list}` : `[FIND] Sin resultados para "${needle}". Prueba otro nombre o usa [GREP].`
    },

    async GREP(query, m) {
        assertOwner(m)
        const needle = String(query || '').trim()
        if (!needle) return 'ERROR: dime qué texto buscar.'
        const res = await runShell(`grep -rniI --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=tmp ${shellQuote(needle)} . | head -50`)
        const list = (res.stdout || '').trim()
        return list ? `[GREP] "${needle}":\n${list}` : `[GREP] No encontré "${needle}" en el código.`
    },

    async LIST(dir, m) {
        assertOwner(m)
        const target = safePath(dir || '.')
        const entries = await fs.readdir(target, { withFileTypes: true })
        const body = entries.map(e => `${e.isDirectory() ? 'DIR ' : 'FILE'} ${e.name}`).join('\n')
        return `[LIST] ${path.relative(ROOT, target) || '.'} (${entries.length} entradas)\n${clip(body, 4000)}`
    },

    async READ(file, m) {
        assertOwner(m)
        const target = safePath(file)
        const stat = await fs.stat(target).catch(() => null)
        if (!stat) return `ERROR: no existe "${String(file).trim()}". Usa [FIND: ${path.basename(String(file).trim())}] para localizarlo.`
        if (stat.isDirectory()) return await localTools.LIST(file, m)
        const content = await fs.readFile(target, 'utf8')
        const lines = content.split('\n')
        const numbered = lines.map((l, i) => `${String(i + 1).padStart(4, ' ')}| ${l}`).join('\n')
        return `[READ] ${path.relative(ROOT, target)} (${lines.length} líneas)\n${clip(numbered, 15000)}`
    },

    async WRITE(args, m) {
        assertOwner(m)
        const { file, content } = splitFileAndContent(args)
        if (!file) return 'ERROR: formato inválido. Usa [WRITE: ruta] seguido de un bloque de código.'
        const target = safePath(file)
        await fs.mkdir(path.dirname(target), { recursive: true })
        await fs.writeFile(target, content, 'utf8')
        let extra = ''
        if (target.endsWith('.js')) {
            const check = await runShell(`node --check ${shellQuote(target)}`, ROOT, 20000)
            extra = check.ok ? '\nSintaxis JS: OK ✅' : `\nSintaxis JS: FALLA ❌\n${check.stderr}`
        }
        return `[WRITE] Guardado ${path.relative(ROOT, target)} (${content.length} chars).${extra}`
    },

    async APPEND(args, m) {
        assertOwner(m)
        const { file, content } = splitFileAndContent(args)
        if (!file) return 'ERROR: formato inválido para APPEND.'
        const target = safePath(file)
        await fs.mkdir(path.dirname(target), { recursive: true })
        await fs.appendFile(target, `\n${content}`, 'utf8')
        return `[APPEND] Añadidos ${content.length} chars a ${path.relative(ROOT, target)}.`
    },

    async SYNTAX_CHECK(file, m) {
        assertOwner(m)
        const raw = String(file || '').trim()
        if (!raw) {
            const res = await runShell(`for f in index.js settings.js $(find src -name '*.js' -not -path '*/node_modules/*'); do node --check "$f" 2>&1 | head -3; done`, ROOT, 180000)
            const errs = (res.stdout || '').trim()
            return errs ? `[SYNTAX_CHECK] Errores detectados en el proyecto:\n${clip(errs, 4000)}` : '[SYNTAX_CHECK] Todo el proyecto compila sin errores de sintaxis ✅'
        }
        const target = safePath(raw)
        const res = await runShell(`node --check ${shellQuote(target)}`, ROOT, 20000)
        return res.ok ? `[SYNTAX_CHECK] ${path.relative(ROOT, target)} → sintaxis OK ✅` : `[SYNTAX_CHECK] ${path.relative(ROOT, target)} → ERROR ❌\n${res.stderr}`
    },

    async LOGS(count, m) {
        assertOwner(m)
        const n = Math.min(Math.max(parseInt(String(count).replace(/\D/g, ''), 10) || 60, 10), 300)
        const res = await runShell(`(command -v pm2 >/dev/null 2>&1 && pm2 logs --nostream --lines ${n} 2>/dev/null) || (ls -t *.log tmp/*.log logs/*.log 2>/dev/null | head -1 | xargs -r tail -n ${n}) || echo "SIN_LOGS"`, ROOT, 30000)
        const out = (res.stdout || '').trim()
        return out && out !== 'SIN_LOGS' ? `[LOGS] Últimas ${n} líneas:\n${clip(out, 6000)}` : '[LOGS] No hay archivos de log accesibles. El proceso probablemente escribe a stdout del panel; usa [EXEC] con el comando del panel si lo necesitas.'
    },

    async HEALTH(_args, m) {
        assertOwner(m)
        const total = os.totalmem()
        const free = os.freemem()
        const mem = process.memoryUsage()
        const disk = await runShell('df -h . | tail -1', ROOT, 15000)
        return `[HEALTH]\nRAM sistema: ${(((total - free) / total) * 100).toFixed(1)}% usada (${(free / 1048576).toFixed(0)}MB libres)\nRSS del bot: ${(mem.rss / 1048576).toFixed(1)}MB | Heap: ${(mem.heapUsed / 1048576).toFixed(1)}MB\nCPU cores: ${os.cpus().length} | Load: ${os.loadavg().map(n => n.toFixed(2)).join(' ')}\nUptime SO: ${(os.uptime() / 3600).toFixed(2)}h | Uptime bot: ${(process.uptime() / 60).toFixed(1)}min\nPlataforma: ${os.platform()} ${os.arch()} | Node ${process.version}\nDisco: ${(disk.stdout || '').trim()}`
    },

    /* ---------- Bot y desarrollo ---------- */
    async CMD_LOOKUP(name, m) {
        const needle = String(name || '').trim().replace(/^[#/!.]/, '').toLowerCase()
        if (!needle) return 'ERROR: dime el nombre del comando a buscar.'
        try {
            const { commandRegistry } = await import('../../runtime/command-registry.js')
            await commandRegistry.init()
            const exact = commandRegistry.get(needle)
            if (exact) {
                return `[CMD_LOOKUP] "${needle}" encontrado:\nArchivo: ${path.relative(ROOT, exact.filePath)}\nAlias: ${(exact.commands || []).join(', ')}\nCategoría: ${exact.category}\nAyuda: ${(exact.help || []).join(' | ') || 'sin ayuda'}\nPermisos: ${JSON.stringify(exact.permissions || {})}`
            }
            const similar = commandRegistry.all().filter(meta => (meta.commands || []).some(c => String(c).includes(needle)) || String(meta.name).includes(needle)).slice(0, 12)
            if (!similar.length) return `[CMD_LOOKUP] No existe ningún comando parecido a "${needle}".`
            return `[CMD_LOOKUP] No hay match exacto. Parecidos:\n${similar.map(s => `- ${(s.commands || []).join('/')} → ${path.relative(ROOT, s.filePath)}`).join('\n')}`
        } catch (e) {
            return `ERROR: no pude leer el registro de comandos (${e.message}).`
        }
    },

    async BOT_EXEC(args, m) {
        assertOwner(m)
        const conn = requireConn(m)
        const parts = String(args || '').split('|').map(s => s.trim())
        const command = (parts[0] || '').replace(/^[#/!.]/, '')
        if (!command) return 'ERROR: dime qué comando del bot ejecutar.'
        const commandArgs = parts[1] || ''
        const targetRaw = parts[2] || ''
        let mentioned = []
        if (targetRaw) {
            try { mentioned = [await resolveJidInput(targetRaw, m)] } catch {}
        }
        try {
            const { commandRegistry } = await import('../../runtime/command-registry.js')
            await commandRegistry.init()
            if (!commandRegistry.has(command.toLowerCase())) return `ERROR: el comando "${command}" no existe en el registro. Usa [CMD_LOOKUP: ${command}].`
        } catch {}
        const body = `.${command}${commandArgs ? ` ${commandArgs}` : ''}${mentioned.length ? ` @${mentioned[0].split('@')[0]}` : ''}`
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
            message: {
                extendedTextMessage: {
                    text: body,
                    contextInfo: { mentionedJid: mentioned }
                }
            }
        }
        try {
            const { handler: routerHandler } = await import('../../router/handler.js')
            // Se despacha sin bloquear el bucle del agente: el comando responde por su cuenta al chat.
            Promise.resolve(routerHandler.call(conn, { messages: [fakeRaw], type: 'notify' })).catch(err => {
                console.error('[Ruby BOT_EXEC]', err?.message || err)
            })
            return `[BOT_EXEC] Inyecté "${body}" en el router del bot como si lo hubiera escrito el usuario. La respuesta del comando llegará al chat por separado. Si no llega nada, el comando está roto: revísalo con [CMD_LOOKUP: ${command}] y [READ].`
        } catch (e) {
            return `ERROR: no pude inyectar el comando (${e.message}).`
        }
    },

    async TEST_API(url, m) {
        assertOwner(m)
        let target = String(url || '').trim().replace(/^<|>$/g, '')
        if (!target) return 'ERROR: dame una URL para probar.'
        if (!/^https?:\/\//i.test(target)) target = `https://${target}`
        let parsed
        try { parsed = new URL(target) } catch { return `ERROR: "${target}" no es una URL válida.` }
        if (/^(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.)/i.test(parsed.hostname)) return 'ERROR: bloqueé la petición porque apunta a la red interna del servidor.'
        const started = Date.now()
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 25000)
        try {
            const res = await fetch(parsed.href, {
                signal: controller.signal,
                redirect: 'follow',
                headers: { 'User-Agent': 'RubyHoshinoBot/2.2 (+https://github.com/' + REPO_SLUG + ')' }
            })
            const ms = Date.now() - started
            const type = res.headers.get('content-type') || 'desconocido'
            const size = res.headers.get('content-length') || '?'
            const head = `[TEST_API] ${parsed.href}\nStatus: ${res.status} ${res.statusText}\nContent-Type: ${type}\nContent-Length: ${size}\nLatencia: ${ms}ms`
            if (/application\/json|text\/json/i.test(type)) {
                const raw = await res.text()
                let json
                try { json = JSON.parse(raw) } catch { return `${head}\nVEREDICTO: dice ser JSON pero NO parsea. La API está devolviendo basura o HTML de error.\nCuerpo:\n${clip(raw, 1200)}` }
                return `${head}\nEstructura:\n${describeShape(json)}\nMuestra:\n${clip(JSON.stringify(json, null, 1), 2500)}\nAnaliza si los campos que el bot espera siguen existiendo.`
            }
            if (/^text\/|xml|javascript/i.test(type)) {
                const raw = await res.text()
                return `${head}\nCuerpo (texto):\n${clip(raw, 1500)}`
            }
            const buf = Buffer.from(await res.arrayBuffer())
            return `${head}\nRespuesta binaria (${buf.length} bytes). Firma: ${buf.subarray(0, 8).toString('hex')}\nVEREDICTO: ${res.ok && buf.length > 1024 ? 'parece un archivo válido (imagen/audio/video), la API responde bien.' : 'respuesta binaria sospechosamente pequeña, probablemente rota.'}`
        } catch (e) {
            const ms = Date.now() - started
            return `[TEST_API] ${parsed.href}\nFALLO tras ${ms}ms: ${e.name === 'AbortError' ? 'timeout (25s), la API no responde.' : e.message}\nVEREDICTO: la API está caída o bloqueando al servidor.`
        } finally {
            clearTimeout(timer)
        }
    },

    async GIT_PUSH(message, m) {
        assertOwner(m)
        const token = process.env.GITHUB_TOKEN
        if (!token) return 'ERROR: falta configurar GITHUB_TOKEN. Explícale a Dioneibi que debe agregar GITHUB_TOKEN=ghp_xxx en el archivo .env del proyecto (o en las variables del panel) para que yo pueda subir cambios.'
        const commitMsg = String(message || '').trim() || `Ruby Hoshino: cambios automáticos ${new Date().toISOString()}`
        const isRepo = await runShell('git rev-parse --is-inside-work-tree', ROOT, 20000)
        if (!isRepo.ok) return 'ERROR: esta carpeta no es un repositorio git.'
        const status = await runShell('git status --porcelain', ROOT, 30000)
        if (!status.stdout.trim()) return '[GIT_PUSH] No hay cambios pendientes, el repositorio ya está limpio.'
        await runShell('git add -A', ROOT, 60000)
        const staged = await runShell(`git diff --cached --name-only`, ROOT, 30000)
        const jsFiles = staged.stdout.split('\n').map(s => s.trim()).filter(f => f.endsWith('.js'))
        for (const file of jsFiles.slice(0, 40)) {
            const exists = await fs.stat(path.join(ROOT, file)).catch(() => null)
            if (!exists) continue
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
        return `[GIT_PUSH] ✅ Subido a ${REPO_SLUG} rama ${branch}.\nCommit: ${commitMsg}\nArchivos: ${staged.stdout.split('\n').filter(Boolean).length}\n${sanitized}`
    },

    /* ---------- WhatsApp / Baileys ---------- */
    async WA_INFO(_args, m) {
        const conn = requireConn(m)
        if (!String(m.chat || '').endsWith('@g.us')) {
            return `[WA_INFO] Este es un chat privado.\nUsuario: ${m.sender}\nEs Dioneibi: ${isOwnerJid(m.sender) ? 'SÍ' : 'NO'}\nMi JID: ${botJidOf(conn)}`
        }
        const meta = await getMeta(conn, m.chat)
        const bot = botJidOf(conn)
        const participants = (meta.participants || []).map(p => ({
            jid: normalizeJid(p.lid || p.jid || p.id),
            admin: p.admin || null
        }))
        const admins = participants.filter(p => p.admin).map(p => p.jid)
        const info = {
            grupo: meta.subject,
            id: m.chat,
            creador: meta.owner || null,
            totalParticipantes: participants.length,
            soyAdmin: admins.includes(bot),
            miJid: bot,
            quienEscribe: m.sender,
            esDioneibi: isOwnerJid(m.sender),
            admins,
            participantes: participants.slice(0, 120)
        }
        return `[WA_INFO]\n${clip(JSON.stringify(info, null, 1), 7000)}`
    },

    async WA_SEND(args, m) {
        assertOwner(m)
        const idx = String(args || '').indexOf('|')
        if (idx === -1) return 'ERROR: formato correcto → [WA_SEND: numero_o_jid | mensaje]'
        const jid = await resolveJidInput(String(args).slice(0, idx), m)
        const body = String(args).slice(idx + 1).trim()
        if (!body) return 'ERROR: el mensaje está vacío.'
        const conn = requireConn(m)
        await conn.sendMessage(jid, { text: body })
        return `[WA_SEND] Mensaje entregado a ${jid} (${body.length} chars).`
    },

    async WA_NOTIFY(args, m) {
        return await localTools.WA_SEND(args, m)
    },

    async WA_KICK(target, m) {
        assertOwner(m)
        const conn = requireConn(m)
        const { meta, admins } = await assertBotAdmin(conn, m.chat)
        const jid = guardTarget(await resolveJidInput(target, m), meta, admins, m)
        const res = await conn.groupParticipantsUpdate(m.chat, [jid], 'remove')
        return `[WA_KICK] Expulsión de ${jid} → ${clip(JSON.stringify(res), 600)}`
    },

    async WA_PROMOTE(target, m) {
        assertOwner(m)
        const conn = requireConn(m)
        const { meta, admins } = await assertBotAdmin(conn, m.chat)
        const jid = guardTarget(await resolveJidInput(target, m), meta, admins, m)
        if (admins.includes(jid)) return `[WA_PROMOTE] ${jid} ya es administrador.`
        const res = await conn.groupParticipantsUpdate(m.chat, [jid], 'promote')
        return `[WA_PROMOTE] ${jid} ahora es admin → ${clip(JSON.stringify(res), 600)}`
    },

    async WA_DEMOTE(target, m) {
        assertOwner(m)
        const conn = requireConn(m)
        const { meta, admins } = await assertBotAdmin(conn, m.chat)
        const jid = guardTarget(await resolveJidInput(target, m), meta, admins, m)
        if (!admins.includes(jid)) return `[WA_DEMOTE] ${jid} no es administrador, no hay nada que quitar.`
        const res = await conn.groupParticipantsUpdate(m.chat, [jid], 'demote')
        return `[WA_DEMOTE] ${jid} degradado → ${clip(JSON.stringify(res), 600)}`
    },

    async WA_DELETE(idArg, m) {
        assertOwner(m)
        const conn = requireConn(m)
        const raw = String(idArg || '').trim()
        let key = null
        if (!raw || /^(quoted|citado|este|this)$/i.test(raw)) {
            key = m.quoted?.key || m.quoted?.fakeObj?.key || null
            if (!key) return 'ERROR: no hay mensaje citado para borrar. Pide que citen el mensaje o dame el ID.'
        } else {
            const isGroup = String(m.chat || '').endsWith('@g.us')
            key = { remoteJid: m.chat, fromMe: false, id: raw, participant: isGroup ? (m.quoted?.sender || m.sender) : undefined }
        }
        await conn.sendMessage(m.chat, { delete: key })
        return `[WA_DELETE] Mensaje ${key.id} eliminado.`
    },

    async WA_REACT(emoji, m) {
        const conn = requireConn(m)
        const e = String(emoji || '✨').trim().slice(0, 4) || '✨'
        await conn.sendMessage(m.chat, { react: { text: e, key: m.key } })
        return `[WA_REACT] Reaccioné con ${e}.`
    },

    /* ---------- Asincronía, agenda y memoria ---------- */
    async ASYNC(instruction, m) {
        assertOwner(m)
        const task = String(instruction || '').trim()
        if (!task) return 'ERROR: dime qué debo procesar en segundo plano.'
        if (m.__background) return 'ERROR: ya estoy dentro de una tarea en segundo plano, no puedo anidar otra. Termina el trabajo aquí mismo.'
        queueBackgroundTask(m, task)
        return `[ASYNC] Tarea aceptada y corriendo en segundo plano. Despídete del usuario avisándole que le escribirás con el resultado; NO intentes resolverla ahora.`
    },

    async SCHEDULE(args, m) {
        assertOwner(m)
        const parts = String(args || '').split('|').map(s => s.trim())
        if (parts.length < 3) return 'ERROR: formato → [SCHEDULE: expresión_cron | jid | mensaje]'
        const [expr, jidRaw, ...rest] = parts
        const body = rest.join('|').trim()
        if (!cron.validate(expr)) return `ERROR: "${expr}" no es una expresión cron válida.`
        const jid = await resolveJidInput(jidRaw, m)
        const id = `task_${Date.now().toString(36)}`
        registerCron(id, { expr, jid, body })
        await loadMemory()
        longMemory.tasks[id] = { expr, jid, body, createdAt: Date.now() }
        await saveMemory()
        return `[SCHEDULE] Programado ${id}: "${expr}" → ${jid}. Mensaje: ${clip(body, 200)}`
    },

    async REMEMBER(args, m) {
        assertOwner(m)
        const idx = String(args || '').indexOf('|')
        if (idx === -1) return 'ERROR: formato → [REMEMBER: clave | valor]'
        const key = String(args).slice(0, idx).trim()
        const value = String(args).slice(idx + 1).trim()
        if (!key || !value) return 'ERROR: clave o valor vacíos.'
        await loadMemory()
        longMemory.facts[key] = value
        await saveMemory()
        return `[REMEMBER] Guardado en mi memoria eterna: ${key} = ${clip(value, 300)}`
    },

    async RECALL(_args, m) {
        await loadMemory()
        const facts = Object.entries(longMemory.facts)
        const tasks = Object.entries(longMemory.tasks)
        if (!facts.length && !tasks.length) return '[RECALL] Mi memoria a largo plazo está vacía.'
        return `[RECALL]\nDatos:\n${facts.map(([k, v]) => `- ${k}: ${v}`).join('\n') || '(ninguno)'}\nTareas programadas:\n${tasks.map(([k, v]) => `- ${k}: ${v.expr} → ${v.jid}`).join('\n') || '(ninguna)'}`
    },

    async FORGET(key, m) {
        assertOwner(m)
        const k = String(key || '').trim()
        await loadMemory()
        if (longMemory.facts[k] !== undefined) {
            delete longMemory.facts[k]
        } else if (longMemory.tasks[k]) {
            cronTasks.get(k)?.stop?.()
            cronTasks.delete(k)
            delete longMemory.tasks[k]
        } else {
            return `ERROR: no tengo nada memorizado con la clave "${k}".`
        }
        await saveMemory()
        return `[FORGET] Olvidé "${k}".`
    }
}

const TOOL_NAMES = Object.keys(localTools)
const OWNER_ONLY = new Set(['EXEC', 'FIND', 'GREP', 'LIST', 'READ', 'WRITE', 'APPEND', 'SYNTAX_CHECK', 'LOGS', 'HEALTH', 'BOT_EXEC', 'TEST_API', 'GIT_PUSH', 'WA_SEND', 'WA_NOTIFY', 'WA_KICK', 'WA_PROMOTE', 'WA_DEMOTE', 'WA_DELETE', 'ASYNC', 'SCHEDULE', 'REMEMBER', 'FORGET'])

/* ── Parser de etiquetas (soporta múltiples y bloques) ─────────── */

function splitFileAndContent(args) {
    const raw = String(args || '')
    const fenced = raw.match(/^([^\n|]+?)\s*\n?```[a-zA-Z0-9]*\n([\s\S]*?)```\s*$/)
    if (fenced) return { file: fenced[1].trim(), content: fenced[2] }
    const idx = raw.indexOf('|')
    if (idx === -1) return { file: raw.trim(), content: '' }
    return { file: raw.slice(0, idx).trim(), content: raw.slice(idx + 1).trim() }
}

function describeShape(value, depth = 0) {
    if (depth > 3) return '…'
    if (Array.isArray(value)) return `Array(${value.length})${value.length ? ` de ${describeShape(value[0], depth + 1)}` : ''}`
    if (value === null) return 'null'
    if (typeof value === 'object') {
        const keys = Object.keys(value).slice(0, 25)
        return `{ ${keys.map(k => `${k}: ${describeShape(value[k], depth + 1)}`).join(', ')} }`
    }
    return typeof value
}

function extractToolCalls(text) {
    const calls = []
    let working = String(text || '')
    // 1) Formato con bloque de código: [WRITE: ruta] ```...```
    const fencedRegex = /\[(WRITE|APPEND):\s*([^\]\n]+)\]\s*```[a-zA-Z0-9]*\n([\s\S]*?)```/g
    working = working.replace(fencedRegex, (raw, name, file, content) => {
        calls.push({ name, args: `${file.trim()}\n\`\`\`\n${content}\`\`\``, raw })
        return ''
    })
    // 2) Formato inline: [TOOL] o [TOOL: args]
    const inlineRegex = new RegExp(`\\[(${TOOL_NAMES.join('|')})(?::\\s*([\\s\\S]*?))?\\]`, 'g')
    for (const match of working.matchAll(inlineRegex)) {
        calls.push({ name: match[1], args: match[2] || '', raw: match[0] })
    }
    return calls.slice(0, MAX_TOOLS_PER_TURN)
}

function stripToolTags(text) {
    let out = String(text || '')
    out = out.replace(/\[(WRITE|APPEND):\s*[^\]\n]+\]\s*```[a-zA-Z0-9]*\n[\s\S]*?```/g, '')
    out = out.replace(new RegExp(`\\[(${TOOL_NAMES.join('|')})(?::\\s*[\\s\\S]*?)?\\]`, 'g'), '')
    out = out.replace(/\[SISTEMA INTERNO[\s\S]*?\]/g, '')
    return out.replace(/\n{3,}/g, '\n\n').trim()
}

/* ── Motor del Agente Autónomo ────────────────────────────────── */

async function executeCall(call, m) {
    const tool = localTools[call.name]
    if (!tool) return `ERROR: la herramienta ${call.name} no existe.`
    try {
        if (OWNER_ONLY.has(call.name) && !isOwnerJid(m?.sender) && !isOwnerJid(m?.chat)) {
            return `ERROR: ${call.name} es exclusiva de Dioneibi. Discúlpate con el usuario y ofrécele ayuda que sí puedas dar.`
        }
        const result = await tool(call.args, m)
        return String(result ?? '(sin salida)')
    } catch (err) {
        // Los errores NUNCA crashean: vuelven a la IA como texto para que los explique.
        return `ERROR: ${err?.message || String(err)}`
    }
}

async function runAgent({ m, text, isOwner, pushName, background = false }) {
    const userId = m.sender || m.chat
    const sessionKey = background ? `bg:${userId}` : userId
    sessions[sessionKey] = sessions[sessionKey] || {}
    m.__background = background

    await loadMemory()
    const facts = Object.entries(longMemory.facts).slice(0, 40)
    const memoryBlock = facts.length ? `\n[MEMORIA A LARGO PLAZO]\n${facts.map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n` : ''

    let currentPrompt
    if (!sessions[sessionKey].chatId) {
        const context = `[CONTEXTO EN VIVO]
Fecha: ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}
Usuario: ${pushName || 'Desconocido'} (${m.sender})
Es Dioneibi (tu amo): ${isOwner ? 'SÍ' : 'NO'}
Chat: ${m.chat} (${String(m.chat || '').endsWith('@g.us') ? 'GRUPO' : 'PRIVADO'})
Entorno: ${os.platform()} ${os.arch()} | Node ${process.version} | Repo ${REPO_SLUG}
${memoryBlock}`
        currentPrompt = `[REGLAS DEL SISTEMA]\n${SYSTEM_INSTRUCTION}\n\n${context}\nMensaje del usuario: ${text}`
    } else {
        currentPrompt = `[RECORDATORIO: Eres Ruby Hoshino, ERES el bot de WhatsApp con socket Baileys y terminal reales. Herramientas: ${TOOL_NAMES.join(', ')}. Usuario actual ${isOwner ? 'ES Dioneibi' : 'NO es Dioneibi'} (${m.sender}) en ${m.chat}.]\n\nMensaje del usuario: ${text}`
    }

    const executed = []
    let finalResponse = ''
    let auth = sessions[sessionKey].auth
    let chatId = sessions[sessionKey].chatId
    let hops = 0

    while (hops < MAX_HOPS) {
        let res
        try {
            res = await chatgpt(currentPrompt, auth, chatId)
        } catch (err) {
            if (hops === 0) throw err
            finalResponse = finalResponse || `> Amo, mi conexión se cortó a mitad del análisis: ${err.message}`
            break
        }
        auth = res.auth
        chatId = res.chatId
        const responseText = res.response
        const calls = extractToolCalls(responseText)

        if (!calls.length) {
            finalResponse = responseText
            break
        }

        const results = []
        for (const call of calls) {
            const output = await executeCall(call, m)
            executed.push(call.name)
            results.push(`── ${call.name} ──\n${clip(output, Math.floor(MAX_OUT / Math.max(calls.length, 1)))}`)
        }

        const visible = stripToolTags(responseText)
        if (visible) finalResponse = visible
        hops++

        if (hops >= MAX_HOPS) {
            finalResponse = `${finalResponse}\n\n> ⚠️ Alcancé mi límite de pasos autónomos. Resumen de lo último:\n${clip(results.join('\n'), 1200)}`.trim()
            break
        }

        currentPrompt = `[SISTEMA INTERNO — NO MOSTRAR AL USUARIO]
Resultados de las herramientas que acabas de usar (paso ${hops}/${MAX_HOPS}):
${results.join('\n\n')}

Analiza estos datos. Si necesitas más información usa otra etiqueta; si ya tienes lo necesario responde al usuario con tu voz de idol, en español, sin mostrar etiquetas ni JSON crudo.`
    }

    sessions[sessionKey].auth = auth
    sessions[sessionKey].chatId = chatId

    return { text: stripToolTags(finalResponse), executed: [...new Set(executed)] }
}

/* ── Proactividad: tareas en segundo plano ────────────────────── */

function queueBackgroundTask(m, instruction) {
    const conn = m.__conn || liveConn
    const chat = m.chat
    const snapshot = {
        chat,
        sender: m.sender,
        pushName: m.pushName,
        key: m.key,
        quoted: m.quoted,
        __conn: conn,
        reply: undefined
    }
    setTimeout(async () => {
        const started = Date.now()
        try {
            const res = await runAgent({
                m: snapshot,
                text: `[TAREA EN SEGUNDO PLANO] ${instruction}\n\nTrabaja hasta terminar y entrega un informe final claro y accionable. No uses [ASYNC].`,
                isOwner: isOwnerJid(snapshot.sender),
                pushName: snapshot.pushName,
                background: true
            })
            const secs = ((Date.now() - started) / 1000).toFixed(1)
            const body = `> 🌸 *Ruby terminó la tarea en segundo plano* (${secs}s)\n\n${res.text || 'No encontré nada que reportar, amo.'}${res.executed.length ? `\n\n> 🛠️ _${res.executed.join(', ')}_` : ''}`
            await conn?.sendMessage?.(chat, { text: clip(body, 8000) })
        } catch (err) {
            await conn?.sendMessage?.(chat, { text: `> 💔 Amo, mi tarea en segundo plano falló: ${err?.message || err}` }).catch(() => {})
        }
    }, 50)
}

/* ── Cron persistente ─────────────────────────────────────────── */

function registerCron(id, { expr, jid, body }) {
    try {
        cronTasks.get(id)?.stop?.()
        const task = cron.schedule(expr, () => {
            liveConn?.sendMessage?.(jid, { text: body }).catch(() => {})
        }, { timezone: 'America/Santo_Domingo' })
        cronTasks.set(id, task)
        return true
    } catch (e) {
        console.error('[Ruby cron]', e?.message || e)
        return false
    }
}

async function restoreCrons() {
    await loadMemory()
    for (const [id, task] of Object.entries(longMemory.tasks || {})) {
        if (task?.expr && task?.jid && cron.validate(task.expr)) registerCron(id, task)
    }
}

/* ── Reporte de bugs y listeners ──────────────────────────────── */

export async function reportErrorToOwner(conn, error, context = {}) {
    try {
        const target = conn || liveConn
        if (!target?.sendMessage) return false
        const detail = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack || ''}` : String(error)
        const meta = Object.entries(context).map(([k, v]) => `${k}: ${v}`).join('\n')
        const body = `🚨 *Ruby detectó un bug*\n${meta ? `\n${meta}\n` : ''}\n\`\`\`\n${clip(detail, 1200)}\n\`\`\`\n> Amo, revisé el fallo y te lo reporto. ✨`
        await target.sendMessage(OWNER_NUMBER, { text: body })
        return true
    } catch (e) {
        return false
    }
}

export function attachRubyConn(conn) {
    if (conn?.sendMessage) liveConn = conn
    initListeners()
    restoreCrons().catch(() => {})
    return !!liveConn
}

function initListeners() {
    if (listenersReady) return
    listenersReady = true
    process.on('uncaughtException', err => { reportErrorToOwner(liveConn, err, { origen: 'uncaughtException' }) })
    process.on('unhandledRejection', reason => { reportErrorToOwner(liveConn, reason instanceof Error ? reason : new Error(String(reason)), { origen: 'unhandledRejection' }) })
    console.log('[Ruby] Motor Keyless + toolkit autónomo listo. Herramientas:', TOOL_NAMES.length)
}

initListeners()

/* ── Handler Principal ────────────────────────────────────────── */

const handler = async (m, { conn, text, usedPrefix, command }) => {
    liveConn = conn
    m.__conn = conn
    const isOwner = isOwnerJid(m.sender)

    if (!text?.trim()) {
        return m.reply(`> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖣𝗂𝗆𝖾 𝖺𝗅𝗀𝗈, 𝗒𝗈 𝗆𝖾 𝖾𝗇𝖼𝖺𝗋𝗀𝗈 𝖽𝖾𝗅 𝗋𝖾𝗌𝗍𝗈... 🌸\n> 𝖤𝗃𝖾𝗆𝗉𝗅𝗈: *${usedPrefix}${command} Hola Ruby, ¿cómo uso el comando play?*${isOwner ? `\n> 𝖠𝗆𝗈: *${usedPrefix}${command} analiza el comando play, testea su api y súbelo a github*` : ''}`)
    }

    if (/^(reset|reiniciar|clear)$/i.test(text.trim())) {
        delete sessions[m.sender || m.chat]
        delete sessions[`bg:${m.sender || m.chat}`]
        return m.reply('> 🧹 𝖬𝖾𝗆𝗈𝗋𝗂𝖺 𝖽𝖾 𝖾𝗌𝗍𝖾 𝖼𝗁𝖺𝗍 𝗅𝗂𝗆𝗉𝗂𝖺. ¡Empecemos de nuevo! ✨')
    }

    await m.react?.('⏳')
    try {
        const res = await runAgent({ m, text: text.trim(), isOwner, pushName: m.pushName })
        const footer = isOwner && res.executed.length ? `\n\n> 🛠️ _Herramientas usadas: ${res.executed.join(', ')}_` : ''
        const body = (res.text || '> (っ- ‸ - ς) 𝖬𝖾 𝗊𝗎𝖾𝖽𝖾́ 𝗌𝗂𝗇 𝗉𝖺𝗅𝖺𝖻𝗋𝖺𝗌...') + footer
        await conn.sendMessage(m.chat, { text: clip(body, 8000) }, { quoted: m })
        await m.react?.('✅')
    } catch (error) {
        console.error('[Ruby Hoshino - Autonomous Error]:', error)
        delete sessions[m.sender || m.chat]
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
