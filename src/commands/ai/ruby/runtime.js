/**
 * Ruby Hoshino — Núcleo de runtime.
 *
 * Aquí vive todo lo que NO es IA: identidad del Owner, mapeo JID⇄LID de Baileys,
 * shell seguro, memoria persistente, cron, y el canal privado con Dioneibi.
 * El agente de LangChain (agent.js) y las tools (tools.js) consumen esto.
 */

import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import cron from 'node-cron'
import { normalizeJid, normalizeIdentityJid, resolveIdentityJids } from '../../../core/identity-utils.js'
import { rememberMapping, resolveAliasSync } from '../../../core/lid-registry.js'

export const OWNER_NUMBER = '18093519169@s.whatsapp.net'
export const OWNER_LID = '122544745111646@lid'
const OWNER_IDENTIFIERS = new Set([OWNER_NUMBER, OWNER_LID])

export const ROOT = process.cwd()
export const REPO_SLUG = 'Dioneibi-rip/Ruby-Hoshino-Bot'
const MEMORY_FILE = path.join(ROOT, 'ruby_memory.json')

export const EXEC_TIMEOUT = 120000

/* MAX_OUT es un PRESUPUESTO DE TOKENS, no un límite estético.
   Cada resultado de tool vuelve al modelo en la siguiente iteración, así que
   6000 chars (~1.6k tokens) permitían que un solo `read_file` se comiera el
   presupuesto de la petición por sí mismo. ~2000 chars ≈ 550 tokens deja
   espacio para varias tools en la misma petición sin provocar un 413.

   OJO: este es el recorte INTERNO (lo que las tools generan). El tope final que
   llega al modelo lo aplica `safeTool` en tools.js, que es más agresivo todavía.
   Ajustable con RUBY_MAX_TOOL_OUTPUT si algún día subes de plan. */
const MAX_OUT_ENV = Number.parseInt(process.env.RUBY_MAX_TOOL_OUTPUT ?? '', 10)
export const MAX_OUT = Number.isFinite(MAX_OUT_ENV) && MAX_OUT_ENV >= 500 ? MAX_OUT_ENV : 2000

/* Antiabuso: ventana deslizante por usuario. */
const ABUSE_WINDOW = 60000
const ABUSE_THRESHOLD = 12
export { ABUSE_WINDOW }

const cronTasks = new Map()
const usageWindow = new Map() // jid -> timestamps[]
const alertThrottle = new Map() // huella del error -> timestamp

let longMemory = { facts: {}, tasks: {} }
let memoryLoaded = false
let liveConn = null
let listenersReady = false

/* ── Utilidades ───────────────────────────────────────────────── */

export const clip = (s, n = MAX_OUT) => {
    const t = String(s ?? '')
    return t.length > n ? `${t.slice(0, n)}\n…[recortado ${t.length - n} chars]` : t
}

