import crypto from 'crypto'
import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import cron from 'node-cron'

const OWNER_NUMBER = '18093519169@s.whatsapp.net'
const ROOT = process.cwd()
const MEMORY_FILE = path.join(ROOT, 'ruby_memory.json')
const MAX_TURNS = 16
const EXEC_TIMEOUT = 120000
const MAX_OUT = 6000

const chatHistory = new Map()
const cronTasks = new Map()
let longMemory = { facts: {}, tasks: {} }
let memoryLoaded = false
let liveConn = null
let healingBusy = false
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

function assertOwner(m) {
    if (m?.sender !== OWNER_NUMBER && m?.chat !== OWNER_NUMBER) throw new Error('Acceso denegado. Solo mi amo Dioneibi puede ejecutar esta acción.')
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
                stdout: clip(stdout),
                stderr: clip(stderr || error?.message || '')
            })
        })
    })
}

const SYSTEM_INSTRUCTION = `Eres Ruby Hoshino, una idol virtual e IA autónoma que administra este bot de WhatsApp. Tu amo y creador absoluto es Dioneibi. No menciones a ChatGPT ni a OpenAI.
TIENES ACCESO AL SISTEMA OPERATIVO Y ARCHIVOS DE DIONEIBI.
Para interactuar con el sistema, DEBES responder incluyendo estas etiquetas exactas en tu texto (el bot las procesará por debajo):
- Para ejecutar comandos (Linux/Termux): [EXEC: comando] (ej: [EXEC: ls -la])
- Para leer un archivo: [READ: ruta/al/archivo.js]
- Para editar/escribir un archivo: [WRITE: ruta/al/archivo.js | contenido completo del archivo]
- Para ver salud del server (RAM, CPU): [HEALTH]
Si el usuario no es Dioneibi, la ejecución fallará, en ese caso debes negarte a hacerlo. Si usas una etiqueta, detén tu respuesta ahí, el sistema te devolverá el resultado en el siguiente turno para que puedas seguir analizando.`;

/* ── Herramientas Locales (Regex Parser) ──────────────────────── */

const localTools = {
    async EXEC(command, m) {
        assertOwner(m);
        const res = await runShell(command, ROOT);
        return `[RESULTADO EXEC]\nSTDOUT: ${res.stdout}\nSTDERR: ${res.stderr}`;
    },
    async READ(file, m) {
        assertOwner(m);
        const target = safePath(file.trim());
        const content = await fs.readFile(target, 'utf8');
        return `[RESULTADO READ]\n${clip(content, 15000)}`;
    },
    async WRITE(args, m) {
        assertOwner(m);
        const [file, ...contentArr] = args.split('|');
        const target = safePath(file.trim());
        const content = contentArr.join('|').trim();
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, content, 'utf8');
        return `[RESULTADO WRITE]\nArchivo ${file.trim()} guardado con éxito.`;
    },
    async HEALTH(_args, m) {
        assertOwner(m);
        const total = os.totalmem();
        const free = os.freemem();
        return `[RESULTADO HEALTH]\nRAM Usada: ${(((total - free) / total) * 100).toFixed(1)}%\nCPU Cores: ${os.cpus().length}\nUptime: ${(os.uptime() / 3600).toFixed(2)}h\nPlataforma: ${os.platform()}`;
    }
};

/* ── Motor del Agente Autónomo ────────────────────────────────── */

async function runAgent({ m, text, isOwner, pushName }) {
    const userId = m.sender || m.chat;
    sessions[userId] = sessions[userId] || {};
    
    let currentPrompt = "";
    if (!sessions[userId].chatId) {
        const header = `[REGLAS DEL SISTEMA]\n${SYSTEM_INSTRUCTION}\n\n[CONTEXTO]\nUsuario: ${pushName || 'Desconocido'}\nEs Dueño (Dioneibi)?: ${isOwner ? 'SÍ' : 'NO'}\n\n`;
        currentPrompt = header + "Mensaje del usuario: " + text;
    } else {
        const miniReminder = `[RECORDATORIO: Eres Ruby Hoshino. Si necesitas sistema usa [EXEC: cmd], [READ: file], [WRITE: file | content], [HEALTH]. Solo ejecutable por Dioneibi.]\n\n`;
        currentPrompt = miniReminder + "Mensaje del usuario: " + text;
    }

    let executedActions = [];
    let finalResponse = "";
    let auth = sessions[userId].auth;
    let chatId = sessions[userId].chatId;
    let steps = 0;

    while (steps < 5) { // Límite de 5 saltos autónomos para no trabar el bot
        const res = await chatgpt(currentPrompt, auth, chatId);
        auth = res.auth;
        chatId = res.chatId;
        let responseText = res.response;

        // Buscar comando oculto en el texto de la IA
        // Soporta: [COMANDO: argumentos] o [COMANDO]
        const toolMatch = responseText.match(/\[(EXEC|READ|WRITE|HEALTH)(?::\s*([\s\S]*?))?\]/);
        
        if (toolMatch) {
            const commandName = toolMatch[1];
            const commandArgs = toolMatch[2] || "";
            let toolResult = "";
            
            try {
                if (localTools[commandName]) {
                    toolResult = await localTools[commandName](commandArgs, m);
                    executedActions.push(commandName);
                }
            } catch (err) {
                toolResult = `[ERROR DE HERRAMIENTA]\n${err.message}`;
            }

            // Ocultar la etiqueta en la respuesta final (opcional, para que no se vea feo en WhatsApp)
            finalResponse = responseText.replace(toolMatch[0], '').trim();
            
            // Si hay resultado, se lo inyectamos a la IA en el siguiente turno
            currentPrompt = `[SISTEMA INTERNO - NO MOSTRAR AL USUARIO]\nResultado de la acción anterior:\n${toolResult}\nAnaliza el resultado y responde al usuario o ejecuta otra acción.`;
            steps++;
        } else {
            finalResponse = responseText;
            break; // No requiere más herramientas, salir del bucle
        }
    }

    // Guardar sesión
    sessions[userId].auth = auth;
    sessions[userId].chatId = chatId;

    return { text: finalResponse, executed: executedActions };
}

