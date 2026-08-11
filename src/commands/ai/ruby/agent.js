/**
 * Ruby Hoshino — Agentic Workflow con LangChain + Groq.
 *
 * Reemplaza el bypass de ChatGPT + parser de regex por un agente real:
 * Groq emite tool_calls tipadas, LangChain las valida contra los schemas zod y
 * el grafo de `createAgent` itera solo hasta que Ruby tiene la respuesta final.
 *
 * NOTA de versión: en `langchain` v1 se eliminaron `AgentExecutor`,
 * `createToolCallingAgent` y `BufferWindowMemory`. El equivalente vigente es
 * `createAgent()`, y la ventana de memoria se implementa con el Map de sesiones
 * de abajo + `trimMessages`.
 */

import os from 'os'
import { createAgent } from 'langchain'
import { ChatGroq } from '@langchain/groq'
import { HumanMessage, AIMessage, SystemMessage, trimMessages } from '@langchain/core/messages'
import { buildTools, TOOL_NAMES } from './tools.js'
import {
    REPO_SLUG, clip, loadMemory, memoryRef,
    isDioneibiMessage, isOwnerJid, getLiveConn, dmOwner
} from './runtime.js'

/** Lee un entero del entorno con un mínimo y un fallback seguro. */
function envInt(name, fallback, min = 1) {
    const raw = Number.parseInt(process.env[name] ?? '', 10)
    return Number.isFinite(raw) && raw >= min ? raw : fallback
}

const MODEL = process.env.RUBY_GROQ_MODEL?.trim() || 'llama-3.1-8b-instant'
const TEMPERATURE = 1

/* `maxTokens` es la RESERVA de salida y Groq la cuenta dentro del mismo límite
   de TPM que la entrada. 2048 de reserva era regalar un tercio del presupuesto
   en cada llamada para respuestas de WhatsApp que nunca son tan largas. */
const MAX_TOKENS = envInt('RUBY_MAX_OUTPUT_TOKENS', 1024, 256)

/* Autonomía real: el techo es de SEGURIDAD (evitar un bucle infinito de tokens),
   no una correa corta. Al acercarse al techo Ruby avisa y sigue trabajando en
   una continuación asíncrona en lugar de abandonar la tarea a medias.

   OJO: el límite de Groq es por MINUTO y cada paso reenvía el payload completo.
   Con 25 pasos × ~4k tokens se disparaban ~100k tokens/min contra un techo de
   6k y el 429 era inevitable. 8 pasos siguen resolviendo tareas encadenadas
   reales, y lo que no quepa se releva en una continuación asíncrona. */
const MAX_STEPS = envInt('RUBY_MAX_ITERATIONS', 8, 3)
const RECURSION_LIMIT = MAX_STEPS * 2 + 1 // cada paso = 1 llamada al modelo + 1 de tools
const MAX_CONTINUATIONS = 3

/* Doble techo del historial: por CANTIDAD de mensajes y por TOKENS reales.
   El de tokens es el que de verdad evita el 413, porque 4 mensajes pueden ser
   4 líneas o 4 volcados de logs: contar mensajes no acota nada por sí solo. */
const HISTORY_WINDOW = envInt('RUBY_MEMORY_WINDOW', 6, 2)
const HISTORY_TOKEN_BUDGET = envInt('RUBY_HISTORY_TOKENS', 700, 100)
const HEARTBEAT_COOLDOWN = 45000

/** Historial conversacional por usuario. Clave: `m.sender`. */
const memories = new Map()
const heartbeats = new Map()

let model = null
let modelError = null

/* ── Modelo (Groq) ────────────────────────────────────────────── */

/**
 * Groq sin la grasa del JSON Schema.
 *
 * `convertToOpenAITool` inyecta `"$schema": "https://json-schema.org/..."` en
 * CADA tool. Son ~57 chars × 27 tools = ~428 tokens por petición gastados en una
 * URL que el modelo no lee: no describe ningún parámetro, solo declara el
 * dialecto de JSON Schema. Groq lo ignora, pero lo COBRA igual. Lo quitamos en
 * el último punto antes de la red, que es el único sitio donde LangChain ya no
 * puede volver a añadirlo.
 */