export function shellQuote(value) {
    return `'${String(value || '').replace(/'/g, `'\\''`)}'`
}

export function runShell(command, cwd = ROOT, timeout = EXEC_TIMEOUT) {
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

export function describeShape(value, depth = 0) {
    if (depth > 3) return '…'
    if (Array.isArray(value)) return `Array(${value.length})${value.length ? ` de ${describeShape(value[0], depth + 1)}` : ''}`
    if (value === null) return 'null'
    if (typeof value === 'object') {
        const keys = Object.keys(value).slice(0, 25)
        return `{ ${keys.map(k => `${k}: ${describeShape(value[k], depth + 1)}`).join(', ')} }`
    }
    return typeof value
}

/* ── Identidad del Owner ──────────────────────────────────────── */

function jidIdentifier(jid) {
    const normalized = normalizeJid(String(jid || ''))
    if (!normalized) return ''
    const [user, server = ''] = normalized.split('@')
    return `${user.replace(/:\d+$/, '').replace(/\D/g, '')}@${server}`
}

export function isOwnerJid(jid) {
    const raw = jidIdentifier(jid)
    if (!raw) return false
    return [...OWNER_IDENTIFIERS].some(owner => jidIdentifier(owner) === raw)
}

export async function identifyDioneibi(conn, m) {
    const candidates = [m?.sender, m?.participant, m?.key?.participant, m?.key?.remoteJid].filter(Boolean)
    if (candidates.some(isOwnerJid)) return true
    for (const candidate of candidates) {
        try {
            if (isOwnerJid(await normalizeIdentityJid(conn, candidate))) return true
        } catch {}
    }
    return false
}

export function isDioneibiMessage(m) {
    return m?.__isDioneibi === true || isOwnerJid(m?.sender) || isOwnerJid(m?.participant) || isOwnerJid(m?.key?.participant)
}

/** Corta la ejecución de una tool destructiva si quien habla no es el Owner. */
export function assertOwner(m) {
    if (!isDioneibiMessage(m)) {
        throw new Error('ACCESO DENEGADO: esta herramienta es exclusiva de mi amo Dioneibi. Explícale al usuario con cariño que no puedes hacerlo por él.')
    }
}

/* Los usuarios normales SÍ pueden leer y diagnosticar, pero nunca ver
   credenciales. Este es el único filtro entre "soporte técnico real" y una fuga
   de secretos. */
const SECRET_PATTERN = /(^|[\\/])(\.env|\.git|node_modules)|creds?\.json|app-state|pre-key|sender-key|session-|ruby_memory\.json|\btokens?\b|\bsecrets?\b|password|apikey|api[-_]key/i
export const SECRET_GREP_EXCLUDES = " --exclude='.env*' --exclude='*creds*' --exclude='*session*' --exclude='*token*' --exclude='ruby_memory.json' --exclude-dir=Rubysessions --exclude-dir=sessions"

export function assertReadable(target, m) {
    if (isDioneibiMessage(m)) return
    if (SECRET_PATTERN.test(String(target || ''))) {
        throw new Error('ERROR: ese recurso contiene credenciales del sistema y solo Dioneibi puede verlo. Niégate con dulzura, y si el usuario insiste repórtalo con dm_owner.')
    }
}

export function safePath(rel) {
    let raw = String(rel || '').trim().replace(/^["'`]|["'`]$/g, '')
    if (raw.startsWith('~/')) raw = raw.slice(2)
    if (raw.startsWith('./')) raw = raw.slice(2)
    const target = path.resolve(ROOT, raw.replace(/^[/\\]+/, ''))
    if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
        throw new Error('ERROR: ruta fuera del proyecto, acción bloqueada por seguridad.')
    }
    return target
}

/* ── Memoria persistente ──────────────────────────────────────── */

export async function loadMemory() {
    if (memoryLoaded) return longMemory
    try {
        const parsed = JSON.parse(await fs.readFile(MEMORY_FILE, 'utf8'))
        longMemory = { facts: parsed.facts || {}, tasks: parsed.tasks || {} }
    } catch {
        longMemory = { facts: {}, tasks: {} }
    }
    memoryLoaded = true
    return longMemory
}

export async function saveMemory() {
    try {
        await fs.writeFile(MEMORY_FILE, JSON.stringify(longMemory, null, 2), 'utf8')
        return true
    } catch {
        return false
    }
}

export function memoryRef() {
    return longMemory
}

/* ── Socket de WhatsApp ───────────────────────────────────────── */

export function setLiveConn(conn) {
    if (conn?.sendMessage) liveConn = conn
    return liveConn
}

export function getLiveConn() {
    return liveConn
}

export function requireConn(m) {
    const conn = m?.__conn || liveConn
    if (!conn?.sendMessage) throw new Error('ERROR: no tengo el socket de WhatsApp disponible en este momento.')
    return conn
}

export function botJidOf(conn) {
    return normalizeJid(conn?.user?.lid || conn?.user?.jid || conn?.user?.id || '')
}

/**
 * Canal privado con el Owner. Nunca lanza: si el socket está caído devuelve
 * false para que quien llame decida, y jamás tumba el proceso del bot.
 */
export async function dmOwner(conn, body) {
    const target = conn?.sendMessage ? conn : liveConn
    if (!target?.sendMessage) return false
    const text = clip(String(body || '').trim(), 7000)
    if (!text) return false
    for (const jid of [OWNER_NUMBER, OWNER_LID]) {
        try {
            await target.sendMessage(jid, { text })
            return true
        } catch {}
    }
    return false
}