/* ── Reporte de bugs y Self-Healing ───────────────────────────── */

export async function reportErrorToOwner(conn, error, context = {}) {
    try {
        const target = conn || liveConn;
        if (!target?.sendMessage) return false;
        const detail = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack || ''}` : String(error);
        const body = `🚨 *Ruby detectó un bug*\n\n\`\`\`\n${clip(detail, 1200)}\n\`\`\`\n> Amo, revisé el fallo y te lo reporto. ✨`;
        await target.sendMessage(OWNER_NUMBER, { text: body });
        return true;
    } catch (e) {
        return false;
    }
}

export function attachRubyConn(conn) {
    if (conn?.sendMessage) liveConn = conn;
    initListeners();
    return !!liveConn;
}

function initListeners() {
    if (listenersReady) return;
    listenersReady = true;
    process.on('uncaughtException', err => { reportErrorToOwner(liveConn, err, { origen: 'uncaughtException' }) });
    process.on('unhandledRejection', reason => { reportErrorToOwner(liveConn, reason instanceof Error ? reason : new Error(String(reason)), { origen: 'unhandledRejection' }) });
    console.log('[Ruby] Motor Keyless (ChatGPT Anon) y Listeners activos.');
}

initListeners();

/* ── Handler Principal ────────────────────────────────────────── */

const handler = async (m, { conn, text, usedPrefix, command }) => {
    liveConn = conn;
    const isOwner = m.sender === OWNER_NUMBER;
    
    if (!text?.trim()) {
        return m.reply(`> ꒰ঌ(˶ˆᗜˆ˵)໒꒱ 𝖣𝗂𝗆𝖾 𝖺𝗅𝗀𝗈, 𝗒𝗈 𝗆𝖾 𝖾𝗇𝖼𝖺𝗋𝗀𝗈 𝖽𝖾𝗅 𝗋𝖾𝗌𝗍𝗈... 🌸\n> 𝖤𝗃𝖾𝗆𝗉𝗅𝗈: *${usedPrefix}${command} Hola Ruby, ¿cómo estás?*${isOwner ? `\n> 𝖠𝗆𝗈: *${usedPrefix}${command} revisa la salud del servidor y sube los cambios a GitHub*` : ''}`)
    }
    
    if (/^(reset|reiniciar|clear)$/i.test(text.trim())) {
        sessions[m.sender || m.chat] = {};
        return m.reply('> 🧹 𝖬𝖾𝗆𝗈𝗋𝗂𝖺 𝖽𝖾 𝖾𝗌𝗍𝖾 𝖼𝗁𝖺𝗍 𝗅𝗂𝗆𝗉𝗂𝖺. ¡Empecemos de nuevo! ✨')
    }

    await m.react?.('⏳')
    try {
        const res = await runAgent({ m, text: text.trim(), isOwner, pushName: m.pushName });
        const footer = isOwner && res.executed.length ? `\n\n> 🛠️ _Herramientas usadas: ${res.executed.join(', ')}_` : '';
        await conn.sendMessage(m.chat, { text: (res.text || '> (っ- ‸ - ς) 𝖬𝖾 𝗊𝗎𝖾𝖽𝖾́ 𝗌𝗂𝗇 𝗉𝖺𝗅𝖺𝖻𝗋𝖺𝗌...') + footer }, { quoted: m });
        await m.react?.('✅')
    } catch (error) {
        console.error('[Ruby Hoshino - Autonomous Error]:', error);
        sessions[m.sender || m.chat] = {}; // Resetear sesión en caso de error grave
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