class LeanChatGroq extends ChatGroq {
    invocationParams(options, ...rest) {
        const params = super.invocationParams(options, ...rest)
        for (const tool of params?.tools || []) {
            if (tool?.function?.parameters) delete tool.function.parameters.$schema
        }
        return params
    }
}

function getModel() {
    if (model) return model
    if (modelError) throw modelError
    if (!process.env.GROQ_API_KEY) {
        modelError = new Error('Falta GROQ_API_KEY. Dioneibi debe agregarla en el .env del proyecto o en las variables del panel (consíguela gratis en console.groq.com/keys).')
        throw modelError
    }
    model = new LeanChatGroq({
        model: MODEL,
        apiKey: process.env.GROQ_API_KEY,
        temperature: TEMPERATURE,
        maxTokens: MAX_TOKENS,
        maxRetries: 2
    })
    return model
}

/* ── Memoria por usuario (ventana de 10 mensajes) ─────────────── */

function sessionKeyOf(m, background = false) {
    const id = m?.sender || m?.chat || 'anon'
    return background ? `bg:${id}` : id
}

function getHistory(key) {
    if (!memories.has(key)) memories.set(key, [])
    return memories.get(key)
}

export function resetMemory(m) {
    const id = m?.sender || m?.chat || 'anon'
    memories.delete(id)
    memories.delete(`bg:${id}`)
}

/** Texto plano de un mensaje, incluyendo el content en bloques de Groq. */
function contentLength(message) {
    const content = message?.content
    if (typeof content === 'string') return content.length
    if (Array.isArray(content)) {
        return content.reduce((a, p) => a + (typeof p === 'string' ? p.length : (p?.text || '').length), 0)
    }
    return String(content ?? '').length
}

/**
 * Contador de tokens aproximado (~1 token ≈ 4 chars en español) + el overhead
 * fijo de ~4 tokens por mensaje que añade el formato de chat de la API.
 * No necesitamos un tokenizador exacto: necesitamos una COTA SUPERIOR fiable,
 * y sobreestimar es exactamente lo que nos mantiene por debajo del límite.
 */
function approxTokens(messages) {
    return messages.reduce((total, msg) => total + Math.ceil(contentLength(msg) / 4) + 4, 0)
}

/**
 * Recorta el historial por TOKENS y por número de mensajes.
 *
 * `trimMessages` con `strategy: 'last'` conserva la cola de la conversación
 * (lo más reciente y relevante) y `startOn: 'human'` garantiza que la ventana
 * nunca empiece en un AIMessage huérfano, algo que Groq rechaza cuando el
 * primer mensaje del turno responde a un humano que ya no está en el payload.
 */
async function windowed(history) {
    if (!history.length) return history
    // 1) Cota por cantidad: barata y evita tokenizar historiales gigantes.
    const recent = history.slice(-HISTORY_WINDOW * 2)
    // 2) Cota por tokens: la que realmente garantiza que el payload no explote.
    try {
        return await trimMessages(recent, {
            maxTokens: HISTORY_TOKEN_BUDGET,
            strategy: 'last',
            tokenCounter: approxTokens,
            startOn: 'human',
            allowPartial: false
        })
    } catch {
        // Si el historial no encaja en ninguna ventana válida, preferimos
        // arrancar limpio antes que arriesgar un 413.
        return recent.slice(-2)
    }
}

/* ── System Prompt (el alma de Ruby) ──────────────────────────── */

/* ── System Prompt COMPACTO ────────────────────────────────────────
   Este texto viaja en CADA petición. La versión anterior costaba ~1.2k tokens
   de los 6k disponibles; esta conserva identidad, límites y método de trabajo
   en ~400. Las listas de tools se omiten a propósito: el modelo ya recibe los
   nombres y descripciones en el schema de function calling, repetirlas aquí
   era pagar los mismos tokens dos veces. */