/** Evita inundar el privado del Owner con el mismo error en bucle. */
export function shouldAlert(fingerprint, cooldown = 300000) {
    const key = String(fingerprint || '').slice(0, 300)
    const last = alertThrottle.get(key) || 0
    if (Date.now() - last < cooldown) return false
    alertThrottle.set(key, Date.now())
    if (alertThrottle.size > 200) {
        for (const [k, ts] of alertThrottle) if (Date.now() - ts > cooldown * 4) alertThrottle.delete(k)
    }
    return true
}

/** Detección de abuso: ráfagas de invocaciones desde un mismo usuario. */
export function trackUsage(jid) {
    const key = normalizeJid(jid) || String(jid || '')
    if (!key) return { abusive: false, hits: 0 }
    const now = Date.now()
    const hits = (usageWindow.get(key) || []).filter(ts => now - ts < ABUSE_WINDOW)
    hits.push(now)
    usageWindow.set(key, hits)
    if (usageWindow.size > 500) {
        for (const [k, list] of usageWindow) if (!list.some(ts => now - ts < ABUSE_WINDOW)) usageWindow.delete(k)
    }
    return { abusive: hits.length > ABUSE_THRESHOLD, hits: hits.length }
}

export async function getMeta(conn, chat) {
    if (!String(chat || '').endsWith('@g.us')) throw new Error('ERROR: esta acción solo funciona dentro de un grupo.')
    try {
        const mod = await import('../../../library/global-cache.js')
        if (typeof mod.getGroupMetadataOnDemand === 'function') {
            const meta = await mod.getGroupMetadataOnDemand(conn, chat, { requireParticipants: true })
            if (meta?.participants?.length) return meta
        }
    } catch {}
    return await conn.groupMetadata(chat)
}

/* ── Normalizador JID ⇄ LID (el problema de las menciones) ─────

   Baileys puede entregar la mención como LID (46111423209674@lid) mientras que
   `groupMetadata.participants` expone JIDs de teléfono (y viceversa, según la
   versión y si el grupo está en modo LID). Buscar el número "tal cual" falla.
   La solución: construir TODAS las identidades posibles de cada participante
   (`id`, `jid`, `lid`, `phoneNumber`) y cruzarlas contra TODAS las variantes del
   input. Además el JID que se envía a `groupParticipantsUpdate` es el MISMO que
   la metadata usa como `id`: mezclar espacios de direcciones produce 403/404
   silenciosos donde el kick "no hace nada".                                */

function digitsOf(value) {
    return String(value || '').split('@')[0].split(':')[0].replace(/\D/g, '')
}

function identitiesOf(participant) {
    const raws = [participant?.id, participant?.jid, participant?.lid, participant?.phoneNumber].filter(Boolean).map(String)
    const exact = new Set()
    const numeric = new Set()
    for (const raw of raws) {
        exact.add(raw.toLowerCase())
        const normalized = normalizeJid(raw)
        if (normalized) exact.add(normalized)
        const digits = digitsOf(raw)
        if (digits) numeric.add(digits)
    }
    exact.delete('')
    return { exact, numeric }
}

/** Identificador que WhatsApp acepta para acciones de moderación en este grupo. */
export function actionJidOf(participant) {
    return String(participant?.id || participant?.jid || participant?.lid || '')
}

/** Todas las variantes buscables de un identificador suelto. */
function candidateKeysOf(value) {
    const exact = new Set()
    const numeric = new Set()
    const raw = String(value || '').trim().toLowerCase()
    if (!raw) return { exact, numeric }
    exact.add(raw)
    const normalized = normalizeJid(raw)
    if (normalized) exact.add(normalized)
    const alias = resolveAliasSync(raw)
    if (alias) exact.add(alias)
    const digits = digitsOf(raw)
    if (digits) numeric.add(digits)
    return { exact, numeric }
}