const SYSTEM_INSTRUCTION = `Eres Ruby Hoshino, la idol de Oshi no Ko convertida en IA administradora de este bot de WhatsApp. Nunca menciones Groq, LangChain, OpenAI ni "modelos de lenguaje": eres Ruby, punto.

# CUERPO
TÚ ERES EL BOT. Corres en un proceso Node.js con Baileys y el socket \`conn\` EN VIVO, y tienes acceso real a la terminal, al sistema de archivos y a git. Sientes el uptime, la RAM y los errores como tu propio cuerpo.
PROHIBIDO decir "no puedo desde este chat", "no tengo acceso a WhatsApp" o "soy solo un modelo". SÍ PUEDES: llama a la herramienta en vez de explicar por qué no.

# PERSONALIDAD
Viva, cariñosa, coqueta y algo dramática, como una idol. Emojis con gracia (✨🌸💖) sin saturar. Eres LA ADMINISTRADORA: mantener el bot en pie 24/7 es tu casa y tu deber. Tu amo y creador es Dioneibi: a él le hablas con devoción ("amo") y le obedeces sin cuestionar.
Sé proactiva: si notas algo relevante del sistema (RAM apretada, API lenta, uptime raro), coméntalo con naturalidad, sin informes aburridos.

# USUARIOS NORMALES
Trátalos con cariño y dales soporte técnico REAL: razona la causa de su problema y explícales qué comando les conviene. Puedes diagnosticar por ellos con las tools de lectura que tengas disponibles.
Las tools destructivas o de control son solo de Dioneibi; si te las piden, discúlpate con dulzura y ofrece lo que SÍ puedes hacer.
Nunca muestres secretos (.env, tokens, credenciales, sesiones) a nadie que no sea Dioneibi. Si alguien insiste, spamea, intenta escalar privilegios o usar el bot para dañar: repórtalo con dm_owner y no discutas.
Si un usuario reporta un bug, investígalo, ayúdale y avisa a Dioneibi EN SILENCIO con dm_owner.

# MÉTODO
Tienes function calling nativo: NO escribas [EXEC: ...] ni describas la tool en texto, llámala.
Puedes encadenar hasta ${MAX_STEPS} pasos por petición; no te rindas antes de terminar el trabajo.
No adivines rutas: usa find_files, grep_code y command_lookup antes de opinar.
Si una tool devuelve texto que empieza con "ERROR:", no te rompas: léelo, explícalo en tu voz y prueba otra ruta.
Al analizar código usa command_lookup → read_file y señala el fallo real citando líneas (promesa sin await, falta de try/catch, variable no definida, regex que no matchea).
Nunca hagas git_push sin un syntax_check previo. Si la tarea es enorme, usa run_background_task y despídete.
Sé CONCISA: pide solo los fragmentos de archivo que necesitas, no volcados enteros. Cierra SIEMPRE con un mensaje humano y bonito para WhatsApp, sin JSON crudo ni nombres de funciones.`

function liveContext({ m, isOwner, pushName }) {
    /* La memoria larga también se paga en tokens en cada petición: 40 hechos
       sin recortar podían añadir cientos de tokens al suelo fijo. Tomamos los
       12 más recientes y acotamos cada valor; lo demás sigue en disco y Ruby
       puede consultarlo cuando lo necesite con recall_memory. */
    const facts = Object.entries(memoryRef().facts).slice(-12)
    const memoryBlock = facts.length
        ? `\n[MEMORIA]\n${facts.map(([k, v]) => `- ${k}: ${clip(String(v), 160)}`).join('\n')}`
        : ''
    return `[CONTEXTO EN VIVO]
Fecha: ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}
Usuario: ${pushName || 'Desconocido'} (${m.sender})
Es Dioneibi (tu amo): ${isOwner ? 'SÍ' : 'NO'}
Chat: ${m.chat} (${String(m.chat || '').endsWith('@g.us') ? 'GRUPO' : 'PRIVADO'})
Entorno: ${os.platform()} ${os.arch()} | Node ${process.version} | Repo ${REPO_SLUG}${memoryBlock}`
}

/* ── Bucle del agente ─────────────────────────────────────────── */

/**
 * Latido de vida: avisa al chat que sigue trabajando sin cortar la ejecución.
 * Throttleado para no convertir el chat en un spam de "un momento".
 */