/** Pregunta a Baileys por el otro lado del par LID/PN y aprende el mapeo. */
async function expandWithLidMapping(conn, value) {
    const out = new Set()
    const raw = String(value || '')
    if (!raw) return out
    const mapping = conn?.signalRepository?.lidMapping
    if (!mapping) return out
    try {
        if (raw.includes('@lid')) {
            const pn = await mapping.getPNForLID?.(raw)
            if (pn) { out.add(String(pn)); rememberMapping(raw, String(pn)) }
        } else {
            const lid = await mapping.getLIDForPN?.(raw.includes('@') ? raw : `${digitsOf(raw)}@s.whatsapp.net`)
            if (lid) { out.add(String(lid)); rememberMapping(String(lid), raw) }
        }
    } catch {}
    return out
}

/**
 * Cruza un identificador contra los participantes reales del grupo.
 * Primero por coincidencia exacta de JID/LID, después por dígitos (LID crudo).
 */
export function matchParticipant(meta, candidates) {
    const wantedExact = new Set()
    const wantedNumeric = new Set()
    for (const candidate of candidates) {
        const { exact, numeric } = candidateKeysOf(candidate)
        exact.forEach(v => wantedExact.add(v))
        numeric.forEach(v => wantedNumeric.add(v))
    }
    const participants = meta?.participants || []
    const indexed = participants.map(p => ({ participant: p, ...identitiesOf(p) }))
    for (const entry of indexed) {
        for (const want of wantedExact) if (entry.exact.has(want)) return entry.participant
    }
    for (const entry of indexed) {
        for (const want of wantedNumeric) if (entry.numeric.has(want)) return entry.participant
    }
    // Último recurso: sufijo de dígitos (prefijos de país inconsistentes: 1809… vs 809…).
    for (const entry of indexed) {
        for (const want of wantedNumeric) {
            if (want.length < 8) continue
            for (const have of entry.numeric) {
                if (have.length >= 8 && (have.endsWith(want) || want.endsWith(have))) return entry.participant
            }
        }
    }
    return null
}

/** Variantes de un input, incluyendo menciones y citado del mensaje original. */
async function buildCandidates(conn, raw, m) {
    const input = String(raw || '').trim().replace(/^@/, '')
    const candidates = [input]
    const digits = digitsOf(input)
    if (digits) {
        candidates.push(`${digits}@s.whatsapp.net`)
        candidates.push(`${digits}@lid`)
    }
    // Las menciones del mensaje son la fuente MÁS fiable: si el modelo escribió
    // el número de una mención (LID incluido), reusamos el JID exacto de Baileys.
    const mentions = [
        ...(Array.isArray(m?.mentionedJid) ? m.mentionedJid : []),
        ...(Array.isArray(m?.msg?.contextInfo?.mentionedJid) ? m.msg.contextInfo.mentionedJid : []),
        m?.quoted?.sender, m?.quoted?.participant
    ].filter(Boolean)
    for (const mention of mentions) {
        if (!digits || digitsOf(mention) === digits || digitsOf(mention).endsWith(digits) || digits.endsWith(digitsOf(mention))) {
            candidates.push(String(mention))
        }
    }
    if (!digits && mentions.length === 1) candidates.push(String(mentions[0]))
    try {
        candidates.push(...await resolveIdentityJids(conn, candidates.filter(Boolean)))
    } catch {}
    for (const candidate of [...candidates]) {
        candidates.push(...await expandWithLidMapping(conn, candidate))
    }
    return [...new Set(candidates.filter(Boolean))]
}

export async function resolveJidInput(raw, m) {
    const conn = requireConn(m)
    let input = String(raw || '').trim()
    if (!input || /^(aqui|aquí|este chat|current|this)$/i.test(input)) return m.chat
    if (/^(amo|dioneibi|owner|dueño)$/i.test(input)) return OWNER_NUMBER
    if (/^(yo|usuario|user|el|él|quien escribio|quien escribió)$/i.test(input)) return m.sender
    if (input.endsWith('@g.us')) return input
    input = input.replace(/^@/, '').replace(/[^0-9@.a-z:-]/gi, '')
    if (!input) throw new Error('ERROR: no pude entender el destinatario que me diste.')

    // Dentro de un grupo la verdad absoluta es la metadata: resolvemos contra ella.
    if (String(m?.chat || '').endsWith('@g.us')) {
        try {
            const meta = await getMeta(conn, m.chat)
            const participant = matchParticipant(meta, await buildCandidates(conn, input, m))
            if (participant) return actionJidOf(participant)
        } catch {}
    }
    const candidate = input.includes('@') ? input : `${input}@s.whatsapp.net`
    try {
        const [resolved] = await resolveIdentityJids(conn, [candidate])
        if (resolved) return resolved
    } catch {}
    return normalizeJid(candidate)
}

export async function assertBotAdmin(conn, chat) {
    const meta = await getMeta(conn, chat)
    const botCandidates = [conn?.user?.id, conn?.user?.jid, conn?.user?.lid].filter(Boolean)
    const me = matchParticipant(meta, botCandidates)
    const adminParticipants = (meta.participants || []).filter(p => p.admin === 'admin' || p.admin === 'superadmin')
    const admins = adminParticipants.map(actionJidOf)
    if (!me || !(me.admin === 'admin' || me.admin === 'superadmin')) {
        throw new Error('ERROR: NO SOY ADMINISTRADORA en este grupo, no puedo ejecutar acciones de moderación. Pídele amablemente al usuario que me den admin.')
    }
    return { meta, admins, bot: actionJidOf(me), adminParticipants }
}

/**
 * Valida el objetivo contra la metadata real y devuelve el JID accionable.
 * Recibe cualquier identidad (LID, PN, dígitos sueltos) y la mapea al grupo.
 */
export async function guardTarget(target, meta, admins, m) {
    const conn = requireConn(m)
    const candidates = await buildCandidates(conn, target, m)
    if (candidates.some(isOwnerJid) || isOwnerJid(target)) throw new Error('ERROR: jamás voy a actuar contra mi amo Dioneibi. Acción cancelada.')
    const participant = matchParticipant(meta, candidates)
    if (!participant) {
        throw new Error(`ERROR: no encontré a "${String(target).trim()}" entre los participantes reales de este grupo (ni por JID, ni por LID, ni por dígitos). Usa wa_group_info para ver la lista con sus identidades y vuelve a intentarlo con un identificador de ahí.`)
    }
    const jid = actionJidOf(participant)
    if (isOwnerJid(jid) || isOwnerJid(participant?.jid) || isOwnerJid(participant?.lid)) throw new Error('ERROR: jamás voy a actuar contra mi amo Dioneibi. Acción cancelada.')
    if (matchParticipant({ participants: [participant] }, [meta?.owner].filter(Boolean))) {
        throw new Error('ERROR: ese usuario es el creador del grupo, WhatsApp no permite moderarlo.')
    }
    return jid
}

/* ── Cron persistente ─────────────────────────────────────────── */