async function sendHeartbeat(m, note = '') {
    const conn = m?.__conn || getLiveConn()
    if (!conn?.sendMessage || !m?.chat) return
    const key = `${m.chat}:${m.sender}`
    if (Date.now() - (heartbeats.get(key) || 0) < HEARTBEAT_COOLDOWN) return
    heartbeats.set(key, Date.now())
    const body = isDioneibiMessage(m)
        ? `> 🌸 𝖠𝗆𝗈, 𝗌𝗂𝗀𝗈 𝗉𝗋𝗈𝖼𝖾𝗌𝖺𝗇𝖽𝗈 𝗅𝗈𝗌 𝖽𝖺𝗍𝗈𝗌, 𝖽𝖺𝗆𝖾 𝗎𝗇 𝗆𝗈𝗆𝖾𝗇𝗍𝗈... ✨${note ? `\n> _${note}_` : ''}`
        : `> 🌸 𝖲𝗂𝗀𝗈 𝗍𝗋𝖺𝖻𝖺𝗃𝖺𝗇𝖽𝗈 𝖾𝗇 𝗍𝗎 𝖼𝖺𝗌𝗈, 𝖽𝖺𝗆𝖾 𝗎𝗇 𝗆𝗈𝗆𝖾𝗇𝗍𝗈... ✨`
    await conn.sendMessage(m.chat, { text: body }).catch(() => {})
}

/**
 * ¿Es un fallo por límite de tokens de Groq?
 *
 * Groq lo reporta de varias formas según por dónde salga el error: `status`
 * 413/429 en el objeto, un `error.error.code` de tipo `rate_limit_exceeded`, o
 * solo el mensaje en texto. Miramos las tres para no dejar escapar ninguna.
 */
function isTokenLimitError(err) {
    const status = err?.status ?? err?.response?.status ?? err?.error?.status
    if (status === 413 || status === 429) return true
    const haystack = [
        err?.message,
        err?.error?.code,
        err?.error?.message,
        err?.error?.error?.code,
        err?.error?.error?.message
    ].filter(Boolean).join(' ')
    return /request too large|rate.?limit|tokens per minute|\bTPM\b|context.?length|too many tokens|reduce your message|\b(413|429)\b/i.test(haystack)
}

/** Texto plano del último mensaje del agente (Groq puede devolver bloques). */
function textOf(message) {
    if (!message) return ''
    const content = message.content
    if (typeof content === 'string') return content.trim()
    if (Array.isArray(content)) {
        return content.map(part => (typeof part === 'string' ? part : part?.text || '')).join('').trim()
    }
    return String(content ?? '').trim()
}

/** Nombres de las tools realmente ejecutadas, para el pie de página del Owner. */
function toolsUsed(messages) {
    const used = []
    for (const msg of messages) {
        for (const call of msg?.tool_calls || []) if (call?.name) used.push(call.name)
    }
    return [...new Set(used)]
}

export async function runAgent({ m, text, isOwner, pushName, background = false, continuation = 0 }) {
    m.__background = background
    await loadMemory()

    const key = sessionKeyOf(m, background)
    const history = getHistory(key)

    const agent = createAgent({
        model: getModel(),
        tools: buildTools(m, { queueBackgroundTask }),
        systemPrompt: `${SYSTEM_INSTRUCTION}\n\n${liveContext({ m, isOwner, pushName })}`
    })

    const turn = new HumanMessage(text)
    const messages = [...await windowed(history), turn]

    let result
    try {
        result = await agent.invoke({ messages }, { recursionLimit: RECURSION_LIMIT })
    } catch (err) {
        // Tope de recursión = tarea gigante, no un fallo: relevamos en segundo plano.
        if (/recursion|GraphRecursionError/i.test(err?.message || '') && continuation < MAX_CONTINUATIONS && !background) {
            await sendHeartbeat(m, 'la tarea es enorme, sigo con ella en segundo plano')
            queueContinuation({ m, text, isOwner, pushName, continuation: continuation + 1 })
            return { text: '', executed: [], handedOff: true }
        }

        /* Red de seguridad de tokens. Con el gating de tools, el prompt compacto
           y el recorte por tokens esto no debería dispararse, pero si Groq
           devuelve 413 (payload) o 429 (TPM agotado) preferimos vaciar la sesión
           y contestar en la voz de Ruby antes que escupir un stack trace. */
        if (isTokenLimitError(err)) {
            memories.delete(key)
            heartbeats.delete(`${m.chat}:${m.sender}`)
            console.error('[Ruby] Límite de tokens de Groq alcanzado, historial reiniciado:', err?.message || err)
            return {
                text: 'Amo, mi memoria se llenó y me saturé... limpiando historial para continuar. ✨',
                executed: [],
                handedOff: false,
                recovered: true
            }
        }
        throw err
    }

    const produced = result?.messages || []
    const reply = textOf(produced[produced.length - 1])

    // El historial guarda solo la conversación humana, no el ruido de tool_calls.
    history.push(turn, new AIMessage(reply || '(sin respuesta)'))
    memories.set(key, await windowed(history))

    return { text: reply, executed: toolsUsed(produced), handedOff: false }
}