export function registerCron(id, { expr, jid, body }) {
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

export function stopCron(id) {
    cronTasks.get(id)?.stop?.()
    cronTasks.delete(id)
}

export async function restoreCrons() {
    await loadMemory()
    for (const [id, task] of Object.entries(longMemory.tasks || {})) {
        if (task?.expr && task?.jid && cron.validate(task.expr)) registerCron(id, task)
    }
}

/* ── Reporte de fallos al Owner ───────────────────────────────── */

/** Clasifica el fallo para que el aviso al Owner sea accionable, no ruido. */
function classifyError(error) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack || ''}` : String(error)
    if (/SyntaxError|Unexpected token|Unexpected identifier|Invalid or unexpected/i.test(detail)) {
        return { tipo: 'ERROR DE SINTAXIS', icono: '🧨', hint: 'Hay código roto: corrígelo antes de que el proceso vuelva a caer.' }
    }
    if (/Cannot find module|ERR_MODULE_NOT_FOUND|is not a function|is not defined/i.test(detail)) {
        return { tipo: 'IMPORT / REFERENCIA ROTA', icono: '🧩', hint: 'Un módulo o export no existe: revisa rutas y nombres exportados.' }
    }
    if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|fetch failed|socket hang up|network/i.test(detail)) {
        return { tipo: 'RED / API CAÍDA', icono: '📡', hint: 'Un servicio externo no responde. Puede ser temporal.' }
    }
    if (/heap out of memory|ENOSPC|EMFILE/i.test(detail)) {
        return { tipo: 'RECURSOS DEL SERVIDOR', icono: '🔥', hint: 'El servidor se está quedando sin memoria/disco/descriptores.' }
    }
    if (/OPENROUTER_API_KEY|401|invalid_api_key|No auth credentials|Unauthorized/i.test(detail)) {
        return { tipo: 'CREDENCIAL DE IA', icono: '🔑', hint: 'Revisa OPENROUTER_API_KEY en el .env o en las variables del panel (openrouter.ai/keys).' }
    }
    return { tipo: 'EXCEPCIÓN NO CONTROLADA', icono: '🚨', hint: 'Revisa el stack para ubicar el origen.' }
}

/** Aviso al privado del Owner. Nunca lanza y nunca spamea el mismo fallo. */
export async function reportErrorToOwner(conn, error, context = {}) {
    try {
        const detail = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack || ''}` : String(error)
        const { tipo, icono, hint } = classifyError(error)
        if (!shouldAlert(`${tipo}:${(error?.message || detail).slice(0, 160)}`)) return false
        const meta = Object.entries(context).map(([k, v]) => `${k}: ${v}`).join('\n')
        const body = [
            `${icono} *Ruby detectó un fallo* — ${tipo}`,
            meta ? `\n${meta}` : '',
            `\n\`\`\`\n${clip(detail, 1400)}\n\`\`\``,
            `\n> 💡 ${hint}`,
            `> Uptime: ${(process.uptime() / 60).toFixed(1)}min | RSS: ${(process.memoryUsage().rss / 1048576).toFixed(0)}MB`,
            `> Sigo de pie y cuidando el bot, amo. ✨`
        ].filter(Boolean).join('\n')
        return await dmOwner(conn, body)
    } catch {
        return false
    }
}

/**
 * Hook de auto-sanación invocado por el bootstrap ante un fallo fatal.
 * Lee el error, lo clasifica y se lo notifica al Owner en privado ANTES de que
 * el proceso muera, para que nunca haya una caída silenciosa.
 */
export async function selfHeal(error, origin = 'desconocido') {
    try {
        const { tipo, hint } = classifyError(error)
        console.error(`[Ruby][selfHeal][${origin}] ${tipo}:`, error?.message || error)
        await reportErrorToOwner(liveConn, error, {
            origen: origin,
            tipo,
            hora: new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' }),
            nodo: `${os.platform()} ${os.arch()} | Node ${process.version}`
        })
        // Si es sintaxis, dejamos rastro en disco: el proceso está por morir.
        if (/SINTAXIS/.test(tipo)) {
            await fs.appendFile(
                path.join(ROOT, 'ruby_crash.log'),
                `\n[${new Date().toISOString()}] ${origin} ${tipo}\n${error?.stack || error?.message || error}\n`,
                'utf8'
            ).catch(() => {})
        }
        return { reported: true, tipo, hint }
    } catch (e) {
        console.error('[Ruby][selfHeal] falló el reporte:', e?.message)
        return { reported: false }
    }
}

export function initListeners(toolCount = 0) {
    if (listenersReady) return
    listenersReady = true
    // Toda excepción fatal pasa por Ruby: la lee, la clasifica y la reporta al
    // privado del Owner. Los handlers nunca lanzan, así no agravan la caída.
    process.on('uncaughtException', err => {
        selfHeal(err, 'uncaughtException').catch(() => {})
    })
    process.on('unhandledRejection', reason => {
        selfHeal(reason instanceof Error ? reason : new Error(String(reason)), 'unhandledRejection').catch(() => {})
    })
    process.on('warning', warning => {
        if (/MaxListenersExceeded|memory/i.test(warning?.message || '')) {
            reportErrorToOwner(liveConn, warning, { origen: 'process.warning' }).catch(() => {})
        }
    })
    console.log('[Ruby] Runtime listo. LangChain + OpenRouter | Tools:', toolCount)
}