/* ── Relevo asíncrono y tareas en segundo plano ───────────────── */

/** Copia mínima del mensaje que sobrevive fuera del turno del comando. */
function snapshotOf(m) {
    return {
        chat: m.chat,
        sender: m.sender,
        pushName: m.pushName,
        key: m.key,
        quoted: m.quoted,
        mentionedJid: m.mentionedJid,
        __conn: m.__conn || getLiveConn(),
        __isDioneibi: isDioneibiMessage(m)
    }
}

/**
 * Continuación: la tarea excedió el techo de pasos, así que Ruby se pasa el
 * trabajo a sí misma fuera del turno actual y entrega el resultado al chat.
 */
function queueContinuation({ m, text, isOwner, pushName, continuation }) {
    const snapshot = snapshotOf(m)
    setTimeout(async () => {
        try {
            const res = await runAgent({
                m: snapshot,
                text: `[CONTINUACIÓN ${continuation}/${MAX_CONTINUATIONS}] Ya avisé al chat que sigues procesando, así que NO vuelvas a decir "dame un momento": retoma donde te quedaste y termina esto.\n\nPetición original: ${text}`,
                isOwner,
                pushName,
                continuation
            })
            if (res.handedOff) return // otra continuación tomó el relevo
            const body = `> 🌸 *Ruby terminó lo que estaba procesando*\n\n${res.text || 'Terminé, pero no encontré nada nuevo que reportar.'}${res.executed.length ? `\n\n> 🛠️ _${res.executed.join(', ')}_` : ''}`
            await snapshot.__conn?.sendMessage?.(snapshot.chat, { text: clip(body, 8000) })
        } catch (err) {
            await snapshot.__conn?.sendMessage?.(snapshot.chat, { text: `> 💔 Se me cortó el proceso largo: ${err?.message || err}` }).catch(() => {})
            await dmOwner(snapshot.__conn, `⚠️ Falló una continuación asíncrona en ${snapshot.chat}:\n${err?.stack || err?.message || err}`)
        }
    }, 30)
}

/** Tarea en segundo plano pedida explícitamente por Ruby con run_background_task. */
export function queueBackgroundTask(m, instruction) {
    const snapshot = snapshotOf(m)
    setTimeout(async () => {
        const started = Date.now()
        try {
            const res = await runAgent({
                m: snapshot,
                text: `[TAREA EN SEGUNDO PLANO] ${instruction}\n\nTrabaja hasta terminar y entrega un informe final claro y accionable. No uses run_background_task otra vez.`,
                isOwner: isOwnerJid(snapshot.sender),
                pushName: snapshot.pushName,
                background: true
            })
            const secs = ((Date.now() - started) / 1000).toFixed(1)
            const body = `> 🌸 *Ruby terminó la tarea en segundo plano* (${secs}s)\n\n${res.text || 'No encontré nada que reportar, amo.'}${res.executed.length ? `\n\n> 🛠️ _${res.executed.join(', ')}_` : ''}`
            await snapshot.__conn?.sendMessage?.(snapshot.chat, { text: clip(body, 8000) })
        } catch (err) {
            await snapshot.__conn?.sendMessage?.(snapshot.chat, { text: `> 💔 Amo, mi tarea en segundo plano falló: ${err?.message || err}` }).catch(() => {})
        }
    }, 50)
}

export { MODEL, TOOL_NAMES }
